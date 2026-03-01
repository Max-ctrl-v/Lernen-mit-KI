-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'MEMORIZE',
    "memorizeDuration" INTEGER NOT NULL DEFAULT 480,
    "distractionDuration" INTEGER NOT NULL DEFAULT 2400,
    "recallDuration" INTEGER NOT NULL DEFAULT 900,
    "memorizeTimeSpent" INTEGER,
    "recallTimeSpent" INTEGER,
    "score" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDay" INTEGER NOT NULL,
    "birthMonth" INTEGER NOT NULL,
    "medication" BOOLEAN NOT NULL,
    "bloodType" TEXT NOT NULL,
    "allergies" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    CONSTRAINT "Card_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "fieldTested" TEXT NOT NULL,
    "targetCardId" TEXT,
    "options" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "selectedIndex" INTEGER,
    "isCorrect" BOOLEAN,
    CONSTRAINT "Question_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_sessionId_position_key" ON "Card"("sessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Question_sessionId_position_key" ON "Question"("sessionId", "position");
