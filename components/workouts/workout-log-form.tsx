"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Dumbbell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseEntry {
  name: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  weightKg: string;
}

const ACTIVITY_TYPES = ["strength", "run", "cycle", "swim", "walk", "hike", "yoga", "cardio", "other"];

interface WorkoutLogFormProps {
  onSuccess?: () => void;
}

export function WorkoutLogForm({ onSuccess }: WorkoutLogFormProps) {
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState("strength");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [effort, setEffort] = useState("");
  const [notes, setNotes] = useState("");
  const [exerciseList, setExerciseList] = useState<ExerciseEntry[]>([
    { name: "", muscleGroup: "", sets: "", reps: "", weightKg: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  function addExercise() {
    setExerciseList((prev) => [
      ...prev,
      { name: "", muscleGroup: "", sets: "", reps: "", weightKg: "" },
    ]);
  }

  function removeExercise(i: number) {
    setExerciseList((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateExercise(i: number, field: keyof ExerciseEntry, value: string) {
    setExerciseList((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex))
    );
  }

  async function save() {
    if (!name.trim()) {
      setError("Workout name is required");
      return;
    }
    setSaving(true);
    setError(null);

    const validExercises = exerciseList
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        muscleGroup: e.muscleGroup || undefined,
        sets: e.sets ? parseInt(e.sets) : undefined,
        reps: e.reps ? parseInt(e.reps) : undefined,
        weightKg: e.weightKg ? parseFloat(e.weightKg) : undefined,
      }));

    const res = await fetch("/api/workouts/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        activityType,
        durationMinutes: duration ? parseInt(duration) : undefined,
        caloriesBurned: calories ? parseFloat(calories) : undefined,
        perceivedEffort: effort ? parseInt(effort) : undefined,
        notes: notes || undefined,
        exercises: validExercises,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    setSaving(false);
    setName("");
    setDuration("");
    setCalories("");
    setEffort("");
    setNotes("");
    setExerciseList([{ name: "", muscleGroup: "", sets: "", reps: "", weightKg: "" }]);
    onSuccess?.();
  }

  async function syncGarmin() {
    setSyncing(true);
    setSyncMsg(null);
    setError(null);
    const res = await fetch("/api/workouts/sync-garmin", { method: "POST" });
    const data = await res.json();
    setSyncing(false);
    if (!res.ok) {
      setError(data.error ?? "Sync failed");
      return;
    }
    setSyncMsg(data.message);
    onSuccess?.();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Garmin sync */}
      <button
        onClick={syncGarmin}
        disabled={syncing}
        className="flex items-center gap-2 px-3 py-2.5 bg-[#1a2a1f] border border-emerald-800/40 rounded-xl text-sm text-emerald-400 hover:bg-[#1e321f] transition-colors disabled:opacity-50 w-full justify-center"
      >
        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
        {syncing ? "Syncing Garmin…" : "Sync from Garmin Connect"}
      </button>
      {syncMsg && (
        <p className="text-xs text-emerald-400 text-center">{syncMsg}</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#2a2a32]" />
        <span className="text-xs text-gray-600">or log manually</span>
        <div className="flex-1 h-px bg-[#2a2a32]" />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Workout details */}
      <Input
        label="Workout name"
        placeholder="e.g. Upper Body Push"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Activity type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">Activity type</label>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActivityType(type)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs capitalize transition-colors",
                activityType === type
                  ? "bg-blue-600 text-white"
                  : "bg-[#2a2a32] text-gray-400 hover:text-gray-200"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Input
          label="Duration (min)"
          type="number"
          placeholder="60"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Input
          label="Cal burned"
          type="number"
          placeholder="350"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <Input
          label="Effort (1-10)"
          type="number"
          min={1}
          max={10}
          placeholder="7"
          value={effort}
          onChange={(e) => setEffort(e.target.value)}
        />
      </div>

      {/* Exercises */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
            Exercises
          </label>
          <button
            onClick={addExercise}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {exerciseList.map((ex, i) => (
          <div key={i} className="bg-[#111114] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Exercise name"
                value={ex.name}
                onChange={(e) => updateExercise(i, "name", e.target.value)}
                className="flex-1"
              />
              {exerciseList.length > 1 && (
                <button
                  onClick={() => removeExercise(i)}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Sets"
                type="number"
                value={ex.sets}
                onChange={(e) => updateExercise(i, "sets", e.target.value)}
              />
              <Input
                placeholder="Reps"
                type="number"
                value={ex.reps}
                onChange={(e) => updateExercise(i, "reps", e.target.value)}
              />
              <Input
                placeholder="kg"
                type="number"
                value={ex.weightKg}
                onChange={(e) => updateExercise(i, "weightKg", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button onClick={save} loading={saving} className="w-full">
        <Plus className="w-4 h-4" />
        Save Workout
      </Button>
    </div>
  );
}
