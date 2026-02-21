import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, meals, nutritionLogs } from "@/lib/db";
import { eq, and, sum } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mealId } = await params;
  const userId = session.user.id;

  // Verify ownership and get the log id
  const meal = await db.query.meals.findFirst({
    where: and(eq(meals.id, mealId), eq(meals.userId, userId)),
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  const logId = meal.nutritionLogId;

  // Delete the meal
  await db.delete(meals).where(eq(meals.id, mealId));

  // Recalculate totals from remaining meals in the log
  const remaining = await db.query.meals.findMany({
    where: eq(meals.nutritionLogId, logId),
  });

  const totals = remaining.reduce(
    (acc, m) => ({
      totalCalories: acc.totalCalories + (m.calories ?? 0),
      totalProtein: acc.totalProtein + (m.protein ?? 0),
      totalCarbs: acc.totalCarbs + (m.carbs ?? 0),
      totalFat: acc.totalFat + (m.fat ?? 0),
      totalFiber: acc.totalFiber + (m.fiber ?? 0),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 }
  );

  await db
    .update(nutritionLogs)
    .set({ ...totals, updatedAt: new Date() })
    .where(eq(nutritionLogs.id, logId));

  return NextResponse.json({ success: true });
}
