-- Colonne libre « note » sur les lignes de balance (import Excel, saisie API).
ALTER TABLE `balance_lines`
ADD COLUMN `balance_line_note` VARCHAR(2000) NULL AFTER `balance_line_current_is_debit`;
