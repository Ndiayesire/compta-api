import { PaymentMethod, PaymentMethodType } from '@prisma/client';

export class PaymentMethodEntity implements PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: PaymentMethodType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}