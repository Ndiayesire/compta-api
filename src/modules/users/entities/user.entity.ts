import { User } from '@prisma/client';

export class UserEntity implements User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  avatar: string;
  isActive: boolean;
  roleId: string;
  countryId: string;
  regionId: string;
  languageId: string;
  genderId: string;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
