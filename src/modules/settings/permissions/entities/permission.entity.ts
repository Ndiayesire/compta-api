import { Permission } from '@prisma/client';

export class PermissionEntity implements Permission {
  id: string;
  typeId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
