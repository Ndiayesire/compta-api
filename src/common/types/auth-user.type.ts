import { User, Company, UserRole } from '@prisma/client';

export type AuthUser = Omit<User, 'password' | 'refreshToken'> & {
  roles: (UserRole & {
    role: {
      id: string;
      name: string;
      description: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      permissions: {
        permission: {
          id: string;
          name: string;
          module: string;
          action: string;
          description: string | null;
        };
      }[];
    };
  })[];
  company: Company | null;
};