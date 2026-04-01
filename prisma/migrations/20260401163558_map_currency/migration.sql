/*
  Warnings:

  - You are about to drop the column `isPrefix` on the `currencies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `currencies` DROP COLUMN `isPrefix`,
    ADD COLUMN `is_prefix` BOOLEAN NOT NULL DEFAULT false;
