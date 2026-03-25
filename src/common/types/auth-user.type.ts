import { User, Company, Role } from '@prisma/client';

export type AuthUser = Omit<User, 'password' | 'refreshToken'> & {
  role: (Role & {
    permissions: {
      permission: {
        id: string;
        name: string;
        module: string;
        action: string;
        description: string | null;
      };
    }[];
  }) | null;
  company: Company | null;
};