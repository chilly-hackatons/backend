/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VacancyTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PostToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_VacancyToVacancyTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostToTag" DROP CONSTRAINT "_PostToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostToTag" DROP CONSTRAINT "_PostToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_VacancyToVacancyTag" DROP CONSTRAINT "_VacancyToVacancyTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_VacancyToVacancyTag" DROP CONSTRAINT "_VacancyToVacancyTag_B_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN     "tags" TEXT[];

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "VacancyTag";

-- DropTable
DROP TABLE "_PostToTag";

-- DropTable
DROP TABLE "_VacancyToVacancyTag";
