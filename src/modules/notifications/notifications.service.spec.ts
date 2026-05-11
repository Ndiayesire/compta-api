import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../common/testing/prisma-mock';
import { NotificationsService } from './notifications.service';

describe('NotificationsService (CRUD mocké)', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const p = () =>
    prisma as unknown as {
      notification: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
      };
    };

  const userId = 'u1';

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findUnread', async () => {
    p().notification.findMany.mockResolvedValue([]);
    await service.findUnread(userId);
    expect(p().notification.findMany).toHaveBeenCalledWith({
      where: { userId, deletedAt: null, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findOne: NotFound', async () => {
    p().notification.findFirst.mockResolvedValue(null);
    await expect(service.findOne('n1', userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create', async () => {
    const dto = {
      title: 'Alert',
      desc: 'Msg',
      styleClass: 'warn',
      icon: 'i',
      link: '/x',
      isRead: false,
    };
    p().notification.create.mockResolvedValue({ id: 'n1', ...dto });
    await service.create(dto, userId);
    expect(p().notification.create).toHaveBeenCalled();
  });
});
