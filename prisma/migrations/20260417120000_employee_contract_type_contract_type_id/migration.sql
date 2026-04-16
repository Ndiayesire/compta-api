-- Rename FK column to match Prisma @map("contract_type_id")
ALTER TABLE `employee_contract_types` DROP FOREIGN KEY `employee_contract_types_settings_contract_type_id_fkey`;

ALTER TABLE `employee_contract_types` CHANGE `settings_contract_type_id` `contract_type_id` VARCHAR(191) NOT NULL;

ALTER TABLE `employee_contract_types` ADD CONSTRAINT `employee_contract_types_contract_type_id_fkey` FOREIGN KEY (`contract_type_id`) REFERENCES `settings_contract_types`(`settings_contract_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
