/**
 * Garmin Connect API integration.
 * Garmin uses OAuth 1.0a for their Health API.
 * Full integration requires applying at https://developer.garmin.com/connect-iq/
 *
 * Docs: https://developer.garmin.com/health-api/overview/
 */

const GARMIN_BASE_URL = "https://healthapi.garmin.com/wellness-api/rest";
const GARMIN_AUTH_URL = "https://connectapi.garmin.com/oauth-service/oauth/request_token";

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
 * Exchange OAuth verifier for access tokens.
 * Call this from the /api/auth/garmin/callback route.
 */
export async function exchangeGarminTokens(
  oauthToken: string,
  oauthVerifier: string
): Promise<{ accessToken: string; accessSecret: string }> {
  // Garmin OAuth 1.0a token exchange
  // Full implementation requires OAuth 1.0a signing (e.g. oauth-1.0a package)
  // Placeholder until Garmin developer credentials are configured
  throw new Error(
    "Garmin OAuth not configured. Add GARMIN_CLIENT_ID and GARMIN_CLIENT_SECRET to .env.local"
  );
}

/**
 * Fetch recent activities from Garmin Health API.
 * Requires a valid access token stored on the user record.
 */
export async function fetchGarminActivities(
  accessToken: string,
  accessSecret: string,
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<GarminActivity[]> {
  // Garmin Health API requires OAuth 1.0a request signing.
  // Once credentials are configured, implement signing with oauth-1.0a.
  // For now, return empty array — manual workout entry is always available.
  console.warn("Garmin API not fully configured. Returning empty activities.");
  return [];
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
