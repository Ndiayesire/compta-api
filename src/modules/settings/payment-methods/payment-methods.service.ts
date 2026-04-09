import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: {
        name: dto.name,
        code: dto.code ?? '',
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async findAll() {
    return this.prisma.paymentMethod.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException(`PaymentMethod ${id} not found`);
    return method;
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    await this.findOne(id);
    const { code, ...rest } = dto;
    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...rest,
        ...(code !== undefined ? { code: code ?? '' } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
