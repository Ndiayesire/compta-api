import { PaymentMethod } from '@prisma/client';

export class PaymentMethodEntity implements PaymentMethod {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
