import { auth } from "@/lib/auth";
import { db, workouts } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WorkoutLogFormWrapper } from "@/components/workouts/workout-log-form-wrapper";
import { Badge } from "@/components/ui/badge";
import { WorkoutChartWrapper } from "@/components/workouts/workout-chart-wrapper";
import { Dumbbell, Trophy, Flame, Clock } from "lucide-react";

export const revalidate = 0;

export default async function WorkoutsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const recentWorkouts = await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: [desc(workouts.date)],
    limit: 20,
    with: { exercises: true },
  });

  const totalWorkouts = recentWorkouts.length;
  const totalCalsBurned = recentWorkouts.reduce(
    (sum, w) => sum + (w.caloriesBurned ?? 0),
    0
  );
  const prs = recentWorkouts.flatMap((w) =>
    w.exercises?.filter((e) => e.isPR) ?? []
  );

  // Build exercise history for chart (group by exercise name)
  const exerciseHistory: Record<string, { date: string; weightKg: number; volume: number; isPR: boolean; reps: number; sets: number }[]> = {};
  recentWorkouts.forEach((w) => {
    w.exercises?.forEach((e) => {
      if (!e.name || !e.weightKg) return;
      if (!exerciseHistory[e.name]) exerciseHistory[e.name] = [];
      exerciseHistory[e.name].push({
        date: w.date,
        weightKg: e.weightKg,
        volume: e.volume ?? 0,
        isPR: e.isPR ?? false,
        reps: e.reps ?? 0,
        sets: e.sets ?? 0,
      });
    });
  });

  // Top 3 most-tracked exercises
  const topExercises = Object.entries(exerciseHistory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([name, data]) => ({ name, data: data.sort((a, b) => a.date.localeCompare(b.date)) }));

  const activityColors: Record<string, string> = {
    strength: "text-blue-400",
    run: "text-emerald-400",
    cycle: "text-yellow-400",
    swim: "text-cyan-400",
    walk: "text-purple-400",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Workouts</h1>
        <p className="text-gray-500 text-sm mt-1">Track your training progress</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Logged", value: totalWorkouts, icon: Dumbbell, color: "text-blue-400" },
          { label: "Cals Burned", value: Math.round(totalCalsBurned), icon: Flame, color: "text-orange-400" },
          { label: "PRs Set", value: prs.length, icon: Trophy, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex flex-col items-center py-5 gap-1">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Log Workout</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutLogFormWrapper />
            </CardContent>
          </Card>
        </div>

        {/* Right: charts + recent workouts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Strength progression charts */}
          {topExercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Strength Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkoutChartWrapper exercises={topExercises} />
              </CardContent>
            </Card>
          )}

          {/* Recent workouts list */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">
                  No workouts yet. Log your first workout or sync from Garmin.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentWorkouts.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between py-3 px-3 bg-[#111114] rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{w.name}</p>
                          {w.source === "garmin" && (
                            <Badge variant="info">Garmin</Badge>
                          )}
                          {w.exercises?.some((e) => e.isPR) && (
                            <Badge variant="warning">🏆 PR</Badge>
                          )}
                        </div>
                        <p className={`text-xs capitalize ${activityColors[w.activityType ?? "strength"] ?? "text-gray-500"}`}>
                          {formatDate(w.date)} · {w.activityType}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500 space-y-0.5">
                        {w.durationMinutes && (
                          <p className="flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {w.durationMinutes}m
                          </p>
                        )}
                        {w.exercises && w.exercises.length > 0 && (
                          <p>{w.exercises.length} exercises</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
