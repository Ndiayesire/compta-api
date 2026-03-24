-- AlterTable
ALTER TABLE `countries` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `regions` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
