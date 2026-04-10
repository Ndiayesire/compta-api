import { PaymentMethod } from '@prisma/client';

export class PaymentMethodEntity implements PaymentMethod {
  id: string;
  typeId: string;
  name: string;
  code: string;
  avatar: string;
  isActive: boolean;
}
