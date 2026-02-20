import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, meals, nutritionLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { todayString } from "@/lib/utils";

const MealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().min(1),
  description: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).default(0),
  photoUrl: z.string().url().optional(),
  source: z.enum(["manual", "photo_ai", "text_ai"]).default("manual"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(todayString()),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = MealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, ...mealData } = parsed.data;
  const userId = session.user.id;

  // Upsert the daily nutrition log
  const existing = await db.query.nutritionLogs.findFirst({
    where: and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, date)),
  });

  let logId: string;

  if (existing) {
    logId = existing.id;
    // Update running totals
    await db
      .update(nutritionLogs)
      .set({
        totalCalories: (existing.totalCalories ?? 0) + mealData.calories,
        totalProtein: (existing.totalProtein ?? 0) + mealData.protein,
        totalCarbs: (existing.totalCarbs ?? 0) + mealData.carbs,
        totalFat: (existing.totalFat ?? 0) + mealData.fat,
        totalFiber: (existing.totalFiber ?? 0) + mealData.fiber,
        updatedAt: new Date(),
      })
      .where(eq(nutritionLogs.id, logId));
  } else {
    const [newLog] = await db
      .insert(nutritionLogs)
      .values({
        userId,
        date,
        totalCalories: mealData.calories,
        totalProtein: mealData.protein,
        totalCarbs: mealData.carbs,
        totalFat: mealData.fat,
        totalFiber: mealData.fiber,
      })
      .returning();
    logId = newLog.id;
  }

  // Insert the meal
  const [meal] = await db
    .insert(meals)
    .values({ ...mealData, nutritionLogId: logId, userId })
    .returning();

  return NextResponse.json({ meal, logId });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayString();

  const log = await db.query.nutritionLogs.findFirst({
    where: and(
      eq(nutritionLogs.userId, session.user.id),
      eq(nutritionLogs.date, date)
    ),
    with: { meals: true },
  });

  return NextResponse.json({ log: log ?? null });
}
