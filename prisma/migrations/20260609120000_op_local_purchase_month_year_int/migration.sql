-- op_local_purchases: month/year DATE → INTEGER (aligné SQL source)

ALTER TABLE `op_local_purchases`
  ADD COLUMN `op_local_purchase_month_int` INTEGER NULL,
  ADD COLUMN `op_local_purchase_year_int` INTEGER NULL;

UPDATE `op_local_purchases` SET
  `op_local_purchase_month_int` = MONTH(`op_local_purchase_month`),
  `op_local_purchase_year_int` = YEAR(`op_local_purchase_year`);

ALTER TABLE `op_local_purchases`
  DROP COLUMN `op_local_purchase_month`,
  DROP COLUMN `op_local_purchase_year`;

ALTER TABLE `op_local_purchases`
  CHANGE COLUMN `op_local_purchase_month_int` `op_local_purchase_month` INTEGER NOT NULL,
  CHANGE COLUMN `op_local_purchase_year_int` `op_local_purchase_year` INTEGER NOT NULL;
