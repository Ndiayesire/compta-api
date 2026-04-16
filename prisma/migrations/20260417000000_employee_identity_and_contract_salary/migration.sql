-- Align employees with Prisma: insurance / identity column names; remove payroll fields from employee
ALTER TABLE `employees`
    CHANGE `employee_social_insurance_number` `employee_insurance_number` VARCHAR(191) NULL;

ALTER TABLE `employees`
    CHANGE `employee_identification_number` `employee_identity_number` VARCHAR(191) NULL;

ALTER TABLE `employees`
    DROP COLUMN `employee_gross_salary`,
    DROP COLUMN `employee_presence_hours`,
    DROP COLUMN `employee_is_cadre`;

-- Salary & manager flag on contract (not on employee row)
ALTER TABLE `employee_contract_types`
    ADD COLUMN `employee_contract_type_salary` DOUBLE NULL,
    ADD COLUMN `employee_contract_type_is_manager` BOOLEAN NOT NULL DEFAULT false;
