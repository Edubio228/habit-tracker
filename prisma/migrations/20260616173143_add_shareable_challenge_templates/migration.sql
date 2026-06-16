-- CreateEnum
CREATE TYPE "ChallengeTemplateStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ChallengeImportStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "ChallengeTemplate" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "shareToken" TEXT NOT NULL,
    "slug" TEXT,
    "status" "ChallengeTemplateStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "totalImports" INTEGER NOT NULL DEFAULT 0,
    "activeParticipants" INTEGER NOT NULL DEFAULT 0,
    "averageCompletionRate" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeTemplateHabit" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalType" TEXT NOT NULL DEFAULT 'daily',
    "goalCount" INTEGER NOT NULL DEFAULT 1,
    "goalUnit" TEXT NOT NULL DEFAULT 'day',
    "color" TEXT NOT NULL DEFAULT '#2A9D8F',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChallengeTemplateHabit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeImport" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importedChallengeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ChallengeImportStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeTemplate_shareToken_key" ON "ChallengeTemplate"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeTemplate_slug_key" ON "ChallengeTemplate"("slug");

-- CreateIndex
CREATE INDEX "ChallengeTemplate_creatorId_status_idx" ON "ChallengeTemplate"("creatorId", "status");

-- CreateIndex
CREATE INDEX "ChallengeTemplate_shareToken_idx" ON "ChallengeTemplate"("shareToken");

-- CreateIndex
CREATE INDEX "ChallengeTemplate_slug_idx" ON "ChallengeTemplate"("slug");

-- CreateIndex
CREATE INDEX "ChallengeTemplateHabit_templateId_sortOrder_idx" ON "ChallengeTemplateHabit"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "ChallengeImport_userId_idx" ON "ChallengeImport"("userId");

-- CreateIndex
CREATE INDEX "ChallengeImport_templateId_status_idx" ON "ChallengeImport"("templateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeImport_templateId_userId_key" ON "ChallengeImport"("templateId", "userId");

-- AddForeignKey
ALTER TABLE "ChallengeTemplate" ADD CONSTRAINT "ChallengeTemplate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeTemplate" ADD CONSTRAINT "ChallengeTemplate_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeTemplateHabit" ADD CONSTRAINT "ChallengeTemplateHabit_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChallengeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeImport" ADD CONSTRAINT "ChallengeImport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChallengeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeImport" ADD CONSTRAINT "ChallengeImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeImport" ADD CONSTRAINT "ChallengeImport_importedChallengeId_fkey" FOREIGN KEY ("importedChallengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
