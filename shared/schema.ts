import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const studyPlans = pgTable("study_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testDate: text("test_date").notNull(),
  weekdayHours: integer("weekday_hours").notNull(),
  weekendHours: integer("weekend_hours").notNull(),
  practiceTestDays: jsonb("practice_test_days").$type<string[]>().notNull(),
  blackoutDates: jsonb("blackout_dates").$type<Array<{date: string, reason?: string}>>().notNull(),
  taperDays: integer("taper_days").notNull().default(3),
  outputFormat: text("output_format").notNull().default("excel"),
  schedule: jsonb("schedule").$type<Array<{
    date: string;
    dayOfWeek: string;
    daysLeft: number;
    practiceQuestions?: string;
    cars?: string;
    review?: string;
    isPracticeTest?: boolean;
    isReviewDay?: boolean;
    isBlackout?: boolean;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  schedule: true,
  createdAt: true,
}).extend({
  testDate: z.string().min(1, "Test date is required"),
  weekdayHours: z.number().min(1, "Must be at least 1 hour").max(16, "Cannot exceed 16 hours"),
  weekendHours: z.number().min(1, "Must be at least 1 hour").max(16, "Cannot exceed 16 hours"),
  practiceTestDays: z.array(z.string()).min(1, "Select at least one practice test day"),
  blackoutDates: z.array(z.object({
    date: z.string(),
    reason: z.string().optional(),
  })).default([]),
  taperDays: z.number().min(2).max(4).default(3),
  outputFormat: z.enum(["excel", "google-sheets"]).default("excel"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;
