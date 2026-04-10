import { Gender } from '@prisma/client';

export class GenderEntity implements Gender {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}
