-- CreateTable
CREATE TABLE "VacancyTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "VacancyTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VacancyToVacancyTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VacancyTag_name_key" ON "VacancyTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_VacancyToVacancyTag_AB_unique" ON "_VacancyToVacancyTag"("A", "B");

-- CreateIndex
CREATE INDEX "_VacancyToVacancyTag_B_index" ON "_VacancyToVacancyTag"("B");

-- AddForeignKey
ALTER TABLE "_VacancyToVacancyTag" ADD CONSTRAINT "_VacancyToVacancyTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VacancyToVacancyTag" ADD CONSTRAINT "_VacancyToVacancyTag_B_fkey" FOREIGN KEY ("B") REFERENCES "VacancyTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
