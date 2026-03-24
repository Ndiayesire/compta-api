/*
  Warnings:

  - You are about to drop the column `region_id` on the `countries` table. All the data in the column will be lost.
  - Added the required column `country_id` to the `regions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `countries` DROP FOREIGN KEY `countries_region_id_fkey`;

-- DropIndex
DROP INDEX `countries_region_id_idx` ON `countries`;

-- AlterTable
ALTER TABLE `countries` DROP COLUMN `region_id`;

-- AlterTable
ALTER TABLE `regions` ADD COLUMN `country_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `regions_country_id_idx` ON `regions`(`country_id`);

-- AddForeignKey
ALTER TABLE `regions` ADD CONSTRAINT `regions_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
