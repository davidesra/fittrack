import { auth } from "@/lib/auth";
import { db, nutritionLogs, meals, goals } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { todayString, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MacroBar } from "@/components/charts/macro-progress-bar";
import { NutritionChartWrapper } from "@/components/charts/nutrition-chart-wrapper";
import { MealLogFormWrapper } from "@/components/nutrition/meal-log-form-wrapper";
import { DeleteMealButton } from "@/components/nutrition/delete-meal-button";
import { Flame, Utensils } from "lucide-react";

export const revalidate = 0;

export default async function NutritionPage() {
  const session = await auth();
  const userId = session!.user.id;
  const today = todayString();

  // Today's log
  const todayLog = await db.query.nutritionLogs.findFirst({
    where: and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, today)),
    with: { meals: { orderBy: [desc(meals.loggedAt)] } },
  });

  // Last 90 days for chart (client filters down to 7d/30d/90d)
  const recentLogs = await db.query.nutritionLogs.findMany({
    where: eq(nutritionLogs.userId, userId),
    orderBy: [desc(nutritionLogs.date)],
    limit: 90,
  });

  const userGoals = await db.query.goals.findFirst({
    where: eq(goals.userId, userId),
  });

  const g = {
    calories: userGoals?.targetCalories ?? 2000,
    protein: userGoals?.targetProtein ?? 150,
    carbs: userGoals?.targetCarbs ?? 200,
    fat: userGoals?.targetFat ?? 65,
    fiber: userGoals?.targetFiber ?? 30,
  };

  const totals = {
    calories: Math.round(todayLog?.totalCalories ?? 0),
    protein: Math.round(todayLog?.totalProtein ?? 0),
    carbs: Math.round(todayLog?.totalCarbs ?? 0),
    fat: Math.round(todayLog?.totalFat ?? 0),
    fiber: Math.round(todayLog?.totalFiber ?? 0),
  };

  const chartData = [...recentLogs].reverse().map((log) => ({
    date: log.date,
    calories: Math.round(log.totalCalories ?? 0),
    protein: Math.round(log.totalProtein ?? 0),
    carbs: Math.round(log.totalCarbs ?? 0),
    fat: Math.round(log.totalFat ?? 0),
  }));

  const mealTypeColors: Record<string, string> = {
    breakfast: "text-yellow-400",
    lunch: "text-emerald-400",
    dinner: "text-blue-400",
    snack: "text-purple-400",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Nutrition</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(today)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Log form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Log Food</CardTitle>
            </CardHeader>
            <CardContent>
              <MealLogFormWrapper />
            </CardContent>
          </Card>
        </div>

        {/* Right: Today's summary + meals */}
        <div className="lg:col-span-2 space-y-5">
          {/* Calorie ring + macros */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <CardTitle>Today&apos;s Totals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-5">
                {/* Calorie circle */}
                <div className="flex-shrink-0 relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a32" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray={`${Math.min((totals.calories / g.calories) * 100, 100)} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white">{totals.calories}</span>
                    <span className="text-xs text-gray-500">/ {g.calories}</span>
                  </div>
                </div>

                {/* Macros */}
                <div className="flex-1 space-y-3">
                  <MacroBar label="Protein" value={totals.protein} goal={g.protein} color="bg-emerald-500" />
                  <MacroBar label="Carbs" value={totals.carbs} goal={g.carbs} color="bg-yellow-500" />
                  <MacroBar label="Fat" value={totals.fat} goal={g.fat} color="bg-pink-500" />
                  <MacroBar label="Fiber" value={totals.fiber} goal={g.fiber} color="bg-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's meals */}
          {todayLog?.meals && todayLog.meals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <CardTitle>Today&apos;s Meals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayLog.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between py-2.5 px-3 bg-[#111114] rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{meal.name}</p>
                        <p className={`text-xs capitalize ${mealTypeColors[meal.mealType] ?? "text-gray-500"}`}>
                          {meal.mealType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {Math.round(meal.calories ?? 0)} kcal
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.round(meal.protein ?? 0)}p · {Math.round(meal.carbs ?? 0)}c · {Math.round(meal.fat ?? 0)}f
                          </p>
                        </div>
                        <DeleteMealButton mealId={meal.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trend chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionChartWrapper data={chartData} calGoal={g.calories} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
