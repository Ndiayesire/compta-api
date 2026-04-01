/*
  Warnings:

  - You are about to drop the column `fiscal_year_end` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `fiscal_year_start` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `companies` DROP COLUMN `fiscal_year_end`,
    DROP COLUMN `fiscal_year_start`;
