-- Ref: database_mysql_update_4.sql
-- DECIMAL(12,2), VARCHAR(191) PKs, TIMESTAMP(3), commentaires SQL source retirés.

CREATE TABLE `deduction_types` (
    `deduction_type_id` VARCHAR(191) NOT NULL,
    `deduction_type_code` VARCHAR(255) NOT NULL,
    `deduction_type_name` VARCHAR(255) NOT NULL,
    `deduction_type_is_active` BOOLEAN NOT NULL DEFAULT true,
    `deduction_type_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deduction_type_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deduction_type_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`deduction_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `property_nature_types` (
    `property_nature_type_id` VARCHAR(191) NOT NULL,
    `property_nature_type_code` VARCHAR(255) NOT NULL,
    `property_nature_type_name` VARCHAR(255) NOT NULL,
    `property_nature_type_is_active` BOOLEAN NOT NULL DEFAULT true,
    `property_nature_type_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `property_nature_type_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `property_nature_type_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`property_nature_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `providers` (
    `provider_id` VARCHAR(191) NOT NULL,
    `provider_ninea` VARCHAR(255) NOT NULL,
    `provider_cofi` VARCHAR(255) NOT NULL,
    `provider_name` VARCHAR(255) NOT NULL,
    `provider_address` VARCHAR(255) NOT NULL,
    `provider_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `provider_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `provider_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`provider_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `op_turnovers` (
    `op_turnover_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `op_turnover_number` VARCHAR(255) NOT NULL,
    `op_turnover_date` DATE NOT NULL,
    `op_turnover_net` DECIMAL(12, 2) NOT NULL,
    `op_turnover_tax` DECIMAL(12, 2) NOT NULL,
    `op_turnover_total` DECIMAL(12, 2) NOT NULL,
    `op_turnover_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_turnover_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_turnover_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_turnover_id`),
    INDEX `op_turnovers_client_id_idx`(`client_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_turnovers` ADD CONSTRAINT `op_turnovers_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_turnover_stamps` (
    `op_turnover_stamp_id` VARCHAR(191) NOT NULL,
    `op_turnover_id` VARCHAR(191) NOT NULL,
    `op_turnover_stamp_date` DATE NOT NULL,
    `op_turnover_stamp_net` DECIMAL(12, 2) NOT NULL,
    `op_turnover_stamp_tax` DECIMAL(12, 2) NOT NULL,
    `op_turnover_stamp_total` DECIMAL(12, 2) NOT NULL,
    `op_turnover_stamp_amount` JSON NOT NULL,
    `op_turnover_stamp_amount_deduction` JSON NOT NULL,
    `op_turnover_stamp_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_turnover_stamp_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_turnover_stamp_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_turnover_stamp_id`),
    INDEX `op_turnover_stamps_op_turnover_id_idx`(`op_turnover_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_turnover_stamps` ADD CONSTRAINT `op_turnover_stamps_op_turnover_id_fkey` FOREIGN KEY (`op_turnover_id`) REFERENCES `op_turnovers`(`op_turnover_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `op_local_purchases` (
    `op_local_purchase_id` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NOT NULL,
    `deduction_type_id` VARCHAR(191) NOT NULL,
    `property_nature_type_id` VARCHAR(191) NOT NULL,
    `op_local_purchase_month` DATE NOT NULL,
    `op_local_purchase_year` DATE NOT NULL,
    `op_local_purchase_net` DECIMAL(12, 2) NOT NULL,
    `op_local_purchase_tax` DECIMAL(12, 2) NOT NULL,
    `op_local_purchase_tax_deduction` DECIMAL(12, 2) NOT NULL,
    `op_local_purchase_total` DECIMAL(12, 2) NOT NULL,
    `op_local_purchase_prorata` JSON NOT NULL,
    `op_local_purchase_created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `op_local_purchase_updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `op_local_purchase_deleted_at` TIMESTAMP(3) NULL,

    PRIMARY KEY (`op_local_purchase_id`),
    INDEX `op_local_purchases_provider_id_idx`(`provider_id`),
    INDEX `op_local_purchases_deduction_type_id_idx`(`deduction_type_id`),
    INDEX `op_local_purchases_property_nature_type_id_idx`(`property_nature_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `op_local_purchases` ADD CONSTRAINT `op_local_purchases_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`provider_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `op_local_purchases` ADD CONSTRAINT `op_local_purchases_deduction_type_id_fkey` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types`(`deduction_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `op_local_purchases` ADD CONSTRAINT `op_local_purchases_property_nature_type_id_fkey` FOREIGN KEY (`property_nature_type_id`) REFERENCES `property_nature_types`(`property_nature_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
