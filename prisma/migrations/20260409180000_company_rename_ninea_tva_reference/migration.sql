-- Rename Company identifier columns (API: ninea, tva, reference)
ALTER TABLE `companies` CHANGE `siret` `ninea` VARCHAR(191) NULL;
ALTER TABLE `companies` CHANGE `vat_number` `tva` VARCHAR(191) NULL;
ALTER TABLE `companies` CHANGE `naf_code` `reference` VARCHAR(191) NULL;
