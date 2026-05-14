-- Retrait colonne `balance_line_note` (remplacée par des infobulles sur les en-têtes du modèle Excel).
-- Idempotent si la colonne est déjà absente (bases sans migration 20260513120000).
SET @db := DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'balance_lines'
    AND COLUMN_NAME = 'balance_line_note'
);
SET @sql := IF(
  @exists > 0,
  'ALTER TABLE `balance_lines` DROP COLUMN `balance_line_note`',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
