import { auth } from "@/lib/auth";
import { db, nutritionLogs, workouts, bodyPhotos, goals, exercises } from "@/lib/db";
import { eq, desc, and, asc, isNotNull, count } from "drizzle-orm";
import { todayString, formatDate, formatShortDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WeightProgressChart } from "@/components/charts/weight-progress-chart";
import Link from "next/link";
import {
  Utensils,
  Dumbbell,
  Camera,
  Flame,
  ChevronRight,
  Trophy,
  Lightbulb,
  Scale,
} from "lucide-react";

export const revalidate = 0;

// ─── Training split config ───────────────────────────────────────────────────

const SPLIT_SESSIONS: Record<string, string[]> = {
  ppl: ["Push", "Pull", "Legs"],
  "5day": ["Arms", "Shoulders", "Back", "Chest", "Legs"],
};

const SESSION_EXERCISES: Record<string, string[]> = {
  Push: ["Bench Press", "Shoulder Press", "Tricep Pushdown", "Lateral Raises"],
  Pull: ["Deadlift", "Barbell Row", "Pull-ups", "Hammer Curls"],
  Legs: ["Squat", "Leg Press", "Romanian Deadlift", "Calf Raises"],
  Arms: ["Barbell Curl", "Hammer Curl", "Tricep Pushdown", "Skull Crushers"],
  Shoulders: ["Shoulder Press", "Lateral Raises", "Face Pulls", "Shrugs"],
  Back: ["Deadlift", "Barbell Row", "Pull-ups", "Lat Pulldown"],
  Chest: ["Bench Press", "Incline DB Press", "Cable Fly", "Dips"],
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function getNextWorkout(
  lastWorkout: { name: string; activityType: string | null } | null | undefined,
  userGoals: { trainingRoutine?: string | null; customRoutine?: string[] | null } | null | undefined
): { name: string; exercises: string[] } {
  const routineKey = (userGoals?.trainingRoutine ?? "ppl") as string;
  const sessions: string[] =
    routineKey === "custom"
      ? (userGoals?.customRoutine ?? ["Push", "Pull", "Legs"]).filter(Boolean)
      : (SPLIT_SESSIONS[routineKey] ?? SPLIT_SESSIONS.ppl);

  if (!lastWorkout || lastWorkout.activityType !== "strength") {
    const next = sessions[0];
    return { name: `${next} Day`, exercises: SESSION_EXERCISES[next] ?? [] };
  }

  const lastIdx = sessions.findIndex((s) =>
    lastWorkout.name.toLowerCase().includes(s.toLowerCase())
  );
  const nextIdx = lastIdx === -1 ? 0 : (lastIdx + 1) % sessions.length;
  const next = sessions[nextIdx];
  return { name: `${next} Day`, exercises: SESSION_EXERCISES[next] ?? [] };
}

function getMealSuggestion(remainingCals: number) {
  if (remainingCals <= 0) return null;
  if (remainingCals < 200)
    return { name: "Light Snack", description: "Apple + handful of almonds", approxCals: 150, protein: "4g" };
  if (remainingCals < 400)
    return { name: "Protein Snack", description: "Greek yogurt with berries", approxCals: 200, protein: "15g" };
  if (remainingCals < 600)
    return { name: "Light Meal", description: "Chicken salad wrap", approxCals: 450, protein: "32g" };
  if (remainingCals < 800)
    return { name: "Balanced Meal", description: "Grilled chicken + rice + veg", approxCals: 580, protein: "42g" };
  return { name: "Full Meal", description: "Salmon + sweet potato + salad", approxCals: 700, protein: "48g" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const today = todayString();

  const [todayLog, lastWorkout, allPRExercises, weightHistory, latestPhoto, userGoals, workoutCount] =
    await Promise.all([
      db.query.nutritionLogs.findFirst({
        where: and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, today)),
      }),
      db.query.workouts.findFirst({
        where: eq(workouts.userId, userId),
        orderBy: [desc(workouts.date)],
        with: { exercises: true },
      }),
      db.query.exercises.findMany({
        where: and(eq(exercises.userId, userId), eq(exercises.isPR, true)),
        with: { workout: { columns: { date: true, name: true } } },
        orderBy: [desc(exercises.loggedAt)],
      }),
      db.query.bodyPhotos.findMany({
        where: and(eq(bodyPhotos.userId, userId), isNotNull(bodyPhotos.weightKg)),
        orderBy: [asc(bodyPhotos.date)],
        columns: { date: true, weightKg: true },
      }),
      db.query.bodyPhotos.findFirst({
        where: eq(bodyPhotos.userId, userId),
        orderBy: [desc(bodyPhotos.date)],
      }),
      db.query.goals.findFirst({ where: eq(goals.userId, userId) }),
      db.select({ value: count() }).from(workouts).where(eq(workouts.userId, userId)),
    ]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const calGoal = userGoals?.targetCalories ?? 2000;
  const calsToday = Math.round(todayLog?.totalCalories ?? 0);
  const calPct = Math.min(Math.round((calsToday / calGoal) * 100), 100);
  const remainingCals = calGoal - calsToday;

  const totalWorkoutsCount = Number(workoutCount[0]?.value ?? 0);

  // PR board: best weight per exercise, sorted by most recent date
  const prBoard = Object.entries(
    allPRExercises
      .filter((e) => e.workout)
      .reduce(
        (acc, e) => {
          const key = e.name;
          if (!acc[key] || (e.weightKg ?? 0) > (acc[key].weightKg ?? 0)) acc[key] = e;
          return acc;
        },
        {} as Record<string, (typeof allPRExercises)[0]>
      )
  ).sort((a, b) => (b[1].workout?.date ?? "").localeCompare(a[1].workout?.date ?? ""));

  // Weight chart data (filter out any null weightKg just in case)
  const weightChartData = weightHistory
    .filter((w): w is { date: string; weightKg: number } => w.weightKg !== null)
    .map((w) => ({ date: w.date, weightKg: w.weightKg }));

  // Next workout suggestion
  const nextWorkout = getNextWorkout(lastWorkout, userGoals);

  // Meal suggestion
  const mealSuggestion = getMealSuggestion(remainingCals);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(today)}</p>
      </div>

      {/* Row 1 — 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Calories today",
            value: `${calsToday} / ${calGoal}`,
            sub: `${calPct}% of goal`,
            icon: Flame,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
          },
          {
            label: "Total workouts",
            value: totalWorkoutsCount,
            sub: "all time",
            icon: Dumbbell,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            label: "All-time PRs",
            value: prBoard.length,
            sub: "personal records",
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
          },
          {
            label: "Latest photo",
            value: latestPhoto ? formatShortDate(latestPhoto.date) : "—",
            sub: latestPhoto ? "last upload" : "no photos yet",
            icon: Camera,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="py-4 px-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-white leading-tight">{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-700 mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Row 2 — 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Nutrition + Meal Suggestion */}
        <div className="space-y-4">
          {/* Nutrition card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <CardTitle>Nutrition</CardTitle>
                </div>
                <Link
                  href="/nutrition"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  Log <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-2">
                {/* Calorie ring */}
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a32" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray={`${calPct} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">{calsToday}</span>
                    <span className="text-xs text-gray-500">/ {calGoal} kcal</span>
                  </div>
                </div>
                <div className="w-full grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Protein", value: Math.round(todayLog?.totalProtein ?? 0), color: "text-emerald-400" },
                    { label: "Carbs", value: Math.round(todayLog?.totalCarbs ?? 0), color: "text-yellow-400" },
                    { label: "Fat", value: Math.round(todayLog?.totalFat ?? 0), color: "text-pink-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#111114] rounded-lg py-2 px-1">
                      <p className={`text-sm font-semibold ${color}`}>{value}g</p>
                      <p className="text-xs text-gray-600">{label}</p>
                    </div>
                  ))}
                </div>
                {!todayLog && (
                  <p className="text-xs text-gray-600 text-center">No meals logged today</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meal suggestion card */}
          {mealSuggestion ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <CardTitle>Meal Suggestion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{mealSuggestion.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{mealSuggestion.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-amber-400 font-medium">~{mealSuggestion.approxCals} kcal</p>
                      <p className="text-xs text-gray-600">{mealSuggestion.protein} protein</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {remainingCals} kcal remaining today
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-gray-600 text-center">🎯 Calorie goal reached for today!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Col 2: Weight progression */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                <CardTitle>Weight Progression</CardTitle>
              </div>
              <Link
                href="/photos"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                Photos <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <WeightProgressChart
              data={weightChartData}
              targetWeight={userGoals?.targetWeight ?? undefined}
            />
            {weightChartData.length > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>
                  Start:{" "}
                  <span className="text-white font-medium">
                    {weightChartData[0].weightKg.toFixed(1)} kg
                  </span>
                </span>
                <span>
                  Latest:{" "}
                  <span className="text-white font-medium">
                    {weightChartData[weightChartData.length - 1].weightKg.toFixed(1)} kg
                  </span>
                </span>
                {weightChartData.length >= 2 && (
                  <span>
                    {(() => {
                      const diff =
                        weightChartData[weightChartData.length - 1].weightKg -
                        weightChartData[0].weightKg;
                      return (
                        <span className={diff <= 0 ? "text-emerald-400" : "text-red-400"}>
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(1)} kg
                        </span>
                      );
                    })()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Col 3: Last workout + Next suggestion */}
        <div className="space-y-4">
          {/* Last workout */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  <CardTitle>Last Workout</CardTitle>
                </div>
                <Link
                  href="/workouts"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  Log <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {lastWorkout ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{lastWorkout.name}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {formatShortDate(lastWorkout.date)} · {lastWorkout.activityType}
                      {lastWorkout.durationMinutes ? ` · ${lastWorkout.durationMinutes}m` : ""}
                    </p>
                  </div>
                  {lastWorkout.exercises && lastWorkout.exercises.length > 0 && (
                    <div className="space-y-1">
                      {lastWorkout.exercises.slice(0, 4).map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{ex.name}</span>
                          <span className="text-gray-600">
                            {ex.sets && ex.reps && ex.weightKg
                              ? `${ex.sets}×${ex.reps} @ ${ex.weightKg}kg`
                              : ex.distanceKm
                              ? `${ex.distanceKm}km`
                              : ""}
                            {ex.isPR && (
                              <span className="ml-1 text-yellow-400">🏆</span>
                            )}
                          </span>
                        </div>
                      ))}
                      {lastWorkout.exercises.length > 4 && (
                        <p className="text-xs text-gray-700">
                          +{lastWorkout.exercises.length - 4} more exercises
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-600 text-center py-4">No workouts yet</p>
              )}
            </CardContent>
          </Card>

          {/* Next workout suggestion */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-violet-400" />
                <CardTitle>Next Workout</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">{nextWorkout.name}</p>
                {nextWorkout.exercises.length > 0 && (
                  <div className="space-y-1">
                    {nextWorkout.exercises.map((ex) => (
                      <div key={ex} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />
                        {ex}
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  href="/workouts"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  Start logging <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 3 — PR Board */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <CardTitle>PR Board</CardTitle>
            </div>
            <Link
              href="/workouts"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              Workouts <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {prBoard.length === 0 ? (
            <div className="text-center py-6">
              <Trophy className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No PRs recorded yet</p>
              <p className="text-xs text-gray-700 mt-1">
                Mark exercises as PRs when logging workouts to see them here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-600 border-b border-[#2a2a32]">
                    <th className="text-left pb-2 font-medium">Exercise</th>
                    <th className="text-right pb-2 font-medium">Best Weight</th>
                    <th className="text-right pb-2 font-medium hidden sm:table-cell">Sets × Reps</th>
                    <th className="text-right pb-2 font-medium hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1f]">
                  {prBoard.map(([name, ex]) => (
                    <tr key={name} className="group">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🏆</span>
                          <span className="text-white font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-yellow-400 font-semibold">
                          {ex.weightKg ? `${ex.weightKg} kg` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-gray-500 hidden sm:table-cell">
                        {ex.sets && ex.reps ? `${ex.sets} × ${ex.reps}` : "—"}
                      </td>
                      <td className="py-2.5 text-right text-gray-600 hidden sm:table-cell text-xs">
                        {ex.workout?.date ? formatShortDate(ex.workout.date) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
