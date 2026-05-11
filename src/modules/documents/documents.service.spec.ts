import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { DocumentsService } from './documents.service';

describe('DocumentsService (CRUD mocké)', () => {
  let service: DocumentsService;
  let prisma: PrismaService;

  const companyId = 'a0000001-0000-4000-8000-000000000001';
  const categoryId = 'a0000002-0000-4000-8000-000000000002';
  const docId = 'a0000003-0000-4000-8000-000000000003';

  const createDto = {
    categoryId,
    name: 'facture.pdf',
    path: '/uploads/company/facture.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    meta: { version: 1 } as Record<string, unknown>,
  };

  const docWithIncludes = {
    id: docId,
    categoryId,
    companyId,
    name: createDto.name,
    path: createDto.path,
    mimeType: createDto.mimeType,
    size: createDto.size,
    meta: createDto.meta,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    category: { id: categoryId, name: 'Factures', code: 'INV' },
    company: { id: companyId, name: 'Société test' },
  };

  const cat = () =>
    prisma as unknown as { documentCategory: { findFirst: jest.Mock } };
  const doc = () =>
    prisma as unknown as {
      document: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejette si la catégorie est invalide ou inactive', async () => {
      cat().documentCategory.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, companyId)).rejects.toThrow(
        BadRequestException,
      );
      expect(doc().document.create).not.toHaveBeenCalled();
    });

    it('crée le document quand la catégorie est utilisable', async () => {
      cat().documentCategory.findFirst.mockResolvedValue({ id: categoryId });
      doc().document.create.mockResolvedValue(docWithIncludes);

      const result = await service.create(createDto, companyId);

      expect(result).toEqual(docWithIncludes);
      expect(doc().document.create).toHaveBeenCalledWith({
        data: {
          categoryId,
          companyId,
          name: createDto.name,
          path: createDto.path,
          mimeType: createDto.mimeType,
          size: createDto.size,
          meta: createDto.meta,
        },
        include: { category: true, company: true },
      });
    });

    it('meta par défaut {} si absent du DTO', async () => {
      const dtoNoMeta = {
        categoryId,
        name: 'x.pdf',
        path: '/p',
        mimeType: 'application/pdf',
        size: 1,
      };
      cat().documentCategory.findFirst.mockResolvedValue({ id: categoryId });
      doc().document.create.mockResolvedValue({
        ...docWithIncludes,
        meta: {},
      });

      await service.create(dtoNoMeta, companyId);

      expect(doc().document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ meta: {} }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('liste les documents de la société, non supprimés', async () => {
      const list = [docWithIncludes];
      doc().document.findMany.mockResolvedValue(list);

      const result = await service.findAll(companyId);

      expect(result).toEqual(list);
      expect(doc().document.findMany).toHaveBeenCalledWith({
        where: { companyId, deletedAt: null },
        include: { category: true, company: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('retourne le document', async () => {
      doc().document.findFirst.mockResolvedValue(docWithIncludes);

      const result = await service.findOne(docId, companyId);

      expect(result).toEqual(docWithIncludes);
      expect(doc().document.findFirst).toHaveBeenCalledWith({
        where: { id: docId, companyId, deletedAt: null },
        include: { category: true, company: true },
      });
    });

    it('NotFoundException si absent', async () => {
      doc().document.findFirst.mockResolvedValue(null);

      await expect(service.findOne(docId, companyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met à jour sans changer de catégorie', async () => {
      doc().document.findFirst.mockResolvedValue(docWithIncludes);
      const updated = { ...docWithIncludes, name: 'maj.pdf' };
      doc().document.update.mockResolvedValue(updated);

      const result = await service.update(docId, { name: 'maj.pdf' }, companyId);

      expect(result).toEqual(updated);
      expect(doc().document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data: { name: 'maj.pdf' },
        include: { category: true, company: true },
      });
    });

    it('vérifie la nouvelle catégorie si categoryId est fourni', async () => {
      const newCat = 'a0000099-0000-4000-8000-000000000099';
      doc().document.findFirst.mockResolvedValue(docWithIncludes);
      cat().documentCategory.findFirst.mockResolvedValue({ id: newCat });
      doc().document.update.mockResolvedValue({
        ...docWithIncludes,
        categoryId: newCat,
      });

      await service.update(docId, { categoryId: newCat }, companyId);

      expect(cat().documentCategory.findFirst).toHaveBeenCalledWith({
        where: { id: newCat, deletedAt: null },
      });
      expect(doc().document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data: {
          category: { connect: { id: newCat } },
        },
        include: { category: true, company: true },
      });
    });

    it('rejette une nouvelle catégorie invalide', async () => {
      doc().document.findFirst.mockResolvedValue(docWithIncludes);
      cat().documentCategory.findFirst.mockResolvedValue(null);

      await expect(
        service.update(
          docId,
          { categoryId: 'bad-cat' },
          companyId,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(doc().document.update).not.toHaveBeenCalled();
    });

    it('échoue si findOne échoue', async () => {
      doc().document.findFirst.mockResolvedValue(null);

      await expect(
        service.update(docId, { name: 'x' }, companyId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('pose deletedAt', async () => {
      doc().document.findFirst.mockResolvedValue(docWithIncludes);
      const soft = { ...docWithIncludes, deletedAt: new Date() };
      doc().document.update.mockResolvedValue(soft);

      const result = await service.remove(docId, companyId);

      expect(result).toEqual(soft);
      expect(doc().document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('NotFound si document introuvable', async () => {
      doc().document.findFirst.mockResolvedValue(null);

      await expect(service.remove(docId, companyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
