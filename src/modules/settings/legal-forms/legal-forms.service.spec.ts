import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { LegalFormsService } from './legal-forms.service';

describe('LegalFormsService (CRUD mocké)', () => {
  let service: LegalFormsService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      legalForm: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
      };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalFormsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<LegalFormsService>(LegalFormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: nom déjà pris', async () => {
    p().legalForm.findFirst.mockResolvedValue({ id: '1' });
    await expect(
      service.create({ name: 'SARL', code: 'SARL', isActive: true }),
    ).rejects.toThrow(ConflictException);
  });

  it('findOne: NotFound', async () => {
    p().legalForm.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('remove: soft', async () => {
    p().legalForm.findUnique.mockResolvedValue({ id: 'lf1' });
    p().legalForm.update.mockResolvedValue({ id: 'lf1', isActive: false });
    await service.remove('lf1');
    expect(p().legalForm.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });
});
