import { relations } from "drizzle-orm";
import {
  users,
  accounts,
  sessions,
  nutritionLogs,
  meals,
  workouts,
  exercises,
  bodyPhotos,
  goals,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  nutritionLogs: many(nutritionLogs),
  meals: many(meals),
  workouts: many(workouts),
  exercises: many(exercises),
  bodyPhotos: many(bodyPhotos),
  goals: one(goals, { fields: [users.id], references: [goals.userId] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const nutritionLogsRelations = relations(nutritionLogs, ({ one, many }) => ({
  user: one(users, { fields: [nutritionLogs.userId], references: [users.id] }),
  meals: many(meals),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, { fields: [meals.userId], references: [users.id] }),
  nutritionLog: one(nutritionLogs, {
    fields: [meals.nutritionLogId],
    references: [nutritionLogs.id],
  }),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, { fields: [workouts.userId], references: [users.id] }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  user: one(users, { fields: [exercises.userId], references: [users.id] }),
  workout: one(workouts, { fields: [exercises.workoutId], references: [workouts.id] }),
}));

export const bodyPhotosRelations = relations(bodyPhotos, ({ one }) => ({
  user: one(users, { fields: [bodyPhotos.userId], references: [users.id] }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));
