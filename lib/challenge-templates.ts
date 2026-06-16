import "server-only";

import { randomBytes } from "node:crypto";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export type ChallengeTemplateCreatorDto = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export type ChallengeTemplateHabitDto = {
  id: string;
  name: string;
  description: string | null;
  goalType: string;
  goalCount: number;
  goalUnit: string;
  color: string;
  sortOrder: number;
};

export type ChallengeTemplateDto = {
  id: string;
  challengeId: string | null;
  title: string;
  description: string | null;
  durationDays: number;
  shareToken: string;
  slug: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  totalImports: number;
  activeParticipants: number;
  averageCompletionRate: number;
  createdAt: string;
  updatedAt: string;
  creator: ChallengeTemplateCreatorDto;
  habits: ChallengeTemplateHabitDto[];
};

export type PublicChallengeTemplateDto = Omit<ChallengeTemplateDto, "challengeId" | "status">;

export type ImportedChallengeDto = {
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

type TemplateRecord = {
  id: string;
  challengeId: string | null;
  creatorId: string;
  title: string;
  description: string | null;
  durationDays: number;
  shareToken: string;
  slug: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: Date | null;
  totalImports: number;
  activeParticipants: number;
  averageCompletionRate: number;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  habits: Array<{
    id: string;
    name: string;
    description: string | null;
    goalType: string;
    goalCount: number;
    goalUnit: string;
    color: string;
    sortOrder: number;
  }>;
};

type ImportedChallengeRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  habits: Array<{
    challengeId: string;
    habitId: string;
    sortOrder: number;
    habit: {
      id: string;
      name: string;
      description: string | null;
      color: string;
      goalType: string;
      goalCount: number;
      goalUnit: string;
      logs: Array<{
        date: Date;
        completed: boolean;
      }>;
    };
  }>;
};

export const challengeTemplateIdSchema = z.object({
  templateId: z.string().cuid("Invalid template id."),
});

export const challengeIdSchema = z.object({
  challengeId: z.string().cuid("Invalid challenge id."),
});

export const publishChallengeTemplateSchema = z.object({
  title: z.string().trim().min(1, "Template title is required.").max(80, "Template title must be 80 characters or fewer."),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer.").optional().nullable(),
  slug: z.string().trim().max(80, "Slug must be 80 characters or fewer.").optional().nullable(),
});

export const importChallengeTemplateSchema = z.object({
  shareToken: z.string().min(1, "Share link is required."),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required.").transform((value) => dateKeyToDate(value)),
});

export async function publishChallengeTemplate(userId: string, challengeId: string, input: z.infer<typeof publishChallengeTemplateSchema>) {
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
          habit: true,
        },
      },
    },
  });

  if (!challenge) {
    throw new NotFoundError("Challenge not found.");
  }

  const snapshotHabits = challenge.habits.map((challengeHabit) => ({
    name: challengeHabit.habit.name,
    description: normalizeDescription(challengeHabit.habit.description),
    goalType: challengeHabit.habit.goalType,
    goalCount: challengeHabit.habit.goalCount,
    goalUnit: challengeHabit.habit.goalUnit,
    color: challengeHabit.habit.color,
    sortOrder: challengeHabit.sortOrder,
  }));

  const template = await prisma.$transaction(async (tx) => {
    const existing = await tx.challengeTemplate.findFirst({
      where: {
        creatorId: userId,
        challengeId,
      },
      select: {
        id: true,
        shareToken: true,
      },
    });

    const normalizedSlug = normalizeSlug(input.slug);

    if (normalizedSlug) {
      const slugConflict = await tx.challengeTemplate.findFirst({
        where: {
          slug: normalizedSlug,
          id: existing ? { not: existing.id } : undefined,
        },
        select: {
          id: true,
        },
      });

      if (slugConflict) {
        throw new Error("This share slug is already in use.");
      }
    }

    const shareToken = existing?.shareToken ?? createShareToken();
    const template = existing
      ? await tx.challengeTemplate.update({
          where: {
            id: existing.id,
          },
          data: {
            title: input.title,
            description: normalizeDescription(input.description),
            durationDays: Math.max(1, daysBetween(challenge.startDate, challenge.endDate)),
            slug: normalizedSlug,
            status: "published",
            publishedAt: new Date(),
          },
        })
      : await tx.challengeTemplate.create({
          data: {
            challengeId,
            creatorId: userId,
            title: input.title,
            description: normalizeDescription(input.description),
            durationDays: Math.max(1, daysBetween(challenge.startDate, challenge.endDate)),
            shareToken,
            slug: normalizedSlug,
            status: "published",
            publishedAt: new Date(),
          },
        });

    await tx.challengeTemplateHabit.deleteMany({
      where: {
        templateId: template.id,
      },
    });

    if (snapshotHabits.length > 0) {
      await tx.challengeTemplateHabit.createMany({
        data: snapshotHabits.map((snapshotHabit) => ({
          ...snapshotHabit,
          templateId: template.id,
        })),
      });
    }

    return template;
  });

  await refreshTemplateMetrics(template.id);

  return getCreatorTemplateById(template.id);
}

export async function getPublicChallengeTemplateByToken(shareToken: string): Promise<PublicChallengeTemplateDto> {
  const template = await prisma.challengeTemplate.findUnique({
    where: {
      shareToken,
      status: "published",
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!template) {
    throw new NotFoundError("Challenge template not found.");
  }

  return templateToPublicDto(template);
}

export async function getPublishedTemplates({
  search,
  limit = 20,
  cursor,
}: {
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  const trimmedSearch = search?.trim();
  const templates = await prisma.challengeTemplate.findMany({
    where: {
      status: "published",
      ...(trimmedSearch
        ? {
            OR: [
              {
                title: {
                  contains: trimmedSearch,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: trimmedSearch,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: [
      {
        activeParticipants: "desc",
      },
      {
        averageCompletionRate: "desc",
      },
      {
        totalImports: "desc",
      },
    ],
    take: Math.min(limit, 50),
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  });

  return {
    items: templates.map(templateToPublicDto),
    nextCursor: templates.at(-1)?.id ?? null,
  };
}

export async function importChallengeTemplate(userId: string, shareToken: string, startDate: Date): Promise<ImportedChallengeDto> {
  const template = await getPublicChallengeTemplateByToken(shareToken);
  const existingImport = await prisma.challengeImport.findUnique({
    where: {
      templateId_userId: {
        templateId: template.id,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingImport) {
    throw new Error("You have already imported this challenge.");
  }

  const endDate = addDaysToDate(startDate, template.durationDays - 1);

  const importedChallenge = await prisma.$transaction(async (tx) => {
    const importedHabitIds: string[] = [];

    for (const templateHabit of template.habits) {
      const habit = await tx.habit.create({
        data: {
          userId,
          name: templateHabit.name,
          description: normalizeDescription(templateHabit.description),
          goalType: templateHabit.goalType,
          goalCount: templateHabit.goalCount,
          goalUnit: templateHabit.goalUnit,
          color: templateHabit.color,
          active: true,
        },
      });

      importedHabitIds.push(habit.id);
    }

    const challenge = await tx.challenge.create({
      data: {
        userId,
        name: template.title,
        description: normalizeDescription(template.description),
        startDate,
        endDate,
        active: true,
        habits: {
          create: importedHabitIds.map((habitId, index) => ({
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

    await tx.challengeImport.create({
      data: {
        templateId: template.id,
        userId,
        importedChallengeId: challenge.id,
        startDate,
        endDate,
        status: "active",
      },
    });

    return challenge;
  });

  await refreshTemplateMetrics(template.id);

  return importedChallengeToDto(importedChallenge);
}

export async function getCreatorTemplates(userId: string): Promise<ChallengeTemplateDto[]> {
  const templates = await prisma.challengeTemplate.findMany({
    where: {
      creatorId: userId,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return templates.map(templateToDto);
}

export async function getChallengeTemplateForChallenge(userId: string, challengeId: string): Promise<ChallengeTemplateDto | null> {
  const template = await prisma.challengeTemplate.findFirst({
    where: {
      creatorId: userId,
      challengeId,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  return template ? templateToDto(template) : null;
}

export async function getCreatorTemplateById(templateId: string): Promise<ChallengeTemplateDto> {
  const template = await prisma.challengeTemplate.findUnique({
    where: {
      id: templateId,
    },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      habits: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!template) {
    throw new NotFoundError("Challenge template not found.");
  }

  return templateToDto(template);
}

export async function unpublishChallengeTemplate(userId: string, templateId: string) {
  await assertTemplateBelongsToUser(userId, templateId);

  const template = await prisma.challengeTemplate.update({
    where: {
      id: templateId,
    },
    data: {
      status: "archived",
      publishedAt: null,
    },
  });

  await refreshTemplateMetrics(template.id);

  return getCreatorTemplateById(template.id);
}

export async function deleteChallengeTemplate(userId: string, templateId: string) {
  await assertTemplateBelongsToUser(userId, templateId);

  await prisma.challengeTemplate.delete({
    where: {
      id: templateId,
    },
  });
}

export async function hasImportedChallengeTemplate(userId: string, shareToken: string) {
  const template = await prisma.challengeTemplate.findUnique({
    where: {
      shareToken,
      status: "published",
    },
    select: {
      id: true,
    },
  });

  if (!template) {
    return false;
  }

  const existingImport = await prisma.challengeImport.findUnique({
    where: {
      templateId_userId: {
        templateId: template.id,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(existingImport);
}

export async function refreshTemplateMetrics(templateId: string) {
  const imports = await prisma.challengeImport.findMany({
    where: {
      templateId,
    },
    include: {
      importedChallenge: {
        include: {
          habits: {
            include: {
              habit: {
                include: {
                  logs: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const totalImports = imports.length;
  const activeParticipants = imports.filter((challengeImport) => challengeImport.status === "active").length;
  const completionRates: number[] = [];

  for (const challengeImport of imports) {
    const startKey = dateToKey(challengeImport.startDate);
    const endKey = dateToKey(challengeImport.endDate);
    const totalDays = daysBetween(challengeImport.startDate, challengeImport.endDate);

    if (totalDays <= 0) {
      continue;
    }

    for (const challengeHabit of challengeImport.importedChallenge.habits) {
      const completedDays = challengeHabit.habit.logs.filter((log) => {
        const logKey = dateToKey(log.date);
        return log.completed && logKey >= startKey && logKey <= endKey;
      }).length;

      completionRates.push(Math.round((completedDays / totalDays) * 100));
    }
  }

  const averageCompletionRate = completionRates.length
    ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
    : 0;

  await prisma.challengeTemplate.update({
    where: {
      id: templateId,
    },
    data: {
      totalImports,
      activeParticipants,
      averageCompletionRate,
    },
  });
}

export async function refreshTemplateMetricsForHabit(habitId: string) {
  const imports = await prisma.challengeImport.findMany({
    where: {
      importedChallenge: {
        habits: {
          some: {
            habitId,
          },
        },
      },
    },
    select: {
      templateId: true,
    },
  });

  const templateIds = Array.from(new Set(imports.map((challengeImport) => challengeImport.templateId)));

  await Promise.all(templateIds.map((templateId) => refreshTemplateMetrics(templateId)));
}

export function getTemplateCreatorDisplayName(creator: ChallengeTemplateCreatorDto) {
  return creator.name?.trim() || creator.email || "Anonymous creator";
}

async function assertTemplateBelongsToUser(userId: string, templateId: string) {
  const template = await prisma.challengeTemplate.findFirst({
    where: {
      id: templateId,
      creatorId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!template) {
    throw new NotFoundError("Challenge template not found.");
  }
}

function templateToDto(template: TemplateRecord): ChallengeTemplateDto {
  return {
    id: template.id,
    challengeId: template.challengeId,
    title: template.title,
    description: template.description,
    durationDays: template.durationDays,
    shareToken: template.shareToken,
    slug: template.slug,
    status: template.status,
    publishedAt: template.publishedAt?.toISOString() ?? null,
    totalImports: template.totalImports,
    activeParticipants: template.activeParticipants,
    averageCompletionRate: template.averageCompletionRate,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    creator: template.creator,
    habits: template.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      goalType: habit.goalType,
      goalCount: habit.goalCount,
      goalUnit: habit.goalUnit,
      color: habit.color,
      sortOrder: habit.sortOrder,
    })),
  };
}

function templateToPublicDto(template: TemplateRecord): PublicChallengeTemplateDto {
  const dto = templateToDto(template);

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    durationDays: dto.durationDays,
    shareToken: dto.shareToken,
    slug: dto.slug,
    publishedAt: dto.publishedAt,
    totalImports: dto.totalImports,
    activeParticipants: dto.activeParticipants,
    averageCompletionRate: dto.averageCompletionRate,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    creator: dto.creator,
    habits: dto.habits,
  };
}

function importedChallengeToDto(challenge: ImportedChallengeRecord): ImportedChallengeDto {
  const todayKey = dateToKey(new Date());
  const habits = challenge.habits.map((challengeHabit) => {
    const todayLog = challengeHabit.habit.logs.find((log) => dateToKey(log.date) === todayKey);

    return {
      id: challengeHabit.habitId,
      sortOrder: challengeHabit.sortOrder,
      habit: {
        id: challengeHabit.habit.id,
        name: challengeHabit.habit.name,
        description: challengeHabit.habit.description,
        color: challengeHabit.habit.color,
        goalType: challengeHabit.habit.goalType,
        goalCount: challengeHabit.habit.goalCount,
        goalUnit: challengeHabit.habit.goalUnit,
        todayCompleted: Boolean(todayLog?.completed),
      },
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

function normalizeDescription(description?: string | null) {
  const trimmed = description?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSlug(slug?: string | null) {
  const normalized = slug
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized && normalized.length > 0 ? normalized : null;
}

function createShareToken() {
  return randomBytes(24).toString("base64url");
}

function dateKeyToDate(dateKey: string) {
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

function dateToKey(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDaysToDate(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
