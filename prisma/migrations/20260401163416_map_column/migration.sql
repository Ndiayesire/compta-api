/*
  Warnings:

  - You are about to drop the column `isActive` on the `clientflag` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `currencies` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `payment_methods` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `role_permissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `clientflag` DROP COLUMN `isActive`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `clients` DROP COLUMN `isActive`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `currencies` DROP COLUMN `isActive`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `payment_methods` DROP COLUMN `isActive`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `role_permissions` DROP COLUMN `isActive`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
