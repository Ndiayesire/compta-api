/*
  Warnings:

  - You are about to drop the column `contract_type` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contract_type_id` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employees` DROP COLUMN `contract_type`,
    ADD COLUMN `contract_type_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `contract_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contract_types_name_key`(`name`),
    UNIQUE INDEX `contract_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `clients_phone_key` ON `clients`(`phone`);

-- CreateIndex
CREATE UNIQUE INDEX `companies_email_key` ON `companies`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `companies_phone_key` ON `companies`(`phone`);

-- CreateIndex
CREATE UNIQUE INDEX `employees_phone_key` ON `employees`(`phone`);

-- CreateIndex
CREATE INDEX `employees_contract_type_id_idx` ON `employees`(`contract_type_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_contract_type_id_fkey` FOREIGN KEY (`contract_type_id`) REFERENCES `contract_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
