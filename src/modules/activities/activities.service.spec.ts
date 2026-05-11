import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService (CRUD mocké)', () => {
  let service: ActivitiesService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      activity: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  const userId = 'u1';
  const createDto = {
    title: 'Login',
    styleClass: 'info',
    icon: 'pi-user',
    desc: 'Connexion',
    meta: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create', async () => {
    const row = { id: 'a1', userId, ...createDto };
    p().activity.create.mockResolvedValue(row);
    await expect(service.create(createDto, userId)).resolves.toEqual(row);
    expect(p().activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId, title: createDto.title }),
      }),
    );
  });

  it('findAll: scope user', async () => {
    p().activity.findMany.mockResolvedValue([]);
    await service.findAll(userId);
    expect(p().activity.findMany).toHaveBeenCalledWith({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findOne: NotFound', async () => {
    p().activity.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x', userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove: soft', async () => {
    p().activity.findFirst.mockResolvedValue({ id: 'a1' });
    p().activity.update.mockResolvedValue({ id: 'a1', deletedAt: new Date() });
    await service.remove('a1', userId);
    expect(p().activity.update).toHaveBeenCalled();
  });
});
