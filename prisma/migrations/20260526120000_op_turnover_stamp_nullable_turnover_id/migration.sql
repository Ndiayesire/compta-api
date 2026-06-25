-- Rendre op_turnover_id nullable (timbres importés sans CA lié)
ALTER TABLE `op_turnover_stamps` MODIFY `op_turnover_id` VARCHAR(191) NULL;
