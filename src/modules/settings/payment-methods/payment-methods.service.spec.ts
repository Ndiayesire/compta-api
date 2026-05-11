import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { PaymentMethodsService } from './payment-methods.service';

describe('PaymentMethodsService (CRUD mocké)', () => {
  let service: PaymentMethodsService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      paymentMethod: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
      paymentMethodType: { findMany: jest.Mock };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<PaymentMethodsService>(PaymentMethodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAllTypes', async () => {
    p().paymentMethodType.findMany.mockResolvedValue([]);
    await service.findAllTypes();
    expect(p().paymentMethodType.findMany).toHaveBeenCalled();
  });

  it('findOne: NotFound', async () => {
    p().paymentMethod.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('create', async () => {
    p().paymentMethod.create.mockResolvedValue({ id: 'pm1' });
    await service.create({
      typeId: 't1',
      name: 'Orange Money',
      avatar: '',
      isActive: true,
    });
    expect(p().paymentMethod.create).toHaveBeenCalled();
  });

  it('remove: soft', async () => {
    p().paymentMethod.findUnique.mockResolvedValue({ id: 'pm1' });
    p().paymentMethod.update.mockResolvedValue({ id: 'pm1', isActive: false });
    await service.remove('pm1');
    expect(p().paymentMethod.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });
});
