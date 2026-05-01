-- Normalize FK column names to match Prisma @map (data-preserving renames; not DROP+ADD).

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_settings_country_id_fkey`;
ALTER TABLE `users` DROP FOREIGN KEY `users_settings_region_id_fkey`;
ALTER TABLE `users` DROP FOREIGN KEY `users_settings_language_id_fkey`;
ALTER TABLE `users` DROP FOREIGN KEY `users_settings_gender_id_fkey`;

ALTER TABLE `companies` DROP FOREIGN KEY `companies_settings_country_id_fkey`;
ALTER TABLE `companies` DROP FOREIGN KEY `companies_settings_region_id_fkey`;
ALTER TABLE `companies` DROP FOREIGN KEY `companies_settings_legal_form_id_fkey`;

ALTER TABLE `clients` DROP FOREIGN KEY `clients_settings_country_id_fkey`;
ALTER TABLE `clients` DROP FOREIGN KEY `clients_settings_region_id_fkey`;
ALTER TABLE `clients` DROP FOREIGN KEY `clients_settings_legal_form_id_fkey`;

ALTER TABLE `documents` DROP FOREIGN KEY `fk_documents_document_category_id`;
ALTER TABLE `documents` DROP FOREIGN KEY `fk_documents_company_id`;

ALTER TABLE `employees` DROP FOREIGN KEY `employees_settings_identification_type_id_fkey`;

ALTER TABLE `permissions` DROP FOREIGN KEY `permissions_permission_type_id_fkey`;

ALTER TABLE `tiers` DROP FOREIGN KEY `tiers_settings_tier_type_id_fkey`;

-- AlterTable (CHANGE preserves row data)
ALTER TABLE `users` CHANGE `settings_country_id` `country_id` VARCHAR(191) NOT NULL;
ALTER TABLE `users` CHANGE `settings_region_id` `region_id` VARCHAR(191) NOT NULL;
ALTER TABLE `users` CHANGE `settings_language_id` `language_id` VARCHAR(191) NOT NULL;
ALTER TABLE `users` CHANGE `settings_gender_id` `gender_id` VARCHAR(191) NOT NULL;

ALTER TABLE `companies` CHANGE `settings_country_id` `country_id` VARCHAR(191) NOT NULL;
ALTER TABLE `companies` CHANGE `settings_region_id` `region_id` VARCHAR(191) NOT NULL;
ALTER TABLE `companies` CHANGE `settings_legal_form_id` `legal_form_id` VARCHAR(191) NOT NULL;

ALTER TABLE `clients` CHANGE `settings_country_id` `country_id` VARCHAR(191) NOT NULL;
ALTER TABLE `clients` CHANGE `settings_region_id` `region_id` VARCHAR(191) NOT NULL;
ALTER TABLE `clients` CHANGE `settings_legal_form_id` `legal_form_id` VARCHAR(191) NOT NULL;

ALTER TABLE `documents` CHANGE `document_category_id` `category_id` VARCHAR(191) NOT NULL;

ALTER TABLE `employees` CHANGE `settings_identification_type_id` `identification_type_id` VARCHAR(191) NULL;

ALTER TABLE `permissions` CHANGE `permission_type_id` `type_id` VARCHAR(191) NOT NULL;

ALTER TABLE `tiers` CHANGE `settings_tier_type_id` `tier_type_id` VARCHAR(191) NOT NULL;

-- Rename indexes to Prisma default names (DROP+ADD for MariaDB / MySQL < 8)
ALTER TABLE `documents` DROP INDEX `documents_document_category_id_idx`, ADD INDEX `documents_category_id_idx` (`category_id`);
ALTER TABLE `permissions` DROP INDEX `permissions_permission_type_id_idx`, ADD INDEX `permissions_type_id_idx` (`type_id`);
ALTER TABLE `tiers` DROP INDEX `tiers_settings_tier_type_id_idx`, ADD INDEX `tiers_tier_type_id_idx` (`tier_type_id`);
ALTER TABLE `employees` DROP INDEX `employees_settings_identification_type_id_idx`, ADD INDEX `employees_identification_type_id_idx` (`identification_type_id`);
ALTER TABLE `employee_contract_types` DROP INDEX `employee_contract_types_settings_contract_type_id_idx`, ADD INDEX `employee_contract_types_contract_type_id_idx` (`contract_type_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `settings_languages`(`language_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_gender_id_fkey` FOREIGN KEY (`gender_id`) REFERENCES `settings_genders`(`gender_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `companies` ADD CONSTRAINT `companies_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `companies` ADD CONSTRAINT `companies_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `companies` ADD CONSTRAINT `companies_legal_form_id_fkey` FOREIGN KEY (`legal_form_id`) REFERENCES `settings_legal_forms`(`legal_form_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clients` ADD CONSTRAINT `clients_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `clients_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `clients_legal_form_id_fkey` FOREIGN KEY (`legal_form_id`) REFERENCES `settings_legal_forms`(`legal_form_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `documents` ADD CONSTRAINT `documents_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `document_categories`(`document_category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `documents` ADD CONSTRAINT `documents_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `employees` ADD CONSTRAINT `employees_identification_type_id_fkey` FOREIGN KEY (`identification_type_id`) REFERENCES `settings_identification_type`(`identification_type_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `permissions` ADD CONSTRAINT `permissions_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `permissions_types`(`permission_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tiers` ADD CONSTRAINT `tiers_tier_type_id_fkey` FOREIGN KEY (`tier_type_id`) REFERENCES `settings_tier_types`(`settings_tier_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
