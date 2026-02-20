import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, workouts, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchGarminActivities, mapGarminActivityType } from "@/lib/garmin";
import { format, subDays } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get Garmin tokens from user record
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.garminAccessToken || !user?.garminRefreshToken) {
    return NextResponse.json(
      {
        error: "Garmin not connected",
        message:
          "Connect your Garmin account first via Settings. Garmin OAuth requires developer credentials at https://developer.garmin.com/connect-iq/",
        connected: false,
      },
      { status: 400 }
    );
  }

  try {
    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");

    const activities = await fetchGarminActivities(
      user.garminAccessToken,
      user.garminRefreshToken,
      startDate,
      endDate
    );

    let synced = 0;

    for (const activity of activities) {
      // Skip if already synced
      const existing = await db.query.workouts.findFirst({
        where: eq(workouts.garminActivityId, activity.activityId),
      });
      if (existing) continue;

      const date = format(
        new Date(activity.startTimeInSeconds * 1000),
        "yyyy-MM-dd"
      );

      await db.insert(workouts).values({
        userId,
        name: activity.activityName || activity.activityType,
        date,
        durationMinutes: Math.round(activity.durationInSeconds / 60),
        caloriesBurned: activity.activeKilocalories ?? null,
        activityType: mapGarminActivityType(activity.activityType),
        garminActivityId: activity.activityId,
        source: "garmin",
      });

      synced++;
    }

    return NextResponse.json({
      synced,
      total: activities.length,
      message: synced > 0
        ? `Synced ${synced} new activities from Garmin`
        : "Already up to date",
    });
  } catch (error) {
    console.error("Garmin sync error:", error);
    return NextResponse.json(
      { error: "Garmin sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
