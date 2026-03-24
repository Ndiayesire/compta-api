import { Permission } from '@prisma/client';

export class PermissionEntity implements Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}