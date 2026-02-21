"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save, Check, Flame, Dumbbell, Scale, Watch, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface TargetLift {
  exercise: string;
  weightKg: string;
}

export default function GoalsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garmin state
  const [garminConnected, setGarminConnected] = useState(false);
  const [garminSyncing, setGarminSyncing] = useState(false);
  const [garminMessage, setGarminMessage] = useState<string | null>(null);
  const [garminError, setGarminError] = useState<string | null>(null);

  // Nutrition goals
  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("150");
  const [carbs, setCarbs] = useState("200");
  const [fat, setFat] = useState("65");
  const [fiber, setFiber] = useState("30");

  // Body goal
  const [targetWeight, setTargetWeight] = useState("");

  // Lift goals
  const [lifts, setLifts] = useState<TargetLift[]>([{ exercise: "", weightKg: "" }]);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then(({ goals, garminConnected: gc }) => {
        if (goals) {
          setCalories(String(goals.targetCalories ?? 2000));
          setProtein(String(goals.targetProtein ?? 150));
          setCarbs(String(goals.targetCarbs ?? 200));
          setFat(String(goals.targetFat ?? 65));
          setFiber(String(goals.targetFiber ?? 30));
          setTargetWeight(goals.targetWeight ? String(goals.targetWeight) : "");
          if (goals.targetLifts && Object.keys(goals.targetLifts).length > 0) {
            setLifts(
              Object.entries(goals.targetLifts as Record<string, number>).map(
                ([exercise, weightKg]) => ({ exercise, weightKg: String(weightKg) })
              )
            );
          }
        }
        setGarminConnected(!!gc);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Handle redirect params from Garmin OAuth callback
    const gc = searchParams.get("garmin");
    const ge = searchParams.get("garmin_error");
    if (gc === "connected") setGarminMessage("Garmin connected successfully!");
    if (ge) setGarminError(decodeURIComponent(ge));
  }, [searchParams]);

  function addLift() {
    setLifts((prev) => [...prev, { exercise: "", weightKg: "" }]);
  }

  function removeLift(i: number) {
    setLifts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLift(i: number, field: keyof TargetLift, value: string) {
    setLifts((prev) =>
      prev.map((lift, idx) => (idx === i ? { ...lift, [field]: value } : lift))
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const targetLifts: Record<string, number> = {};
    lifts.forEach(({ exercise, weightKg }) => {
      if (exercise.trim() && weightKg) {
        targetLifts[exercise.trim()] = parseFloat(weightKg);
      }
    });

    const res = await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetCalories: parseInt(calories) || 2000,
        targetProtein: parseFloat(protein) || 150,
        targetCarbs: parseFloat(carbs) || 200,
        targetFat: parseFloat(fat) || 65,
        targetFiber: parseFloat(fiber) || 30,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        targetLifts: Object.keys(targetLifts).length > 0 ? targetLifts : undefined,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function syncGarmin() {
    setGarminSyncing(true);
    setGarminMessage(null);
    setGarminError(null);
    try {
      const res = await fetch("/api/workouts/sync-garmin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setGarminMessage(data.message ?? `Synced ${data.synced} activities`);
    } catch (err) {
      setGarminError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setGarminSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-[#2a2a32] rounded w-24 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[#2a2a32] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Goals</h1>
        <p className="text-gray-500 text-sm mt-1">
          Set your daily targets — these appear as goal lines on your charts
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>
      )}

      {/* Garmin Connect */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Watch className="w-4 h-4 text-teal-400" />
            <CardTitle>Garmin Connect</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {garminMessage && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {garminMessage}
            </div>
          )}
          {garminError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {garminError}
            </div>
          )}

          {garminConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Garmin account connected</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={syncGarmin}
                  loading={garminSyncing}
                  variant="secondary"
                  className="flex-1"
                >
                  {garminSyncing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
                  ) : (
                    "Sync Last 30 Days"
                  )}
                </Button>
                <a
                  href="/api/auth/garmin/request"
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 border border-[#2a2a32] rounded-lg transition-colors"
                >
                  Reconnect
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Connect your Garmin device to automatically sync workouts and activities.
              </p>
              <a
                href="/api/auth/garmin/request"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Watch className="w-4 h-4" />
                Connect Garmin
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutrition goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <CardTitle>Daily Nutrition Targets</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Calories (kcal)"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Protein (g)"
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
            <Input
              label="Fiber (g)"
              type="number"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Body goal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <CardTitle>Body Goal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            label="Target weight (kg)"
            type="number"
            step="0.1"
            placeholder="e.g. 80"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Strength goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              <CardTitle>Strength Goals</CardTitle>
            </div>
            <button
              onClick={addLift}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add lift
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Target weights shown as goal lines on your strength progression charts.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {lifts.map((lift, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Exercise (e.g. Bench Press)"
                value={lift.exercise}
                onChange={(e) => updateLift(i, "exercise", e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="kg"
                type="number"
                step="0.5"
                value={lift.weightKg}
                onChange={(e) => updateLift(i, "weightKg", e.target.value)}
                className="w-24"
              />
              {lifts.length > 1 && (
                <button
                  onClick={() => removeLift(i)}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} loading={saving} className="w-full" size="lg">
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Goals
          </>
        )}
      </Button>
    </div>
  );
}
