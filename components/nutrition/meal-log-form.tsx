"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Type, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealFormData {
  name: string;
  description?: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  photoUrl?: string;
  source: "manual" | "photo_ai" | "text_ai";
}

interface MealLogFormProps {
  onSuccess?: () => void;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function MealLogForm({ onSuccess }: MealLogFormProps) {
  const [mode, setMode] = useState<"manual" | "photo" | "text">("manual");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzed, setAnalyzed] = useState<MealFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [manual, setManual] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
  });

  async function analyzePhoto(file: File) {
    setAnalyzing(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);

    const res = await fetch("/api/nutrition/analyze-photo", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Analysis failed");
      setAnalyzing(false);
      return;
    }
    setAnalyzed({ ...data, mealType, source: "photo_ai" });
    setAnalyzing(false);
  }

  async function analyzeText() {
    if (!textInput.trim()) return;
    setAnalyzing(true);
    setError(null);
    const fd = new FormData();
    fd.append("description", textInput);

    const res = await fetch("/api/nutrition/analyze-photo", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Analysis failed");
      setAnalyzing(false);
      return;
    }
    setAnalyzed({ ...data, mealType, source: "text_ai" });
    setAnalyzing(false);
  }

  async function saveMeal(data: MealFormData) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/nutrition/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save");
      setSaving(false);
      return;
    }
    setSaving(false);
    setAnalyzed(null);
    setManual({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "" });
    setTextInput("");
    onSuccess?.();
  }

  function saveManual() {
    if (!manual.name || !manual.calories) {
      setError("Name and calories are required");
      return;
    }
    saveMeal({
      name: manual.name,
      mealType,
      calories: parseFloat(manual.calories),
      protein: parseFloat(manual.protein) || 0,
      carbs: parseFloat(manual.carbs) || 0,
      fat: parseFloat(manual.fat) || 0,
      fiber: parseFloat(manual.fiber) || 0,
      source: "manual",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Meal type tabs */}
      <div className="flex gap-1 bg-[#111114] rounded-xl p-1">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors",
              mealType === type
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Input mode tabs */}
      <div className="flex gap-2">
        {[
          { id: "manual", label: "Manual", icon: Plus },
          { id: "text", label: "Describe", icon: Type },
          { id: "photo", label: "Photo", icon: Camera },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id as typeof mode); setAnalyzed(null); setError(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              mode === id
                ? "bg-[#2a2a32] text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Analyzed result (shared by photo + text modes) */}
      {analyzed && (
        <div className="bg-[#111114] border border-indigo-500/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-indigo-300">AI Estimate</p>
          <p className="text-white font-medium">{analyzed.name}</p>
          <p className="text-xs text-gray-500">{analyzed.description}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Cal", value: Math.round(analyzed.calories) },
              { label: "Protein", value: `${Math.round(analyzed.protein)}g` },
              { label: "Carbs", value: `${Math.round(analyzed.carbs)}g` },
              { label: "Fat", value: `${Math.round(analyzed.fat)}g` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#1a1a1f] rounded-lg p-2">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => saveMeal({ ...analyzed, mealType })}
            loading={saving}
            className="w-full"
          >
            Save Meal
          </Button>
        </div>
      )}

      {/* Manual mode */}
      {mode === "manual" && !analyzed && (
        <div className="space-y-3">
          <Input
            label="Meal name"
            placeholder="e.g. Chicken and rice bowl"
            value={manual.name}
            onChange={(e) => setManual((p) => ({ ...p, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories (kcal)"
              type="number"
              placeholder="450"
              value={manual.calories}
              onChange={(e) => setManual((p) => ({ ...p, calories: e.target.value }))}
            />
            <Input
              label="Protein (g)"
              type="number"
              placeholder="35"
              value={manual.protein}
              onChange={(e) => setManual((p) => ({ ...p, protein: e.target.value }))}
            />
            <Input
              label="Carbs (g)"
              type="number"
              placeholder="40"
              value={manual.carbs}
              onChange={(e) => setManual((p) => ({ ...p, carbs: e.target.value }))}
            />
            <Input
              label="Fat (g)"
              type="number"
              placeholder="15"
              value={manual.fat}
              onChange={(e) => setManual((p) => ({ ...p, fat: e.target.value }))}
            />
          </div>
          <Button onClick={saveManual} loading={saving} className="w-full">
            <Plus className="w-4 h-4" />
            Add Meal
          </Button>
        </div>
      )}

      {/* Text AI mode */}
      {mode === "text" && !analyzed && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Describe what you ate</label>
            <textarea
              className="w-full px-3 py-2.5 bg-[#111114] border border-[#2a2a32] rounded-xl text-white placeholder:text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="e.g. A bowl of oatmeal with blueberries, a tablespoon of honey, and a glass of milk"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
          <Button
            onClick={analyzeText}
            loading={analyzing}
            className="w-full"
            disabled={!textInput.trim()}
          >
            {analyzing ? "Analyzing…" : "Analyze with Claude"}
          </Button>
        </div>
      )}

      {/* Photo mode */}
      {mode === "photo" && !analyzed && (
        <div className="space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#2a2a32] rounded-xl py-10 flex flex-col items-center gap-3 hover:border-indigo-500/50 transition-colors group"
          >
            {analyzing ? (
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-gray-600 group-hover:text-indigo-400 transition-colors" />
            )}
            <span className="text-sm text-gray-500 group-hover:text-gray-400">
              {analyzing ? "Analyzing photo…" : "Tap to upload meal photo"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) analyzePhoto(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
