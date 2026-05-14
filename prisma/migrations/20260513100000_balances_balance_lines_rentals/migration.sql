-- Ref: database_mysql_update_3.sql
-- Tables: balances, balance_lines, rental_usages, rentals.
-- Note: la section "create table clients" du fichier source est ignorée (table déjà gérée par le baseline).
-- Correction SQL source: virgule en trop sur rental_usages.
-- Montants: DECIMAL(12,2) (compta) au lieu de DOUBLE ; clés VARCHAR(191) alignées sur le projet.

CREATE TABLE `balances` (
    `balance_id` VARCHAR(191) NOT NULL,
    `accounting_year_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `balance_start_date` DATE NOT NULL,
    `balance_end_date` DATE NOT NULL,
    `balance_is_active` BOOLEAN NOT NULL DEFAULT true,
    `balance_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `balance_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `balance_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`balance_id`),
    INDEX `balances_accounting_year_id_idx`(`accounting_year_id`),
    INDEX `balances_client_id_idx`(`client_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `balances` ADD CONSTRAINT `balances_accounting_year_id_fkey` FOREIGN KEY (`accounting_year_id`) REFERENCES `accounting_years`(`accounting_year_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `balances` ADD CONSTRAINT `balances_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `balance_lines` (
    `balance_line_id` VARCHAR(191) NOT NULL,
    `balance_id` VARCHAR(191) NOT NULL,
    `balance_line_number` VARCHAR(255) NOT NULL,
    `balance_line_name` VARCHAR(255) NOT NULL,
    `balance_line_previous_sold` DECIMAL(12, 2) NOT NULL,
    `balance_line_previous_is_debit` BOOLEAN NOT NULL DEFAULT false,
    `balance_line_debit` DECIMAL(12, 2) NOT NULL,
    `balance_line_credit` DECIMAL(12, 2) NOT NULL,
    `balance_line_current_sold` DECIMAL(12, 2) NOT NULL,
    `balance_line_current_is_debit` BOOLEAN NOT NULL DEFAULT false,
    `balance_line_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `balance_line_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `balance_line_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`balance_line_id`),
    INDEX `balance_lines_balance_id_idx`(`balance_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `balance_lines` ADD CONSTRAINT `balance_lines_balance_id_fkey` FOREIGN KEY (`balance_id`) REFERENCES `balances`(`balance_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `rental_usages` (
    `rental_usage_id` VARCHAR(191) NOT NULL,
    `rental_usage_name` VARCHAR(255) NOT NULL,
    `rental_usage_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`rental_usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rentals` (
    `rental_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `rental_usage_id` VARCHAR(191) NOT NULL,
    `rental_name` VARCHAR(255) NOT NULL,
    `rental_address` VARCHAR(255) NOT NULL,
    `rental_owner` VARCHAR(255) NOT NULL,
    `rental_use_tax` BOOLEAN NOT NULL DEFAULT true,
    `rental_value` DECIMAL(12, 2) NOT NULL,
    `rental_meta` JSON NOT NULL,
    `rental_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rental_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `rental_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`rental_id`),
    INDEX `rentals_client_id_idx`(`client_id`),
    INDEX `rentals_rental_usage_id_idx`(`rental_usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rentals` ADD CONSTRAINT `rentals_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_rental_usage_id_fkey` FOREIGN KEY (`rental_usage_id`) REFERENCES `rental_usages`(`rental_usage_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
