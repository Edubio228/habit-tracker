import "server-only";

import { z } from "zod";

import { dateKeyToDate, dateToKey, getTodayKey } from "@/lib/habits";
import { prisma } from "@/lib/prisma";

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

type ChallengeWithHabits = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.challenge.findFirst<{
        include: {
          habits: {
            orderBy: { sortOrder: "asc" };
            include: {
              habit: {
                include: { logs: true };
              };
            };
          };
        };
      }>
    >
  >
>;

type ChallengeHabitWithHabit = ChallengeWithHabits["habits"][number];
type HabitWithLogs = ChallengeHabitWithHabit["habit"];

export type AvailableHabitDto = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  goalType: string;
  goalCount: number;
  goalUnit: string;
};

export type ChallengeDto = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  habits: {
    id: string;
    sortOrder: number;
    habit: {
      id: string;
      name: string;
      description: string | null;
      color: string;
      goalType: string;
      goalCount: number;
      goalUnit: string;
      todayCompleted: boolean;
    };
  }[];
  progress: {
    totalHabits: number;
    completedToday: number;
    completionRate: number;
  };
};

const habitIdArraySchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 0 ? [value] : [];
  }

  return [];
}, z.array(z.string().cuid("Invalid habit id.")).max(50, "You can add up to 50 habits to a challenge."));

export const challengeSchema = z
  .object({
    name: z.string().trim().min(1, "Challenge name is required.").max(80, "Challenge name must be 80 characters or fewer."),
    description: z.string().trim().max(1000, "Description must be 1000 characters or fewer.").optional().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required.").transform((value) => dateKeyToDate(value)),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date is required.").transform((value) => dateKeyToDate(value)),
    active: z.preprocess(parseActiveValue, z.boolean()).default(true),
    habitIds: habitIdArraySchema.default([]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export const challengeHabitIdSchema = z.object({
  challengeId: z.string().cuid("Invalid challenge id."),
  habitId: z.string().cuid("Invalid habit id."),
});

export const challengeIdSchema = z.object({
  challengeId: z.string().cuid("Invalid challenge id."),
});

export async function getAvailableHabits(userId: string): Promise<AvailableHabitDto[]> {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      goalType: true,
      goalCount: true,
      goalUnit: true,
    },
  });

  return habits;
}

export async function getChallengeDashboardData(userId: string): Promise<ChallengeDto[]> {
  const challenges = await prisma.challenge.findMany({
    where: {
      userId,
    },
    include: {
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          habit: {
            include: {
              logs: true,
            },
          },
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return challenges.map(challengeToDto);
}

export async function createChallenge(userId: string, input: z.infer<typeof challengeSchema>) {
  await assertHabitsBelongToUser(userId, input.habitIds);

  const challenge = await prisma.challenge.create({
    data: {
      userId,
      name: input.name,
      description: normalizeDescription(input.description),
      startDate: input.startDate,
      endDate: input.endDate,
      active: input.active,
      habits: {
        create: input.habitIds.map((habitId, index) => ({
          habitId,
          sortOrder: index,
        })),
      },
    },
    include: {
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          habit: {
            include: {
              logs: true,
            },
          },
        },
      },
    },
  });

  return challengeToDto(challenge);
}

export async function getChallengeWithHabits(userId: string, challengeId: string) {
  const challenge = await prisma.challenge.findFirst({
    where: {
      id: challengeId,
      userId,
    },
    include: {
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          habit: {
            include: {
              logs: true,
            },
          },
        },
      },
    },
  });

  if (!challenge) {
    throw new NotFoundError("Challenge not found.");
  }

  return challenge;
}

export async function deleteChallenge(userId: string, challengeId: string) {
  await getChallengeWithHabits(userId, challengeId);

  await prisma.challenge.delete({
    where: {
      id: challengeId,
    },
  });
}

export async function addHabitToChallenge(userId: string, challengeId: string, habitId: string) {
  const challenge = await getChallengeWithHabits(userId, challengeId);
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!habit) {
    throw new NotFoundError("Habit not found.");
  }

  const existing = await prisma.challengeHabit.findUnique({
    where: {
      challengeId_habitId: {
        challengeId,
        habitId,
      },
    },
  });

  if (existing) {
    return challengeToDto(challenge);
  }

  const sortOrder = await prisma.challengeHabit.count({
    where: {
      challengeId,
    },
  });

  await prisma.challengeHabit.create({
    data: {
      challengeId,
      habitId,
      sortOrder,
    },
  });

  return getChallengeWithHabits(userId, challengeId).then(challengeToDto);
}

export async function removeHabitFromChallenge(userId: string, challengeId: string, habitId: string) {
  await getChallengeWithHabits(userId, challengeId);

  const deleted = await prisma.challengeHabit.deleteMany({
    where: {
      challengeId,
      habitId,
    },
  });

  if (deleted.count === 0) {
    throw new NotFoundError("Habit is not in this challenge.");
  }

  return getChallengeWithHabits(userId, challengeId).then(challengeToDto);
}

function normalizeDescription(description?: string | null) {
  const trimmed = description?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function parseActiveValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "on" || value === "true") {
    return true;
  }

  if (value === "off" || value === "false") {
    return false;
  }

  return value;
}

async function assertHabitsBelongToUser(userId: string, habitIds: string[]) {
  if (habitIds.length === 0) {
    return;
  }

  const uniqueHabitIds = Array.from(new Set(habitIds));
  const ownedHabits = await prisma.habit.findMany({
    where: {
      id: {
        in: uniqueHabitIds,
      },
      userId,
    },
    select: {
      id: true,
    },
  });

  if (ownedHabits.length !== uniqueHabitIds.length) {
    throw new NotFoundError("One or more habits could not be added to this challenge.");
  }
}

function challengeToDto(challenge: ChallengeWithHabits): ChallengeDto {
  const todayKey = getTodayKey();
  const habits = challenge.habits.map((challengeHabit) => {
    const habit = habitWithTodayStatus(challengeHabit.habit, todayKey);

    return {
      id: challengeHabit.habitId,
      sortOrder: challengeHabit.sortOrder,
      habit,
    };
  });
  const completedToday = habits.filter((challengeHabit) => challengeHabit.habit.todayCompleted).length;

  return {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    startDate: challenge.startDate.toISOString(),
    endDate: challenge.endDate.toISOString(),
    active: challenge.active,
    createdAt: challenge.createdAt.toISOString(),
    updatedAt: challenge.updatedAt.toISOString(),
    habits,
    progress: {
      totalHabits: habits.length,
      completedToday,
      completionRate: habits.length ? Math.round((completedToday / habits.length) * 100) : 0,
    },
  };
}

function habitWithTodayStatus(habit: HabitWithLogs, todayKey: string) {
  const todayLog = habit.logs.find((log) => dateToKey(log.date) === todayKey);

  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    color: habit.color,
    goalType: habit.goalType,
    goalCount: habit.goalCount,
    goalUnit: habit.goalUnit,
    todayCompleted: Boolean(todayLog?.completed),
  };
}
