-- AlterTable
ALTER TABLE `employees`
    ADD COLUMN `employee_social_insurance_number` VARCHAR(191) NULL,
    ADD COLUMN `employee_identification_number` VARCHAR(191) NULL,
    ADD COLUMN `employee_gross_salary` DOUBLE NULL,
    ADD COLUMN `employee_presence_hours` DOUBLE NULL,
    ADD COLUMN `employee_is_cadre` BOOLEAN NOT NULL DEFAULT false;
