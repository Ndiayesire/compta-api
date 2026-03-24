import { User, UserStatus } from '@prisma/client';

export class UserEntity implements User {
  id: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  status: UserStatus;
  isActive: boolean;
  companyId: string | null;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}