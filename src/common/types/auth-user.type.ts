import { User, Company, Role, Permission } from '@prisma/client';

export type AuthUser = Omit<User, 'password' | 'refreshToken'> & {
  role:
    | (Role & {
        permissions: { permission: Permission; isActive: boolean; id: string; roleId: string; permissionId: string }[];
      })
    | null;
  company: Company | null;
  /** Convenience: `company?.id` for guards and controllers */
  companyId?: string | null;
};
