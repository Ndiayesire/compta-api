-- IdentificationType model no longer maps createdAt / updatedAt / deletedAt
ALTER TABLE `settings_identification_type`
    DROP COLUMN `identification_type_created_at`,
    DROP COLUMN `identification_type_updated_at`,
    DROP COLUMN `identification_type_deleted_at`;
