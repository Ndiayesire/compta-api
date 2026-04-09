-- Normalize payment_methods to name / code / is_active only.
-- Safe if `type` was already removed or if payment_method_types was used previously.

-- 1) Drop FK on payment_method_type_id if it exists (older "types table" branch)
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payment_methods'
    AND CONSTRAINT_NAME = 'payment_methods_payment_method_type_id_fkey'
);
SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `payment_methods` DROP FOREIGN KEY `payment_methods_payment_method_type_id_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Drop payment_method_type_id column if present
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = 'payment_method_type_id'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `payment_methods` DROP COLUMN `payment_method_type_id`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Drop payment_method_types table if present
DROP TABLE IF EXISTS `payment_method_types`;

-- 4) Drop legacy enum column `type` if present
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods' AND COLUMN_NAME = 'type'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `payment_methods` DROP COLUMN `type`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Drop unique on code if present (allow multiple empty codes)
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_methods' AND INDEX_NAME = 'payment_methods_code_key'
);
SET @sql = IF(@idx_exists > 0,
  'DROP INDEX `payment_methods_code_key` ON `payment_methods`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `payment_methods` MODIFY `code` VARCHAR(191) NOT NULL DEFAULT '';
