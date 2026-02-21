/**
 * Seed script: creates two demo users with fabricated 2-week data.
 * Run with: npx tsx scripts/seed.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date("2026-02-21");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  // Clear any existing demo users
  await db.delete(schema.users).where(eq(schema.users.email, "test@fittrack.demo"));
  await db.delete(schema.users).where(eq(schema.users.email, "david@fittrack.demo"));

  console.log("🌱 Seeding demo users...");

  // ── User 1: test / test ────────────────────────────────────────────────────
  const [testUser] = await db
    .insert(schema.users)
    .values({
      name: "Test User",
      email: "test@fittrack.demo",
      username: "test",
      password: hashPassword("test"),
    })
    .returning();

  console.log("  ✓ Created user: test");

  // Goals
  await db.insert(schema.goals).values({
    userId: testUser.id,
    targetCalories: 2200,
    targetProtein: 160,
    targetCarbs: 240,
    targetFat: 70,
    targetFiber: 30,
    targetWeight: 80,
    targetLifts: { "Bench Press": 100, Squat: 120, Deadlift: 140 },
  });

  // ── Nutrition logs: 14 days ────────────────────────────────────────────────

  type MealSpec = {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };

  const mealPlans: MealSpec[][] = [
    // Day 14 ago (Feb 7)
    [
      { mealType: "breakfast", name: "Oatmeal with banana & honey", calories: 380, protein: 10, carbs: 68, fat: 7, fiber: 6 },
      { mealType: "lunch", name: "Grilled chicken salad with avocado", calories: 480, protein: 42, carbs: 18, fat: 24, fiber: 7 },
      { mealType: "dinner", name: "Salmon fillet with rice & steamed broccoli", calories: 580, protein: 44, carbs: 52, fat: 18, fiber: 6 },
      { mealType: "snack", name: "Greek yogurt with berries", calories: 160, protein: 14, carbs: 18, fat: 3, fiber: 2 },
    ],
    // Day 13 ago (Feb 8)
    [
      { mealType: "breakfast", name: "Scrambled eggs with whole-wheat toast", calories: 420, protein: 26, carbs: 34, fat: 18, fiber: 3 },
      { mealType: "lunch", name: "Turkey & avocado wrap", calories: 520, protein: 30, carbs: 52, fat: 20, fiber: 5 },
      { mealType: "dinner", name: "Beef stir-fry with vegetables & noodles", calories: 640, protein: 38, carbs: 70, fat: 20, fiber: 6 },
      { mealType: "snack", name: "Almonds & apple", calories: 220, protein: 6, carbs: 26, fat: 12, fiber: 5 },
    ],
    // Day 12 ago (Feb 9) — Push Day workout
    [
      { mealType: "breakfast", name: "Protein pancakes with maple syrup", calories: 460, protein: 32, carbs: 58, fat: 12, fiber: 4 },
      { mealType: "lunch", name: "Tuna & chickpea salad", calories: 440, protein: 38, carbs: 36, fat: 12, fiber: 8 },
      { mealType: "dinner", name: "Grilled chicken breast with sweet potato", calories: 560, protein: 48, carbs: 52, fat: 10, fiber: 7 },
      { mealType: "snack", name: "Whey protein shake with milk", calories: 220, protein: 28, carbs: 20, fat: 4, fiber: 1 },
    ],
    // Day 11 ago (Feb 10)
    [
      { mealType: "breakfast", name: "Greek yogurt parfait with granola", calories: 390, protein: 18, carbs: 56, fat: 10, fiber: 4 },
      { mealType: "lunch", name: "Chicken caesar wrap", calories: 510, protein: 34, carbs: 48, fat: 18, fiber: 4 },
      { mealType: "dinner", name: "Pasta with tomato & ground turkey sauce", calories: 620, protein: 40, carbs: 76, fat: 14, fiber: 6 },
    ],
    // Day 10 ago (Feb 11) — Pull Day workout
    [
      { mealType: "breakfast", name: "Overnight oats with chia & blueberries", calories: 400, protein: 14, carbs: 62, fat: 10, fiber: 9 },
      { mealType: "lunch", name: "Quinoa bowl with roasted veg & feta", calories: 480, protein: 18, carbs: 62, fat: 16, fiber: 8 },
      { mealType: "dinner", name: "Pan-seared cod with lentils & spinach", calories: 520, protein: 46, carbs: 44, fat: 12, fiber: 10 },
      { mealType: "snack", name: "Cottage cheese with pineapple", calories: 180, protein: 20, carbs: 18, fat: 3, fiber: 1 },
    ],
    // Day 9 ago (Feb 12)
    [
      { mealType: "breakfast", name: "Egg white omelette with mushrooms & spinach", calories: 310, protein: 28, carbs: 12, fat: 14, fiber: 3 },
      { mealType: "lunch", name: "Smoked salmon bagel with cream cheese", calories: 490, protein: 26, carbs: 52, fat: 18, fiber: 3 },
      { mealType: "dinner", name: "Chicken & vegetable curry with brown rice", calories: 640, protein: 42, carbs: 72, fat: 16, fiber: 8 },
      { mealType: "snack", name: "Protein bar", calories: 200, protein: 20, carbs: 22, fat: 6, fiber: 3 },
    ],
    // Day 8 ago (Feb 13) — Leg Day workout
    [
      { mealType: "breakfast", name: "French toast with berries & maple syrup", calories: 440, protein: 16, carbs: 72, fat: 10, fiber: 4 },
      { mealType: "lunch", name: "Beef & bean burrito bowl", calories: 580, protein: 38, carbs: 68, fat: 16, fiber: 10 },
      { mealType: "dinner", name: "Pork tenderloin with roasted potatoes & beans", calories: 600, protein: 44, carbs: 58, fat: 16, fiber: 8 },
      { mealType: "snack", name: "Banana with peanut butter", calories: 280, protein: 8, carbs: 38, fat: 12, fiber: 4 },
    ],
    // Day 7 ago (Feb 14)
    [
      { mealType: "breakfast", name: "Smoothie bowl with granola & mixed fruit", calories: 420, protein: 12, carbs: 74, fat: 8, fiber: 7 },
      { mealType: "lunch", name: "Grilled halloumi & roasted vegetable wrap", calories: 500, protein: 22, carbs: 56, fat: 20, fiber: 6 },
      { mealType: "dinner", name: "Prawn stir-fry with egg noodles", calories: 560, protein: 36, carbs: 66, fat: 14, fiber: 5 },
    ],
    // Day 6 ago (Feb 15) — Run workout
    [
      { mealType: "breakfast", name: "Avocado toast with poached eggs", calories: 450, protein: 22, carbs: 38, fat: 24, fiber: 8 },
      { mealType: "lunch", name: "Grilled chicken & roasted veg grain bowl", calories: 540, protein: 44, carbs: 56, fat: 14, fiber: 9 },
      { mealType: "dinner", name: "Baked cod with sweet potato mash & peas", calories: 520, protein: 42, carbs: 56, fat: 10, fiber: 8 },
      { mealType: "snack", name: "Chocolate milk post-run recovery", calories: 200, protein: 8, carbs: 32, fat: 4, fiber: 0 },
    ],
    // Day 5 ago (Feb 16)
    [
      { mealType: "breakfast", name: "Bircher muesli with apple & raisins", calories: 390, protein: 12, carbs: 66, fat: 8, fiber: 6 },
      { mealType: "lunch", name: "Lentil & vegetable soup with bread", calories: 420, protein: 18, carbs: 62, fat: 8, fiber: 12 },
      { mealType: "dinner", name: "Chicken tikka masala with basmati rice & naan", calories: 720, protein: 44, carbs: 86, fat: 20, fiber: 6 },
      { mealType: "snack", name: "Mixed nuts & dried cranberries", calories: 200, protein: 5, carbs: 20, fat: 12, fiber: 3 },
    ],
    // Day 4 ago (Feb 17) — Push Day B workout
    [
      { mealType: "breakfast", name: "Protein waffles with strawberries", calories: 420, protein: 30, carbs: 52, fat: 10, fiber: 4 },
      { mealType: "lunch", name: "Pulled chicken sandwich with coleslaw", calories: 540, protein: 38, carbs: 60, fat: 14, fiber: 5 },
      { mealType: "dinner", name: "Sirloin steak with sweet potato fries & salad", calories: 680, protein: 52, carbs: 52, fat: 24, fiber: 7 },
      { mealType: "snack", name: "Casein protein shake", calories: 160, protein: 24, carbs: 10, fat: 2, fiber: 1 },
    ],
    // Day 3 ago (Feb 18)
    [
      { mealType: "breakfast", name: "Smashed avocado on rye with smoked salmon", calories: 460, protein: 28, carbs: 38, fat: 22, fiber: 7 },
      { mealType: "lunch", name: "Chicken noodle soup with crusty bread", calories: 480, protein: 30, carbs: 58, fat: 10, fiber: 5 },
      { mealType: "dinner", name: "Lamb chops with roasted asparagus & mash", calories: 640, protein: 48, carbs: 42, fat: 28, fiber: 6 },
    ],
    // Day 2 ago (Feb 19) — Pull Day B workout
    [
      { mealType: "breakfast", name: "High-protein overnight oats", calories: 440, protein: 30, carbs: 56, fat: 10, fiber: 8 },
      { mealType: "lunch", name: "Turkey meatball sub with marinara", calories: 560, protein: 40, carbs: 66, fat: 14, fiber: 5 },
      { mealType: "dinner", name: "Grilled salmon with quinoa & green beans", calories: 580, protein: 48, carbs: 46, fat: 18, fiber: 7 },
      { mealType: "snack", name: "Edamame & rice cakes", calories: 180, protein: 10, carbs: 26, fat: 4, fiber: 6 },
    ],
    // Day 1 ago (Feb 20) — Leg Day B workout
    [
      { mealType: "breakfast", name: "Eggs Benedict with spinach", calories: 480, protein: 28, carbs: 36, fat: 26, fiber: 4 },
      { mealType: "lunch", name: "Beef & vegetable stew with crusty roll", calories: 560, protein: 38, carbs: 58, fat: 16, fiber: 8 },
      { mealType: "dinner", name: "Teriyaki salmon with jasmine rice & pak choi", calories: 600, protein: 44, carbs: 62, fat: 16, fiber: 5 },
      { mealType: "snack", name: "Whey protein shake + banana", calories: 300, protein: 28, carbs: 40, fat: 4, fiber: 2 },
    ],
  ];

  for (let i = 0; i < mealPlans.length; i++) {
    const daysBack = 14 - i; // 14, 13, 12 … 1
    const date = daysAgo(daysBack);
    const meals = mealPlans[i];

    const totals = meals.reduce(
      (acc, m) => ({
        totalCalories: acc.totalCalories + m.calories,
        totalProtein: acc.totalProtein + m.protein,
        totalCarbs: acc.totalCarbs + m.carbs,
        totalFat: acc.totalFat + m.fat,
        totalFiber: acc.totalFiber + m.fiber,
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 }
    );

    const [log] = await db
      .insert(schema.nutritionLogs)
      .values({ userId: testUser.id, date, ...totals })
      .returning();

    await db.insert(schema.meals).values(
      meals.map((m) => ({
        nutritionLogId: log.id,
        userId: testUser.id,
        source: "manual" as const,
        ...m,
      }))
    );
  }

  console.log("  ✓ Inserted 14 days of nutrition logs");

  // ── Workouts: 8 sessions over 2 weeks ──────────────────────────────────────

  // Helper to insert a workout + exercises and return the workout
  async function insertWorkout(opts: {
    name: string;
    date: string;
    activityType: string;
    durationMinutes: number;
    caloriesBurned?: number;
    perceivedEffort: number;
    exercises?: Array<{
      name: string;
      sets?: number;
      reps?: number;
      weightKg?: number;
      distanceKm?: number;
      isPR?: boolean;
    }>;
  }) {
    const [workout] = await db
      .insert(schema.workouts)
      .values({
        userId: testUser.id,
        name: opts.name,
        date: opts.date,
        activityType: opts.activityType,
        durationMinutes: opts.durationMinutes,
        caloriesBurned: opts.caloriesBurned,
        perceivedEffort: opts.perceivedEffort,
        source: "manual",
      })
      .returning();

    if (opts.exercises?.length) {
      await db.insert(schema.exercises).values(
        opts.exercises.map((e) => ({
          workoutId: workout.id,
          userId: testUser.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weightKg: e.weightKg,
          distanceKm: e.distanceKm,
          isPR: e.isPR ?? false,
          volume: e.sets && e.reps && e.weightKg ? e.sets * e.reps * e.weightKg : undefined,
        }))
      );
    }

    return workout;
  }

  // Feb 7 — Push Day A
  await insertWorkout({
    name: "Push Day A",
    date: daysAgo(14),
    activityType: "strength",
    durationMinutes: 65,
    caloriesBurned: 340,
    perceivedEffort: 7,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, weightKg: 80, isPR: false },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weightKg: 30, isPR: false },
      { name: "Shoulder Press", sets: 3, reps: 10, weightKg: 50, isPR: false },
      { name: "Tricep Pushdown", sets: 3, reps: 12, weightKg: 25, isPR: false },
      { name: "Lateral Raises", sets: 3, reps: 15, weightKg: 10, isPR: false },
    ],
  });

  // Feb 9 — Pull Day A
  await insertWorkout({
    name: "Pull Day A",
    date: daysAgo(12),
    activityType: "strength",
    durationMinutes: 70,
    caloriesBurned: 360,
    perceivedEffort: 8,
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, weightKg: 110, isPR: false },
      { name: "Barbell Row", sets: 4, reps: 8, weightKg: 70, isPR: false },
      { name: "Pull-ups", sets: 3, reps: 8, weightKg: 0, isPR: false },
      { name: "Face Pulls", sets: 3, reps: 15, weightKg: 15, isPR: false },
      { name: "Hammer Curls", sets: 3, reps: 12, weightKg: 18, isPR: false },
    ],
  });

  // Feb 11 — Leg Day A
  await insertWorkout({
    name: "Leg Day A",
    date: daysAgo(10),
    activityType: "strength",
    durationMinutes: 75,
    caloriesBurned: 420,
    perceivedEffort: 9,
    exercises: [
      { name: "Squat", sets: 4, reps: 8, weightKg: 90, isPR: false },
      { name: "Leg Press", sets: 3, reps: 12, weightKg: 120, isPR: false },
      { name: "Romanian Deadlift", sets: 3, reps: 10, weightKg: 70, isPR: false },
      { name: "Leg Curl", sets: 3, reps: 12, weightKg: 45, isPR: false },
      { name: "Calf Raises", sets: 4, reps: 15, weightKg: 50, isPR: false },
    ],
  });

  // Feb 13 — 5km run
  await insertWorkout({
    name: "Morning Run — 5km",
    date: daysAgo(8),
    activityType: "run",
    durationMinutes: 25,
    caloriesBurned: 310,
    perceivedEffort: 6,
    exercises: [
      { name: "Running", distanceKm: 5 },
    ],
  });

  // Feb 15 — Push Day B (PR on bench)
  await insertWorkout({
    name: "Push Day B",
    date: daysAgo(6),
    activityType: "strength",
    durationMinutes: 65,
    caloriesBurned: 350,
    perceivedEffort: 8,
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8, weightKg: 82.5, isPR: true },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weightKg: 32, isPR: false },
      { name: "Shoulder Press", sets: 3, reps: 10, weightKg: 52.5, isPR: true },
      { name: "Tricep Pushdown", sets: 3, reps: 12, weightKg: 27.5, isPR: false },
      { name: "Lateral Raises", sets: 3, reps: 15, weightKg: 11, isPR: false },
    ],
  });

  // Feb 17 — Pull Day B (PR on deadlift)
  await insertWorkout({
    name: "Pull Day B",
    date: daysAgo(4),
    activityType: "strength",
    durationMinutes: 70,
    caloriesBurned: 370,
    perceivedEffort: 9,
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5, weightKg: 115, isPR: true },
      { name: "Barbell Row", sets: 4, reps: 8, weightKg: 72.5, isPR: false },
      { name: "Pull-ups", sets: 3, reps: 9, weightKg: 0, isPR: true },
      { name: "Face Pulls", sets: 3, reps: 15, weightKg: 17.5, isPR: false },
      { name: "Hammer Curls", sets: 3, reps: 12, weightKg: 20, isPR: true },
    ],
  });

  // Feb 19 — Leg Day B (PR on squat)
  await insertWorkout({
    name: "Leg Day B",
    date: daysAgo(2),
    activityType: "strength",
    durationMinutes: 80,
    caloriesBurned: 440,
    perceivedEffort: 9,
    exercises: [
      { name: "Squat", sets: 4, reps: 8, weightKg: 92.5, isPR: true },
      { name: "Leg Press", sets: 3, reps: 12, weightKg: 125, isPR: false },
      { name: "Romanian Deadlift", sets: 3, reps: 10, weightKg: 72.5, isPR: false },
      { name: "Leg Curl", sets: 3, reps: 12, weightKg: 47.5, isPR: false },
      { name: "Calf Raises", sets: 4, reps: 15, weightKg: 55, isPR: true },
    ],
  });

  // Feb 21 — 6km run (today)
  await insertWorkout({
    name: "Morning Run — 6km",
    date: daysAgo(0),
    activityType: "run",
    durationMinutes: 28,
    caloriesBurned: 370,
    perceivedEffort: 7,
    exercises: [
      { name: "Running", distanceKm: 6 },
    ],
  });

  console.log("  ✓ Inserted 8 workouts with progressive overload");

  // ── User 2: david / David ──────────────────────────────────────────────────
  await db
    .insert(schema.users)
    .values({
      name: "David",
      email: "david@fittrack.demo",
      username: "david",
      password: hashPassword("David"),
    });

  console.log("  ✓ Created user: david (no data)");
  console.log("\n✅ Seeding complete!");
  console.log("   test  / test  → 2 weeks of data");
  console.log("   david / David → blank account");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
