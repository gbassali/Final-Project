-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminStaff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthMetric" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,

    CONSTRAINT "HealthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerAvailability" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitnessClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "FitnessClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRegistration" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "fitnessClassId" INTEGER NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_email_key" ON "Trainer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminStaff_email_key" ON "AdminStaff"("email");

-- CreateIndex
CREATE INDEX "HealthMetric_memberId_recordedAt_idx" ON "HealthMetric"("memberId", "recordedAt");

-- CreateIndex
CREATE INDEX "TrainerAvailability_trainerId_startTime_endTime_idx" ON "TrainerAvailability"("trainerId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Session_trainerId_startTime_endTime_idx" ON "Session"("trainerId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Session_roomId_startTime_endTime_idx" ON "Session"("roomId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "FitnessClass_trainerId_startTime_endTime_idx" ON "FitnessClass"("trainerId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "FitnessClass_roomId_startTime_endTime_idx" ON "FitnessClass"("roomId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "ClassRegistration_fitnessClassId_idx" ON "ClassRegistration"("fitnessClassId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegistration_memberId_fitnessClassId_key" ON "ClassRegistration"("memberId", "fitnessClassId");

-- AddForeignKey
ALTER TABLE "HealthMetric" ADD CONSTRAINT "HealthMetric_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAvailability" ADD CONSTRAINT "TrainerAvailability_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessClass" ADD CONSTRAINT "FitnessClass_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessClass" ADD CONSTRAINT "FitnessClass_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistration" ADD CONSTRAINT "ClassRegistration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRegistration" ADD CONSTRAINT "ClassRegistration_fitnessClassId_fkey" FOREIGN KEY ("fitnessClassId") REFERENCES "FitnessClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
