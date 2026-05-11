import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { createPrismaMock } from '../../../common/testing/prisma-mock';
import { DocumentCategoriesService } from './document-categories.service';

describe('DocumentCategoriesService (CRUD mocké)', () => {
  let service: DocumentCategoriesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      documentCategory: {
        findFirst: jest.Mock;
        create: jest.Mock;
        findMany: jest.Mock;
        update: jest.Mock;
      };
      document: { count: jest.Mock };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentCategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DocumentCategoriesService>(DocumentCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create: doublon', async () => {
    p().documentCategory.findFirst.mockResolvedValue({});
    await expect(
      service.create({ name: 'Fact', code: 'FAC', isActive: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findOne: NotFound', async () => {
    p().documentCategory.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('remove: refuse si documents', async () => {
    p().documentCategory.findFirst.mockResolvedValue({ id: 'd1' });
    p().document.count.mockResolvedValue(2);
    await expect(service.remove('d1')).rejects.toThrow(BadRequestException);
  });

  it('remove: soft deletedAt', async () => {
    p().documentCategory.findFirst.mockResolvedValue({ id: 'd1' });
    p().document.count.mockResolvedValue(0);
    p().documentCategory.update.mockResolvedValue({
      id: 'd1',
      deletedAt: new Date(),
    });
    await service.remove('d1');
    expect(p().documentCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});
