-- Rename Client identifier columns (API: ninea, tva, reference)
ALTER TABLE `clients` CHANGE `siret` `ninea` VARCHAR(191) NULL;
ALTER TABLE `clients` CHANGE `vat_number` `tva` VARCHAR(191) NULL;
ALTER TABLE `clients` CHANGE `naf_code` `reference` VARCHAR(191) NULL;
