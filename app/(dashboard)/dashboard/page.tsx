import { auth } from "@/lib/auth";
import { db, nutritionLogs, workouts, bodyPhotos, goals } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { todayString, formatDate, formatShortDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import {
  Utensils,
  Dumbbell,
  Camera,
  Flame,
  ChevronRight,
  Trophy,
  Target,
  TrendingUp,
} from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const today = todayString();

  const [todayLog, recentWorkouts, latestPhoto, userGoals] = await Promise.all([
    db.query.nutritionLogs.findFirst({
      where: and(eq(nutritionLogs.userId, userId), eq(nutritionLogs.date, today)),
    }),
    db.query.workouts.findMany({
      where: eq(workouts.userId, userId),
      orderBy: [desc(workouts.date)],
      limit: 5,
      with: { exercises: true },
    }),
    db.query.bodyPhotos.findFirst({
      where: eq(bodyPhotos.userId, userId),
      orderBy: [desc(bodyPhotos.date)],
    }),
    db.query.goals.findFirst({ where: eq(goals.userId, userId) }),
  ]);

  const calGoal = userGoals?.targetCalories ?? 2000;
  const calsToday = Math.round(todayLog?.totalCalories ?? 0);
  const calPct = Math.min(Math.round((calsToday / calGoal) * 100), 100);

  const totalWorkouts = recentWorkouts.length;
  const recentPRs = recentWorkouts.flatMap((w) => w.exercises?.filter((e) => e.isPR) ?? []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate(today)}</p>
      </div>

      {/* Today snapshot row */}
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
            label: "Workouts (recent)",
            value: totalWorkouts,
            sub: "last 5 sessions",
            icon: Dumbbell,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            label: "PRs set",
            value: recentPRs.length,
            sub: "across recent logs",
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
          },
          {
            label: "Photos",
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nutrition summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <CardTitle>Nutrition</CardTitle>
              </div>
              <Link href="/nutrition" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                Log <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calorie ring */}
            <div className="flex flex-col items-center gap-3 py-2">
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
                  { label: "Protein", value: Math.round(todayLog?.totalProtein ?? 0), unit: "g", color: "text-emerald-400" },
                  { label: "Carbs", value: Math.round(todayLog?.totalCarbs ?? 0), unit: "g", color: "text-yellow-400" },
                  { label: "Fat", value: Math.round(todayLog?.totalFat ?? 0), unit: "g", color: "text-pink-400" },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="bg-[#111114] rounded-lg py-2 px-1">
                    <p className={`text-sm font-semibold ${color}`}>{value}{unit}</p>
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

        {/* Recent workouts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                <CardTitle>Recent Workouts</CardTitle>
              </div>
              <Link href="/workouts" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                Log <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">No workouts yet</p>
            ) : (
              <div className="space-y-2">
                {recentWorkouts.map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-2 px-3 bg-[#111114] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white">{w.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {formatShortDate(w.date)} · {w.activityType}
                      </p>
                    </div>
                    <div className="text-right">
                      {w.exercises?.some((e) => e.isPR) && (
                        <span className="text-xs text-yellow-400">🏆 PR</span>
                      )}
                      {w.durationMinutes && (
                        <p className="text-xs text-gray-600">{w.durationMinutes}m</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos + goals */}
        <div className="lg:col-span-1 space-y-4">
          {/* Latest photo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <CardTitle>Latest Photo</CardTitle>
                </div>
                <Link href="/photos" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                  View <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {latestPhoto ? (
                <div className="space-y-2">
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
                    <Image
                      src={latestPhoto.cloudinaryUrl}
                      alt="Latest progress photo"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 300px"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{formatDate(latestPhoto.date)}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Camera className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">No photos yet</p>
                  <Link href="/photos" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block">
                    Upload one →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals snapshot */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-yellow-400" />
                  <CardTitle>Goals</CardTitle>
                </div>
                <Link href="/goals" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                  Edit <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Calories</span>
                  <span className="text-white font-medium">{userGoals?.targetCalories ?? 2000} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Protein</span>
                  <span className="text-white font-medium">{userGoals?.targetProtein ?? 150}g</span>
                </div>
                {userGoals?.targetWeight && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target weight</span>
                    <span className="text-white font-medium">{userGoals.targetWeight}kg</span>
                  </div>
                )}
                {userGoals?.targetLifts && Object.keys(userGoals.targetLifts).length > 0 && (
                  <div className="pt-1 border-t border-[#2a2a32]">
                    <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Target lifts
                    </p>
                    {Object.entries(userGoals.targetLifts as Record<string, number>)
                      .slice(0, 3)
                      .map(([name, kg]) => (
                        <div key={name} className="flex justify-between text-xs">
                          <span className="text-gray-500">{name}</span>
                          <span className="text-white">{kg}kg</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
