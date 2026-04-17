-- New tables: accounting periods, app config meta, tier transaction lines.
-- Clients: restore settings_* FK column names (see baseline) + client_postal_code.

-- ---------------------------------------------------------------------------
-- clients: drop FKs → rename columns → add postal code → re-add FKs
-- ---------------------------------------------------------------------------

ALTER TABLE `clients` DROP FOREIGN KEY `clients_country_id_fkey`;
ALTER TABLE `clients` DROP FOREIGN KEY `clients_region_id_fkey`;
ALTER TABLE `clients` DROP FOREIGN KEY `clients_legal_form_id_fkey`;

ALTER TABLE `clients`
    ADD COLUMN `client_postal_code` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `clients` CHANGE `country_id` `settings_country_id` VARCHAR(191) NOT NULL;
ALTER TABLE `clients` CHANGE `region_id` `settings_region_id` VARCHAR(191) NOT NULL;
ALTER TABLE `clients` CHANGE `legal_form_id` `settings_legal_form_id` VARCHAR(191) NOT NULL;

ALTER TABLE `clients` ADD CONSTRAINT `fk_clients_settings_country_id` FOREIGN KEY (`settings_country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `fk_clients_settings_region_id` FOREIGN KEY (`settings_region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `fk_clients_settings_legal_form_id` FOREIGN KEY (`settings_legal_form_id`) REFERENCES `settings_legal_forms`(`legal_form_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- accounting_years
-- ---------------------------------------------------------------------------

CREATE TABLE `accounting_years` (
    `accounting_year_id` VARCHAR(191) NOT NULL,
    `accounting_year_name` VARCHAR(255) NOT NULL,
    `accounting_year_start_date` DATE NOT NULL,
    `accounting_year_end_date` DATE NOT NULL,
    `accounting_year_is_active` BOOLEAN NOT NULL DEFAULT true,
    `accounting_year_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accounting_year_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `accounting_year_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`accounting_year_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- accounting_quarters
-- ---------------------------------------------------------------------------

CREATE TABLE `accounting_quarters` (
    `accounting_quarter_id` VARCHAR(191) NOT NULL,
    `accounting_year_id` VARCHAR(191) NOT NULL,
    `accounting_quarter_name` VARCHAR(255) NOT NULL,
    `accounting_month_start_date` DATE NOT NULL,
    `accounting_quarter_end_date` DATE NOT NULL,
    `accounting_quarter_is_active` BOOLEAN NOT NULL DEFAULT true,
    `accounting_quarter_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accounting_quarter_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `accounting_quarter_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`accounting_quarter_id`),
    INDEX `accounting_quarters_accounting_year_id_idx`(`accounting_year_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `accounting_quarters` ADD CONSTRAINT `accounting_quarters_accounting_year_id_fkey` FOREIGN KEY (`accounting_year_id`) REFERENCES `accounting_years`(`accounting_year_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- meta (clés de configuration ; meta_id INT auto-increment — varchar+AI invalide en MySQL)
-- ---------------------------------------------------------------------------

CREATE TABLE `meta` (
    `meta_id` INTEGER NOT NULL AUTO_INCREMENT,
    `meta_key` VARCHAR(255) NOT NULL,
    `meta_value` VARCHAR(255) NOT NULL,
    `meta_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `meta_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `meta_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`meta_id`),
    UNIQUE INDEX `meta_meta_key_key`(`meta_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `meta` (`meta_key`, `meta_value`, `meta_created_at`, `meta_updated_at`) VALUES
('accounting_quarter_1', '{"start_date":"01-01","end_date":"03-31"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('accounting_quarter_2', '{"start_date":"04-01","end_date":"06-30"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('accounting_quarter_3', '{"start_date":"07-01","end_date":"09-30"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('accounting_quarter_4', '{"start_date":"10-01","end_date":"12-31"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('accounting_year', '{"start_date":"01-01","end_date":"12-31"}', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- ---------------------------------------------------------------------------
-- tiers_transactions (transaction_id = référence métier sans table parente pour l’instant)
-- ---------------------------------------------------------------------------

CREATE TABLE `tiers_transactions` (
    `tiers_transaction_id` VARCHAR(191) NOT NULL,
    `tier_id` VARCHAR(191) NOT NULL,
    `transaction_id` VARCHAR(191) NOT NULL,
    `tiers_transaction_net` DOUBLE NOT NULL,
    `tiers_transaction_tax` DOUBLE NOT NULL,
    `tiers_transaction_total` DOUBLE NOT NULL,
    `tiers_transaction_date` DATE NOT NULL,
    `tiers_transaction_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tiers_transaction_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `tiers_transaction_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`tiers_transaction_id`),
    INDEX `tiers_transactions_tier_id_idx`(`tier_id`),
    INDEX `tiers_transactions_transaction_id_idx`(`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tiers_transactions` ADD CONSTRAINT `tiers_transactions_tier_id_fkey` FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`tier_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
