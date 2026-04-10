-- CreateTable
CREATE TABLE `payment_method_types` (
    `payment_method_type_id` VARCHAR(191) NOT NULL,
    `payment_method_type_name` VARCHAR(191) NOT NULL,
    `payment_method_type_code` VARCHAR(191) NOT NULL,
    `payment_method_type_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`payment_method_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `payment_method_id` VARCHAR(191) NOT NULL,
    `payment_method_type_id` VARCHAR(191) NOT NULL,
    `payment_method_name` VARCHAR(191) NOT NULL,
    `payment_method_code` VARCHAR(191) NOT NULL,
    `payment_method_avatar` VARCHAR(191) NOT NULL,
    `payment_method_is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `payment_methods_payment_method_type_id_idx`(`payment_method_type_id`),
    PRIMARY KEY (`payment_method_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_currencies` (
    `currency_id` VARCHAR(191) NOT NULL,
    `currency_name` VARCHAR(191) NOT NULL,
    `currency_code` VARCHAR(191) NOT NULL,
    `currency_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`currency_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_tier_types` (
    `settings_tier_type_id` VARCHAR(191) NOT NULL,
    `settings_tier_type_name` VARCHAR(191) NOT NULL,
    `settings_tier_type_code` VARCHAR(191) NOT NULL,
    `settings_tier_type_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`settings_tier_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_contract_types` (
    `settings_contract_type_id` VARCHAR(191) NOT NULL,
    `settings_contract_type_name` VARCHAR(191) NOT NULL,
    `settings_contract_type_code` VARCHAR(191) NOT NULL,
    `settings_contract_type_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`settings_contract_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_countries` (
    `country_id` VARCHAR(191) NOT NULL,
    `currency_id` VARCHAR(191) NOT NULL,
    `country_name` VARCHAR(191) NOT NULL,
    `country_code` VARCHAR(191) NOT NULL,
    `country_tva` DOUBLE NOT NULL,
    `country_calling_code` VARCHAR(191) NOT NULL,
    `country_is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `settings_countries_currency_id_idx`(`currency_id`),
    PRIMARY KEY (`country_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_regions` (
    `region_id` VARCHAR(191) NOT NULL,
    `country_id` VARCHAR(191) NOT NULL,
    `region_name` VARCHAR(191) NOT NULL,
    `region_code` VARCHAR(191) NOT NULL,
    `region_is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `settings_regions_country_id_idx`(`country_id`),
    PRIMARY KEY (`region_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_languages` (
    `language_id` VARCHAR(191) NOT NULL,
    `country_id` VARCHAR(191) NOT NULL,
    `language_name` VARCHAR(191) NOT NULL,
    `language_code` VARCHAR(191) NOT NULL,
    `language_is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `settings_languages_country_id_idx`(`country_id`),
    PRIMARY KEY (`language_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_genders` (
    `gender_id` VARCHAR(191) NOT NULL,
    `gender_name` VARCHAR(191) NOT NULL,
    `gender_code` VARCHAR(191) NOT NULL,
    `gender_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`gender_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings_legal_forms` (
    `legal_form_id` VARCHAR(191) NOT NULL,
    `legal_form_name` VARCHAR(191) NOT NULL,
    `legal_form_code` VARCHAR(191) NOT NULL,
    `legal_form_is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`legal_form_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions_types` (
    `permission_type_id` VARCHAR(191) NOT NULL,
    `permission_type_name` VARCHAR(191) NOT NULL,
    `permission_type_code` VARCHAR(191) NOT NULL,
    `permission_type_is_active` BOOLEAN NOT NULL DEFAULT true,
    `permission_type_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `permission_type_updated_at` DATETIME(3) NOT NULL,
    `permission_type_deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`permission_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `permission_id` VARCHAR(191) NOT NULL,
    `permission_type_id` VARCHAR(191) NOT NULL,
    `permission_name` VARCHAR(191) NOT NULL,
    `permission_code` VARCHAR(191) NOT NULL,
    `permission_is_active` BOOLEAN NOT NULL DEFAULT true,
    `permission_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `permission_updated_at` DATETIME(3) NOT NULL,
    `permission_deleted_at` DATETIME(3) NULL,

    INDEX `permissions_permission_type_id_idx`(`permission_type_id`),
    PRIMARY KEY (`permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `role_id` VARCHAR(191) NOT NULL,
    `role_name` VARCHAR(191) NOT NULL,
    `role_code` VARCHAR(191) NOT NULL,
    `role_is_active` BOOLEAN NOT NULL DEFAULT true,
    `role_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `role_updated_at` DATETIME(3) NOT NULL,
    `role_deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_permission_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `permission_id` VARCHAR(191) NOT NULL,
    `role_permission_is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `role_permissions_role_id_idx`(`role_id`),
    INDEX `role_permissions_permission_id_idx`(`permission_id`),
    UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`role_permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `settings_country_id` VARCHAR(191) NOT NULL,
    `settings_region_id` VARCHAR(191) NOT NULL,
    `settings_language_id` VARCHAR(191) NOT NULL,
    `settings_gender_id` VARCHAR(191) NOT NULL,
    `user_first_name` VARCHAR(191) NOT NULL,
    `user_last_name` VARCHAR(191) NOT NULL,
    `user_email` VARCHAR(191) NOT NULL,
    `user_phone` VARCHAR(191) NOT NULL,
    `user_address` VARCHAR(191) NOT NULL,
    `user_password` VARCHAR(191) NOT NULL,
    `user_avatar` VARCHAR(191) NOT NULL,
    `user_is_active` BOOLEAN NOT NULL DEFAULT true,
    `user_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_updated_at` DATETIME(3) NOT NULL,
    `user_deleted_at` DATETIME(3) NULL,
    `user_refresh_token` TEXT NULL,
    `user_last_login_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_user_email_key`(`user_email`),
    INDEX `users_role_id_idx`(`role_id`),
    INDEX `users_user_email_idx`(`user_email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `company_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `settings_country_id` VARCHAR(191) NOT NULL,
    `settings_region_id` VARCHAR(191) NOT NULL,
    `settings_legal_form_id` VARCHAR(191) NOT NULL,
    `company_name` VARCHAR(191) NOT NULL,
    `company_email` VARCHAR(191) NOT NULL,
    `company_phone` VARCHAR(191) NOT NULL,
    `company_address` VARCHAR(191) NOT NULL,
    `company_ninea` VARCHAR(191) NOT NULL,
    `company_use_tva` BOOLEAN NOT NULL DEFAULT true,
    `company_reference` VARCHAR(191) NOT NULL,
    `company_meta` JSON NOT NULL,
    `company_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `company_updated_at` DATETIME(3) NOT NULL,
    `company_deleted_at` DATETIME(3) NULL,

    INDEX `companies_user_id_idx`(`user_id`),
    PRIMARY KEY (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `client_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `settings_country_id` VARCHAR(191) NOT NULL,
    `settings_region_id` VARCHAR(191) NOT NULL,
    `settings_legal_form_id` VARCHAR(191) NOT NULL,
    `client_name` VARCHAR(191) NOT NULL,
    `client_address` VARCHAR(191) NOT NULL,
    `client_ninea` VARCHAR(191) NOT NULL,
    `client_use_tva` BOOLEAN NOT NULL DEFAULT true,
    `client_meta` JSON NOT NULL,
    `client_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `client_updated_at` DATETIME(3) NOT NULL,
    `client_deleted_at` DATETIME(3) NULL,

    INDEX `clients_company_id_idx`(`company_id`),
    INDEX `clients_user_id_idx`(`user_id`),
    PRIMARY KEY (`client_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `employee_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `employee_first_name` VARCHAR(191) NOT NULL,
    `employee_last_name` VARCHAR(191) NOT NULL,
    `employee_email` VARCHAR(191) NOT NULL,
    `employee_phone` VARCHAR(191) NOT NULL,
    `employee_address` VARCHAR(191) NOT NULL,
    `employee_is_active` BOOLEAN NOT NULL DEFAULT true,
    `employee_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employee_updated_at` DATETIME(3) NOT NULL,
    `employee_deleted_at` DATETIME(3) NULL,

    INDEX `employees_client_id_idx`(`client_id`),
    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_contract_types` (
    `employee_contract_type_id` VARCHAR(191) NOT NULL,
    `settings_contract_type_id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `employee_contract_type_start_date` DATETIME(3) NOT NULL,
    `employee_contract_type_end_date` DATETIME(3) NOT NULL,
    `employee_contract_type_job_title` VARCHAR(191) NOT NULL,
    `employee_contract_type_is_active` BOOLEAN NOT NULL DEFAULT true,
    `employee_contract_type_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employee_contract_type_updated_at` DATETIME(3) NOT NULL,
    `employee_contract_type_deleted_at` DATETIME(3) NULL,

    INDEX `employee_contract_types_settings_contract_type_id_idx`(`settings_contract_type_id`),
    INDEX `employee_contract_types_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`employee_contract_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tiers` (
    `tier_id` VARCHAR(191) NOT NULL,
    `settings_tier_type_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `tier_name` VARCHAR(191) NOT NULL,
    `tier_ninea` VARCHAR(191) NOT NULL,
    `tier_use_tva` BOOLEAN NOT NULL DEFAULT true,
    `tier_reference` VARCHAR(191) NOT NULL,
    `tier_meta` JSON NOT NULL,
    `tier_is_active` BOOLEAN NOT NULL DEFAULT true,
    `tier_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tier_updated_at` DATETIME(3) NOT NULL,
    `tier_deleted_at` DATETIME(3) NULL,

    INDEX `tiers_settings_tier_type_id_idx`(`settings_tier_type_id`),
    INDEX `tiers_client_id_idx`(`client_id`),
    PRIMARY KEY (`tier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_categories` (
    `document_category_id` VARCHAR(191) NOT NULL,
    `document_category_name` VARCHAR(191) NOT NULL,
    `document_category_code` VARCHAR(191) NOT NULL,
    `document_category_is_active` BOOLEAN NOT NULL DEFAULT true,
    `document_category_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `document_category_updated_at` DATETIME(3) NOT NULL,
    `document_category_deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`document_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `document_id` VARCHAR(191) NOT NULL,
    `document_category_id` VARCHAR(191) NOT NULL,
    `document_name` VARCHAR(191) NOT NULL,
    `document_path` VARCHAR(191) NOT NULL,
    `document_type` VARCHAR(191) NOT NULL,
    `document_size` DOUBLE NOT NULL,
    `document_meta` JSON NOT NULL,
    `document_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `document_updated_at` DATETIME(3) NOT NULL,
    `document_deleted_at` DATETIME(3) NULL,

    INDEX `documents_document_category_id_idx`(`document_category_id`),
    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `activity_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `activity_title` VARCHAR(191) NOT NULL,
    `activity_class` VARCHAR(191) NOT NULL,
    `activity_icon` VARCHAR(191) NOT NULL,
    `activity_desc` VARCHAR(191) NOT NULL,
    `activity_meta` JSON NOT NULL,
    `activity_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `activity_updated_at` DATETIME(3) NOT NULL,
    `activity_deleted_at` DATETIME(3) NULL,

    INDEX `activities_user_id_idx`(`user_id`),
    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `notification_title` VARCHAR(191) NOT NULL,
    `notification_desc` TEXT NOT NULL,
    `notification_class` VARCHAR(191) NOT NULL,
    `notification_icon` VARCHAR(191) NOT NULL,
    `notification_is_read` BOOLEAN NOT NULL DEFAULT false,
    `notification_link` VARCHAR(191) NOT NULL,
    `notification_meta` JSON NOT NULL,
    `notification_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notification_updated_at` DATETIME(3) NOT NULL,
    `notification_deleted_at` DATETIME(3) NULL,

    INDEX `notifications_user_id_idx`(`user_id`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_payment_method_type_id_fkey` FOREIGN KEY (`payment_method_type_id`) REFERENCES `payment_method_types`(`payment_method_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings_countries` ADD CONSTRAINT `settings_countries_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `settings_currencies`(`currency_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings_regions` ADD CONSTRAINT `settings_regions_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings_languages` ADD CONSTRAINT `settings_languages_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_permission_type_id_fkey` FOREIGN KEY (`permission_type_id`) REFERENCES `permissions_types`(`permission_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`permission_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_settings_country_id_fkey` FOREIGN KEY (`settings_country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_settings_region_id_fkey` FOREIGN KEY (`settings_region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_settings_language_id_fkey` FOREIGN KEY (`settings_language_id`) REFERENCES `settings_languages`(`language_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_settings_gender_id_fkey` FOREIGN KEY (`settings_gender_id`) REFERENCES `settings_genders`(`gender_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_settings_country_id_fkey` FOREIGN KEY (`settings_country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_settings_region_id_fkey` FOREIGN KEY (`settings_region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companies` ADD CONSTRAINT `companies_settings_legal_form_id_fkey` FOREIGN KEY (`settings_legal_form_id`) REFERENCES `settings_legal_forms`(`legal_form_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_settings_country_id_fkey` FOREIGN KEY (`settings_country_id`) REFERENCES `settings_countries`(`country_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_settings_region_id_fkey` FOREIGN KEY (`settings_region_id`) REFERENCES `settings_regions`(`region_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_settings_legal_form_id_fkey` FOREIGN KEY (`settings_legal_form_id`) REFERENCES `settings_legal_forms`(`legal_form_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_contract_types` ADD CONSTRAINT `employee_contract_types_settings_contract_type_id_fkey` FOREIGN KEY (`settings_contract_type_id`) REFERENCES `settings_contract_types`(`settings_contract_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_contract_types` ADD CONSTRAINT `employee_contract_types_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiers` ADD CONSTRAINT `tiers_settings_tier_type_id_fkey` FOREIGN KEY (`settings_tier_type_id`) REFERENCES `settings_tier_types`(`settings_tier_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tiers` ADD CONSTRAINT `tiers_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_document_category_id_fkey` FOREIGN KEY (`document_category_id`) REFERENCES `document_categories`(`document_category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
