import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  primaryKey,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// ─── NextAuth tables ────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  // Credentials auth
  username: text("username").unique(),
  password: text("password"), // scrypt hash: "salt:hash"
  // Garmin OAuth tokens (stored server-side, never exposed to client)
  garminAccessToken: text("garmin_access_token"),
  garminRefreshToken: text("garmin_refresh_token"),
  garminTokenExpiry: timestamp("garmin_token_expiry", { mode: "date" }),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ─── Goals ──────────────────────────────────────────────────────────────────

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Nutrition goals
  targetCalories: integer("target_calories").default(2000),
  targetProtein: real("target_protein").default(150), // grams
  targetCarbs: real("target_carbs").default(200),     // grams
  targetFat: real("target_fat").default(65),           // grams
  targetFiber: real("target_fiber").default(30),       // grams
  // Body goals
  targetWeight: real("target_weight"),                 // kg
  // Workout goals (JSON for flexibility: e.g. {benchPress: 100, squat: 120})
  targetLifts: jsonb("target_lifts").$type<Record<string, number>>(),
  // Training routine preference
  trainingRoutine: text("training_routine").default("ppl"), // "ppl" | "5day" | "custom"
  customRoutine: jsonb("custom_routine").$type<string[]>(), // ordered session names for custom split
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Nutrition ───────────────────────────────────────────────────────────────

export const nutritionLogs = pgTable("nutrition_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD — partition by date for easy daily rollup
  // Daily totals (denormalized for fast queries)
  totalCalories: real("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  totalFiber: real("total_fiber").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  nutritionLogId: uuid("nutrition_log_id")
    .notNull()
    .references(() => nutritionLogs.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mealType: text("meal_type").$type<"breakfast" | "lunch" | "dinner" | "snack">().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  // Macros
  calories: real("calories").default(0),
  protein: real("protein").default(0),
  carbs: real("carbs").default(0),
  fat: real("fat").default(0),
  fiber: real("fiber").default(0),
  // Photo (optional — Cloudinary URL if user uploaded a photo)
  photoUrl: text("photo_url"),
  // Source of entry
  source: text("source").$type<"manual" | "photo_ai" | "text_ai">().default("manual"),
  loggedAt: timestamp("logged_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Workouts ────────────────────────────────────────────────────────────────

export const workouts = pgTable("workouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  durationMinutes: integer("duration_minutes"),
  caloriesBurned: real("calories_burned"),
  notes: text("notes"),
  // Garmin sync metadata
  garminActivityId: text("garmin_activity_id").unique(),
  source: text("source").$type<"manual" | "garmin">().default("manual"),
  // Activity type (run, lift, cycle, swim, etc.)
  activityType: text("activity_type").default("strength"),
  // Perceived effort 1-10
  perceivedEffort: integer("perceived_effort"),
  loggedAt: timestamp("logged_at", { mode: "date" }).defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  // For strength training
  sets: integer("sets"),
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  // For cardio
  distanceKm: real("distance_km"),
  durationSeconds: integer("duration_seconds"),
  // Is this a PR?
  isPR: boolean("is_pr").default(false),
  // Calculated volume = sets * reps * weight
  volume: real("volume"),
  loggedAt: timestamp("logged_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Body Photos ──────────────────────────────────────────────────────────────

export const bodyPhotos = pgTable("body_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  // Cloudinary
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  // Optional metadata
  weightKg: real("weight_kg"),
  note: text("note"),
  uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type BodyPhoto = typeof bodyPhotos.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;
export type InsertWorkout = typeof workouts.$inferInsert;
export type InsertExercise = typeof exercises.$inferInsert;
export type InsertBodyPhoto = typeof bodyPhotos.$inferInsert;
