import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGarminRequestToken } from "@/lib/garmin";
import { cookies } from "next/headers";

/**
 * GET /api/auth/garmin/request
 *
 * Step 1 of Garmin OAuth 1.0a:
 * 1. Get a request token from Garmin
 * 2. Store the token secret in a short-lived HttpOnly cookie
 * 3. Redirect the user to Garmin's authorization page
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callbackUrl =
    process.env.GARMIN_REDIRECT_URI ??
    `${process.env.NEXTAUTH_URL}/api/auth/garmin/callback`;

  try {
    const { oauthToken, oauthTokenSecret, authorizeUrl } =
      await getGarminRequestToken(callbackUrl);

    // Store the request token secret in a short-lived cookie so we can
    // retrieve it in the callback step (it's needed to sign the exchange).
    const cookieStore = await cookies();
    cookieStore.set("garmin_oauth_secret", oauthTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    // Also store the token itself for validation
    cookieStore.set("garmin_oauth_token", oauthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    console.error("Garmin request token error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/goals?garmin_error=${encodeURIComponent(message)}`
    );
  }
}
