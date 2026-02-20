import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, workouts, exercises } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { todayString } from "@/lib/utils";

const ExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().optional(),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weightKg: z.number().min(0).optional(),
  distanceKm: z.number().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

const WorkoutSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(todayString()),
  durationMinutes: z.number().int().min(1).optional(),
  caloriesBurned: z.number().min(0).optional(),
  activityType: z.string().default("strength"),
  perceivedEffort: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
  exercises: z.array(ExerciseSchema).default([]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = WorkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const { exercises: exerciseList, ...workoutData } = parsed.data;

  // Insert workout
  const [workout] = await db
    .insert(workouts)
    .values({ ...workoutData, userId, source: "manual" })
    .returning();

  // Insert exercises, computing volume and checking PRs
  if (exerciseList.length > 0) {
    const exercisesToInsert = await Promise.all(
      exerciseList.map(async (ex) => {
        const volume =
          ex.sets && ex.reps && ex.weightKg
            ? ex.sets * ex.reps * ex.weightKg
            : undefined;

        // Check if this is a PR for this exercise
        let isPR = false;
        if (ex.weightKg && ex.weightKg > 0) {
          const previousBest = await db.query.exercises.findFirst({
            where: and(
              eq(exercises.userId, userId),
              eq(exercises.name, ex.name)
            ),
            orderBy: [desc(exercises.weightKg)],
          });
          isPR = !previousBest || (ex.weightKg > (previousBest.weightKg ?? 0));
        }

        return {
          ...ex,
          workoutId: workout.id,
          userId,
          volume: volume ?? null,
          isPR,
        };
      })
    );

    await db.insert(exercises).values(exercisesToInsert);
  }

  return NextResponse.json({ workout });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const date = searchParams.get("date");

  const query = date
    ? and(eq(workouts.userId, session.user.id), eq(workouts.date, date))
    : eq(workouts.userId, session.user.id);

  const results = await db.query.workouts.findMany({
    where: query,
    orderBy: [desc(workouts.date)],
    limit,
    with: { exercises: true },
  });

  return NextResponse.json({ workouts: results });
}
