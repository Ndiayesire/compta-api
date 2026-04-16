-- DropForeignKey (employees → settings_identification_type PK rename)
ALTER TABLE `employees` DROP FOREIGN KEY `employees_settings_identification_type_id_fkey`;

-- AlterTable: column maps aligned with Prisma @map(identification_type_*)
ALTER TABLE `settings_identification_type`
    CHANGE `settings_identification_type_id` `identification_type_id` VARCHAR(191) NOT NULL,
    CHANGE `settings_identification_type_name` `identification_type_name` VARCHAR(191) NOT NULL,
    CHANGE `settings_identification_type_code` `identification_type_code` VARCHAR(191) NOT NULL,
    CHANGE `settings_identification_type_is_active` `identification_type_is_active` BOOLEAN NOT NULL DEFAULT true,
    CHANGE `settings_identification_type_created_at` `identification_type_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CHANGE `settings_identification_type_updated_at` `identification_type_updated_at` DATETIME(3) NOT NULL,
    CHANGE `settings_identification_type_deleted_at` `identification_type_deleted_at` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_settings_identification_type_id_fkey` FOREIGN KEY (`settings_identification_type_id`) REFERENCES `settings_identification_type`(`identification_type_id`) ON DELETE SET NULL ON UPDATE CASCADE;
