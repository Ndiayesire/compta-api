-- Rename category FK to fk_documents_document_category_id (was documents_document_category_id_fkey)
ALTER TABLE `documents` DROP FOREIGN KEY `documents_document_category_id_fkey`;

ALTER TABLE `documents`
  ADD CONSTRAINT `fk_documents_document_category_id`
  FOREIGN KEY (`document_category_id`) REFERENCES `document_categories`(`document_category_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Owning company (nullable until rows are backfilled; FK enforces referential integrity when set)
ALTER TABLE `documents` ADD COLUMN `company_id` VARCHAR(191) NULL;

CREATE INDEX `documents_company_id_idx` ON `documents`(`company_id`);

ALTER TABLE `documents`
  ADD CONSTRAINT `fk_documents_company_id`
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
