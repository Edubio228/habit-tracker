import "server-only";

import type { Habit, Log, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

type HabitWithLogs = Habit & {
  logs: Log[];
};

export type HabitDto = {
  id: string;
  name: string;
  description: string | null;
  goalType: string;
  goalCount: number;
  goalUnit: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  todayCompleted: boolean;
  todayNote: string | null;
  streak: number;
  completionRate: number;
};

export type DashboardDto = {
  habits: HabitDto[];
  summary: {
    totalHabits: number;
    completedToday: number;
    completionRate: number;
    averageStreak: number;
  };
};

export const habitSchema = z.object({
  name: z.string().trim().min(1, "Habit name is required.").max(80, "Habit name must be 80 characters or fewer."),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer.").optional().nullable(),
  goalType: z.enum(["daily"]).default("daily"),
  goalCount: z.coerce.number().int().positive("Goal count must be greater than zero.").max(100, "Goal count must be 100 or fewer.").default(1),
  goalUnit: z.string().trim().min(1, "Goal unit is required.").max(30, "Goal unit must be 30 characters or fewer.").default("day"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a valid hex color like #2A9D8F.").default("#2A9D8F"),
  active: z.preprocess((value) => (value === undefined ? undefined : value === "on"), z.boolean()).default(true),
});

export const updateHabitSchema = z.object({
  name: z.string().trim().min(1, "Habit name is required.").max(80, "Habit name must be 80 characters or fewer.").optional(),
  description: z.string().trim().max(500, "Description must be 500 characters or fewer.").optional().nullable(),
  goalType: z.enum(["daily"]).optional(),
  goalCount: z.coerce.number().int().positive("Goal count must be greater than zero.").max(100, "Goal count must be 100 or fewer.").optional(),
  goalUnit: z.string().trim().min(1, "Goal unit is required.").max(30, "Goal unit must be 30 characters or fewer.").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a valid hex color like #2A9D8F.").optional(),
  active: z.preprocess((value) => (value === undefined ? undefined : value === "on"), z.boolean()).optional(),
});

export const habitIdSchema = z.object({
  habitId: z.string().cuid("Invalid habit id."),
});

export const toggleCompletionSchema = z.object({
  habitId: z.string().cuid("Invalid habit id."),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
});

export const noteSchema = z.object({
  habitId: z.string().cuid("Invalid habit id."),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
  note: z.string().trim().max(1000, "Note must be 1000 characters or fewer.").optional(),
});

export function getTodayKey() {
  const now = new Date();

  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function dateKeyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date.");
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (dateToKey(date) !== dateKey) {
    throw new Error("Invalid date.");
  }

  return date;
}

export function dateToKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = dateKeyToDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToKey(date);
}

export function daysBetween(startKey: string, endKey: string) {
  const start = dateKeyToDate(startKey).getTime();
  const end = dateKeyToDate(endKey).getTime();

  return Math.round((end - start) / 86_400_000) + 1;
}

function maxDateKey(left: string, right: string) {
  return left >= right ? left : right;
}

function normalizeNote(note?: string | null) {
  const trimmed = note?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function getCompletedDateKeys(logs: Log[]) {
  return new Set(logs.filter((log) => log.completed).map((log) => dateToKey(log.date)));
}

export function calculateStreak(_habitId: string, endDateKey: string, logs: Log[]) {
  const completedDates = getCompletedDateKeys(logs);
  let streak = 0;
  let cursor = endDateKey;

  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

export function calculateCompletionRate(_habitId: string, startKey: string, endKey: string, logs: Log[]) {
  const totalDays = daysBetween(startKey, endKey);

  if (totalDays <= 0) {
    return 0;
  }

  const completedDays = logs.filter((log) => log.completed && dateToKey(log.date) >= startKey && dateToKey(log.date) <= endKey).length;

  return Math.round((completedDays / totalDays) * 100);
}

function habitToDto(habit: HabitWithLogs, endDateKey = getTodayKey()) {
  const todayLog = habit.logs.find((log) => dateToKey(log.date) === endDateKey);
  const streak = calculateStreak(habit.id, endDateKey, habit.logs);
  const rateStartKey = maxDateKey(addDaysToDateKey(endDateKey, -29), dateToKey(habit.createdAt));
  const completionRate = calculateCompletionRate(habit.id, rateStartKey, endDateKey, habit.logs);

  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    goalType: habit.goalType,
    goalCount: habit.goalCount,
    goalUnit: habit.goalUnit,
    color: habit.color,
    active: habit.active,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
    todayCompleted: Boolean(todayLog?.completed),
    todayNote: todayLog?.note ?? null,
    streak,
    completionRate,
  };
}

async function getHabitWithLogs(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
    include: {
      logs: true,
    },
  });

  if (!habit) {
    throw new NotFoundError("Habit not found.");
  }

  return habit;
}

export async function getDashboardData(userId: string): Promise<DashboardDto> {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      logs: true,
    },
  });

  const mappedHabits = habits.map((habit) => habitToDto(habit));
  const completedToday = mappedHabits.filter((habit) => habit.todayCompleted).length;
  const averageStreak = mappedHabits.length
    ? Math.round(mappedHabits.reduce((sum, habit) => sum + habit.streak, 0) / mappedHabits.length)
    : 0;

  return {
    habits: mappedHabits,
    summary: {
      totalHabits: mappedHabits.length,
      completedToday,
      completionRate: mappedHabits.length ? Math.round((completedToday / mappedHabits.length) * 100) : 0,
      averageStreak,
    },
  };
}

export async function createHabit(userId: string, input: z.infer<typeof habitSchema>) {
  const habit = await prisma.habit.create({
    data: {
      userId,
      ...input,
      description: normalizeNote(input.description),
    },
    include: {
      logs: true,
    },
  });

  return habitToDto(habit);
}

export async function updateHabit(userId: string, habitId: string, input: z.infer<typeof updateHabitSchema>) {
  const habit = await getHabitWithLogs(userId, habitId);
  const data: Prisma.HabitUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.description !== undefined) {
    data.description = normalizeNote(input.description);
  }

  if (input.goalType !== undefined) {
    data.goalType = input.goalType;
  }

  if (input.goalCount !== undefined) {
    data.goalCount = input.goalCount;
  }

  if (input.goalUnit !== undefined) {
    data.goalUnit = input.goalUnit;
  }

  if (input.color !== undefined) {
    data.color = input.color;
  }

  if (input.active !== undefined) {
    data.active = input.active;
  }

  const updatedHabit = await prisma.habit.update({
    where: {
      id: habit.id,
    },
    data,
    include: {
      logs: true,
    },
  });

  return habitToDto(updatedHabit);
}

export async function deleteHabit(userId: string, habitId: string) {
  const habit = await getHabitWithLogs(userId, habitId);

  await prisma.habit.delete({
    where: {
      id: habit.id,
    },
  });
}

export async function toggleLogForDate(userId: string, habitId: string, dateKey: string) {
  const habit = await getHabitWithLogs(userId, habitId);
  const date = dateKeyToDate(dateKey);
  const existing = await prisma.log.findUnique({
    where: {
      habitId_date: {
        habitId: habit.id,
        date,
      },
    },
  });

  if (existing) {
    await prisma.log.update({
      where: {
        id: existing.id,
      },
      data: {
        completed: !existing.completed,
      },
    });
  } else {
    await prisma.log.create({
      data: {
        habitId: habit.id,
        date,
        completed: true,
      },
    });
  }

  const updatedHabit = await getHabitWithLogs(userId, habitId);

  return habitToDto(updatedHabit);
}

export async function updateLogNote(userId: string, habitId: string, dateKey: string, note: string) {
  const habit = await getHabitWithLogs(userId, habitId);
  const date = dateKeyToDate(dateKey);
  const normalizedNote = normalizeNote(note);
  const existing = await prisma.log.findUnique({
    where: {
      habitId_date: {
        habitId: habit.id,
        date,
      },
    },
  });

  if (existing) {
    await prisma.log.update({
      where: {
        id: existing.id,
      },
      data: {
        note: normalizedNote,
      },
    });
  } else {
    await prisma.log.create({
      data: {
        habitId: habit.id,
        date,
        completed: false,
        note: normalizedNote,
      },
    });
  }

  const updatedHabit = await getHabitWithLogs(userId, habitId);

  return habitToDto(updatedHabit);
}
