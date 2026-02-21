import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeGarminTokens } from "@/lib/garmin";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * GET /api/auth/garmin/callback?oauth_token=xxx&oauth_verifier=yyy
 *
 * Step 3 of Garmin OAuth 1.0a (step 2 is the user authorizing on Garmin's site):
 * 1. Read the stored request token secret from the cookie
 * 2. Exchange the request token + verifier for long-lived access tokens
 * 3. Persist access tokens on the user record
 * 4. Clear cookies and redirect to /goals
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
  }

  const { searchParams } = new URL(req.url);
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/goals?garmin_error=Missing+OAuth+parameters`
    );
  }

  // Read the stored request token secret
  const cookieStore = await cookies();
  const storedToken = cookieStore.get("garmin_oauth_token")?.value;
  const storedSecret = cookieStore.get("garmin_oauth_secret")?.value;

  if (!storedSecret || storedToken !== oauthToken) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/goals?garmin_error=Session+expired.+Please+try+connecting+again.`
    );
  }

  try {
    const { accessToken, accessSecret } = await exchangeGarminTokens(
      oauthToken,
      storedSecret,
      oauthVerifier
    );

    // Persist tokens — accessSecret stored in garminRefreshToken column
    await db
      .update(users)
      .set({
        garminAccessToken: accessToken,
        garminRefreshToken: accessSecret, // repurposed: this IS the access token secret
      })
      .where(eq(users.id, session.user.id));

    // Clear the temporary cookies
    cookieStore.delete("garmin_oauth_token");
    cookieStore.delete("garmin_oauth_secret");

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/goals?garmin=connected`);
  } catch (err) {
    console.error("Garmin callback error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/goals?garmin_error=${encodeURIComponent(message)}`
    );
  }
}
