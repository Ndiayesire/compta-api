-- CreateTable
CREATE TABLE `settings_identification_type` (
    `settings_identification_type_id` VARCHAR(191) NOT NULL,
    `settings_identification_type_name` VARCHAR(191) NOT NULL,
    `settings_identification_type_code` VARCHAR(191) NOT NULL,
    `settings_identification_type_is_active` BOOLEAN NOT NULL DEFAULT true,
    `settings_identification_type_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `settings_identification_type_updated_at` DATETIME(3) NOT NULL,
    `settings_identification_type_deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`settings_identification_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
