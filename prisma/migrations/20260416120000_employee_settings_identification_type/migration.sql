-- AlterTable
ALTER TABLE `employees` ADD COLUMN `settings_identification_type_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `employees_settings_identification_type_id_idx` ON `employees`(`settings_identification_type_id`);

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_settings_identification_type_id_fkey` FOREIGN KEY (`settings_identification_type_id`) REFERENCES `settings_identification_type`(`settings_identification_type_id`) ON DELETE SET NULL ON UPDATE CASCADE;
