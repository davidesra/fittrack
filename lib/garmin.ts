/**
 * Garmin Connect API integration — OAuth 1.0a implementation using Node crypto.
 * Docs: https://developer.garmin.com/health-api/overview/
 */

import crypto from "crypto";

const GARMIN_REQUEST_TOKEN_URL =
  "https://connectapi.garmin.com/oauth-service/oauth/request_token";
const GARMIN_AUTHORIZE_URL =
  "https://connectapi.garmin.com/oauth-service/oauth/authorize";
const GARMIN_ACCESS_TOKEN_URL =
  "https://connectapi.garmin.com/oauth-service/oauth/access_token";
const GARMIN_BASE_URL = "https://healthapi.garmin.com/wellness-api/rest";

// ─── OAuth 1.0a signing helpers ──────────────────────────────────────────────

function pct(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function nonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function timestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Build an OAuth 1.0a Authorization header.
 *
 * @param method       HTTP method (GET / POST)
 * @param url          Full request URL (no query string)
 * @param consumerKey  App consumer key
 * @param consumerSecret App consumer secret
 * @param extraOAuth   Additional oauth_* parameters (e.g. oauth_callback, oauth_verifier)
 * @param bodyParams   Non-oauth body / query parameters included in the signature
 * @param tokenKey     Access/request token key (omit for request-token step)
 * @param tokenSecret  Access/request token secret (omit for request-token step)
 */
function buildAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  extraOAuth: Record<string, string> = {},
  bodyParams: Record<string, string> = {},
  tokenKey?: string,
  tokenSecret?: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp(),
    oauth_version: "1.0",
    ...extraOAuth,
  };
  if (tokenKey) oauthParams.oauth_token = tokenKey;

  // All parameters (oauth + body) go into the signature base string
  const allParams: Record<string, string> = { ...oauthParams, ...bodyParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pct(k)}=${pct(allParams[k])}`)
    .join("&");

  const baseString = [method.toUpperCase(), pct(url), pct(paramString)].join("&");
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret ?? "")}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  oauthParams.oauth_signature = signature;

  const header =
    "OAuth " +
    Object.keys(oauthParams)
      .map((k) => `${pct(k)}="${pct(oauthParams[k])}"`)
      .join(", ");

  return header;
}

function parseFormEncoded(text: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(text));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GarminRequestToken {
  oauthToken: string;
  oauthTokenSecret: string;
  authorizeUrl: string;
}

/**
 * Step 1 of Garmin OAuth flow: obtain a request token and return the URL
 * to redirect the user to for authorization.
 */
export async function getGarminRequestToken(
  callbackUrl: string
): Promise<GarminRequestToken> {
  const consumerKey = process.env.GARMIN_CLIENT_ID!;
  const consumerSecret = process.env.GARMIN_CLIENT_SECRET!;

  const authHeader = buildAuthHeader(
    "POST",
    GARMIN_REQUEST_TOKEN_URL,
    consumerKey,
    consumerSecret,
    { oauth_callback: callbackUrl }
  );

  const res = await fetch(GARMIN_REQUEST_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Garmin request token failed (${res.status}): ${body}`);
  }

  const data = parseFormEncoded(await res.text());
  const oauthToken = data.oauth_token;
  const oauthTokenSecret = data.oauth_token_secret;

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error("Garmin returned an invalid request token response");
  }

  return {
    oauthToken,
    oauthTokenSecret,
    authorizeUrl: `${GARMIN_AUTHORIZE_URL}?oauth_token=${encodeURIComponent(oauthToken)}`,
  };
}

/**
 * Step 3 of Garmin OAuth flow: exchange the request token + verifier for
 * long-lived access tokens.
 */
export async function exchangeGarminTokens(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<{ accessToken: string; accessSecret: string }> {
  const consumerKey = process.env.GARMIN_CLIENT_ID!;
  const consumerSecret = process.env.GARMIN_CLIENT_SECRET!;

  const authHeader = buildAuthHeader(
    "POST",
    GARMIN_ACCESS_TOKEN_URL,
    consumerKey,
    consumerSecret,
    { oauth_verifier: oauthVerifier },
    {},
    oauthToken,
    oauthTokenSecret
  );

  const res = await fetch(GARMIN_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Garmin token exchange failed (${res.status}): ${body}`);
  }

  const data = parseFormEncoded(await res.text());
  const accessToken = data.oauth_token;
  const accessSecret = data.oauth_token_secret;

  if (!accessToken || !accessSecret) {
    throw new Error("Garmin returned an invalid access token response");
  }

  return { accessToken, accessSecret };
}

export interface GarminActivity {
  activityId: string;
  activityName: string;
  startTimeInSeconds: number;
  durationInSeconds: number;
  averageHeartRateInBeatsPerMinute?: number;
  activeKilocalories?: number;
  activityType: string;
  distanceInMeters?: number;
}

/**
 * Fetch recent activities from the Garmin Health API.
 * accessToken  = garminAccessToken from the users table
 * accessSecret = garminRefreshToken from the users table (repurposed column)
 */
export async function fetchGarminActivities(
  accessToken: string,
  accessSecret: string,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<GarminActivity[]> {
  const consumerKey = process.env.GARMIN_CLIENT_ID!;
  const consumerSecret = process.env.GARMIN_CLIENT_SECRET!;

  const startEpoch = Math.floor(new Date(startDate).getTime() / 1000);
  const endEpoch = Math.floor(new Date(endDate + "T23:59:59").getTime() / 1000);
  const url = `${GARMIN_BASE_URL}/activities?uploadStartTimeInSeconds=${startEpoch}&uploadEndTimeInSeconds=${endEpoch}`;

  const authHeader = buildAuthHeader(
    "GET",
    url.split("?")[0],
    consumerKey,
    consumerSecret,
    {},
    { uploadStartTimeInSeconds: String(startEpoch), uploadEndTimeInSeconds: String(endEpoch) },
    accessToken,
    accessSecret
  );

  const res = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    throw new Error(`Garmin activities fetch failed (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : (data.activityList ?? []);
}

/**
 * Map a Garmin activity type string to our internal type.
 */
export function mapGarminActivityType(garminType: string): string {
  const map: Record<string, string> = {
    RUNNING: "run",
    CYCLING: "cycle",
    SWIMMING: "swim",
    STRENGTH_TRAINING: "strength",
    WALKING: "walk",
    HIKING: "hike",
    YOGA: "yoga",
    CARDIO: "cardio",
  };
  return map[garminType?.toUpperCase()] ?? "other";
}
