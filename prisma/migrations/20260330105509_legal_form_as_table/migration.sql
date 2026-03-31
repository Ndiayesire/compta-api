/*
  Warnings:

  - You are about to drop the column `legal_form` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `companies` DROP COLUMN `legal_form`,
    ADD COLUMN `legal_form_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `legal_forms` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `legal_forms_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `companies_legal_form_id_idx` ON `companies`(`legal_form_id`);

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_legal_form_id_fkey` FOREIGN KEY (`legal_form_id`) REFERENCES `legal_forms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
