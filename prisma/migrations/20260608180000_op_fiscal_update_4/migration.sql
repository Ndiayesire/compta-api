-- Ref: database_mysql_update_4.sql (mise à jour)
-- op_local_purchases.tier_id remplace provider_id ; suppression providers ; 6 nouvelles tables.

DELETE FROM `op_local_purchases`;

ALTER TABLE `op_local_purchases` DROP FOREIGN KEY `op_local_purchases_provider_id_fkey`;
ALTER TABLE `op_local_purchases` DROP INDEX `op_local_purchases_provider_id_idx`;
ALTER TABLE `op_local_purchases` DROP COLUMN `provider_id`;

ALTER TABLE `op_local_purchases`
  ADD COLUMN `tier_id` VARCHAR(191) NOT NULL,
  ADD INDEX `op_local_purchases_tier_id_idx`(`tier_id`);

ALTER TABLE `op_local_purchases`
  ADD CONSTRAINT `op_local_purchases_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE IF EXISTS `providers`;

CREATE TABLE `op_suspensions` (
    `op_suspension_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `op_suspension_code` VARCHAR(255) NOT NULL,
    `op_suspension_date` DATE NOT NULL,
    `op_suspension_month` INTEGER NOT NULL,
    `op_suspension_year` INTEGER NOT NULL,
    `op_suspension_net` DECIMAL(12, 2) NOT NULL,
    `op_suspension_tax` DECIMAL(12, 2) NOT NULL,
    `op_suspension_total` DECIMAL(12, 2) NOT NULL,
    `op_suspension_visa_date` DATE NOT NULL,
    `op_suspension_visa_number` VARCHAR(255) NOT NULL,
    `op_suspension_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_suspension_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_suspension_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_suspension_id`),
    INDEX `op_suspensions_tier_id_idx`(`tier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_suspensions` ADD CONSTRAINT `op_suspensions_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_importations` (
    `op_importation_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `settings_country_id` VARCHAR(191) NOT NULL,
    `deduction_type_id` VARCHAR(191) NOT NULL,
    `property_nature_type_id` VARCHAR(191) NOT NULL,
    `op_importation_code` VARCHAR(255) NOT NULL,
    `op_importation_month` INTEGER NOT NULL,
    `op_importation_year` INTEGER NOT NULL,
    `op_importation_date` DATE NOT NULL,
    `op_importation_net` DECIMAL(12, 2) NULL,
    `op_importation_tax` DECIMAL(12, 2) NULL,
    `op_importation_tax_deduction` DECIMAL(12, 2) NULL,
    `op_importation_total` DECIMAL(12, 2) NULL,
    `op_importation_prorata` DECIMAL(12, 2) NULL,
    `op_importation_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_importation_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_importation_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_importation_id`),
    INDEX `op_importations_tier_id_idx`(`tier_id`),
    INDEX `op_importations_settings_country_id_idx`(`settings_country_id`),
    INDEX `op_importations_deduction_type_id_idx`(`deduction_type_id`),
    INDEX `op_importations_property_nature_type_id_idx`(`property_nature_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_importations` ADD CONSTRAINT `op_importations_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `op_importations` ADD CONSTRAINT `op_importations_settings_country_id_fkey`
  FOREIGN KEY (`settings_country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `op_importations` ADD CONSTRAINT `op_importations_deduction_type_id_fkey`
  FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types`(`deduction_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `op_importations` ADD CONSTRAINT `op_importations_property_nature_type_id_fkey`
  FOREIGN KEY (`property_nature_type_id`) REFERENCES `property_nature_types`(`property_nature_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_exportations` (
    `op_exportation_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `settings_country_id` VARCHAR(191) NOT NULL,
    `op_exportation_code` VARCHAR(255) NOT NULL,
    `op_exportation_month` INTEGER NOT NULL,
    `op_exportation_year` INTEGER NOT NULL,
    `op_exportation_date` DATE NOT NULL,
    `op_exportation_net` DECIMAL(12, 2) NULL,
    `op_exportation_tax` DECIMAL(12, 2) NULL,
    `op_exportation_tax_deduction` DECIMAL(12, 2) NULL,
    `op_exportation_total` DECIMAL(12, 2) NULL,
    `op_exportation_prorata` DECIMAL(12, 2) NULL,
    `op_exportation_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_exportation_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_exportation_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_exportation_id`),
    INDEX `op_exportations_tier_id_idx`(`tier_id`),
    INDEX `op_exportations_settings_country_id_idx`(`settings_country_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_exportations` ADD CONSTRAINT `op_exportations_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `op_exportations` ADD CONSTRAINT `op_exportations_settings_country_id_fkey`
  FOREIGN KEY (`settings_country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_retains` (
    `op_retain_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `op_retain_code` VARCHAR(255) NOT NULL,
    `op_retain_date` DATE NOT NULL,
    `op_retain_month` INTEGER NOT NULL,
    `op_retain_year` INTEGER NOT NULL,
    `op_retain_base` DECIMAL(12, 2) NOT NULL,
    `op_retain_rate` DECIMAL(12, 2) NOT NULL,
    `op_retain_amount` DECIMAL(12, 2) NOT NULL,
    `op_retain_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_retain_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_retain_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_retain_id`),
    INDEX `op_retains_tier_id_idx`(`tier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_retains` ADD CONSTRAINT `op_retains_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_royalties` (
    `op_royalty_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `op_royalty_code` VARCHAR(255) NOT NULL,
    `op_royalty_date` DATE NOT NULL,
    `op_royalty_month` INTEGER NOT NULL,
    `op_royalty_year` INTEGER NOT NULL,
    `op_royalty_base` DECIMAL(12, 2) NOT NULL,
    `op_royalty_rate` DECIMAL(12, 2) NOT NULL,
    `op_royalty_amount` DECIMAL(12, 2) NOT NULL,
    `op_royalty_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_royalty_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_royalty_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_royalty_id`),
    INDEX `op_royalties_tier_id_idx`(`tier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_royalties` ADD CONSTRAINT `op_royalties_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_exemptions` (
    `op_exemption_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `op_exemption_code` VARCHAR(255) NOT NULL,
    `op_exemption_month` INTEGER NOT NULL,
    `op_exemption_year` INTEGER NOT NULL,
    `op_exemption_amount` DECIMAL(12, 2) NOT NULL,
    `op_exemption_desc` TEXT NOT NULL,
    `op_exemption_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_exemption_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_exemption_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_exemption_id`),
    INDEX `op_exemptions_tier_id_idx`(`tier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_exemptions` ADD CONSTRAINT `op_exemptions_tier_id_fkey`
  FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
