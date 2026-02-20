import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { db, workouts, exercises, goals } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  const recentWorkouts = await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: [desc(workouts.date)],
    limit: 40,
    with: { exercises: true },
  });

  const userGoals = await db.query.goals.findFirst({
    where: eq(goals.userId, userId),
  });

  if (recentWorkouts.length === 0) {
    return new Response(
      "No workout data yet. Log a few workouts to get an analysis.",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  const workoutSummary = recentWorkouts.map((w) => ({
    date: w.date,
    name: w.name,
    type: w.activityType,
    duration: w.durationMinutes,
    calories: w.caloriesBurned,
    effort: w.perceivedEffort,
    source: w.source,
    exercises: w.exercises?.map((e) => ({
      name: e.name,
      muscle: e.muscleGroup,
      sets: e.sets,
      reps: e.reps,
      weight: e.weightKg,
      volume: e.volume,
      isPR: e.isPR,
    })),
  }));

  const goalsText = userGoals?.targetLifts
    ? `Target lifts: ${JSON.stringify(userGoals.targetLifts)}`
    : "No specific lift goals set.";

  const prompt = `You are an experienced strength and conditioning coach analyzing a client's workout history.

${goalsText}

Here is the client's workout history for the past ~6 weeks:
${JSON.stringify(workoutSummary, null, 2)}

Please provide a comprehensive training analysis including:

## Training Overview
Frequency, volume, and intensity summary. Flag any gaps in consistency.

## Potential Overtraining Signals
Look for signs of insufficient recovery, excessive volume, or missing rest days.

## Weak Points & Imbalances
Identify muscle groups that may be undertrained or patterns suggesting imbalances.

## Strength & Performance Trends
Highlight PRs, positive trends, and areas of stagnation.

## Periodization Recommendations
Based on the current training pattern, suggest adjustments for the next cycle.

## 4-Week Training Plan
Create a structured 4-week progressive training plan with:
- Week-by-week focus (volume, intensity, deload)
- Key exercises for each session type
- Rep/set schemes and progressive overload targets

Keep recommendations science-based, practical, and specific to what you see in the data.`;

  const stream = await anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
