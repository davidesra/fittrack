import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { db, nutritionLogs, meals, goals } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  // Fetch last 30 days of nutrition logs + meals
  const logs = await db.query.nutritionLogs.findMany({
    where: eq(nutritionLogs.userId, userId),
    orderBy: [desc(nutritionLogs.date)],
    limit: 30,
    with: { meals: true },
  });

  const userGoals = await db.query.goals.findFirst({
    where: eq(goals.userId, userId),
  });

  if (logs.length === 0) {
    return new Response(
      "Not enough nutrition data yet. Log at least a few meals to get an analysis.",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Build summary for Claude
  const nutritionSummary = logs.map((log) => ({
    date: log.date,
    calories: Math.round(log.totalCalories ?? 0),
    protein: Math.round(log.totalProtein ?? 0),
    carbs: Math.round(log.totalCarbs ?? 0),
    fat: Math.round(log.totalFat ?? 0),
    fiber: Math.round(log.totalFiber ?? 0),
    meals: log.meals?.map((m) => ({
      type: m.mealType,
      name: m.name,
      calories: Math.round(m.calories ?? 0),
    })),
  }));

  const goalsText = userGoals
    ? `User goals: ${userGoals.targetCalories} kcal, ${userGoals.targetProtein}g protein, ${userGoals.targetCarbs}g carbs, ${userGoals.targetFat}g fat per day. Target weight: ${userGoals.targetWeight ? userGoals.targetWeight + "kg" : "not set"}.`
    : "User has not set specific goals.";

  const prompt = `You are a registered dietitian and nutrition coach analyzing a client's nutrition history.

${goalsText}

Here is the client's nutrition data for the last ${logs.length} days:
${JSON.stringify(nutritionSummary, null, 2)}

Please provide a comprehensive analysis including:

## What's Going Well
Identify 2-3 positive patterns or achievements.

## Deficiencies & Areas for Improvement
Identify specific nutritional gaps (macros, potential micronutrient concerns based on food patterns, consistency issues).

## Key Recommendations
Provide 4-5 specific, actionable recommendations.

## 4-Week Meal Plan Overview
Provide a structured 4-week meal plan overview with:
- Calorie and macro targets for each week
- Key foods/meals to include
- Meal timing recommendations

Keep the analysis practical, evidence-based, and encouraging. Format clearly with markdown headers.`;

  // Stream the response
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
