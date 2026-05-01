import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { prismaMockProvider } from '../../common/testing/prisma-mock';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, prismaMockProvider],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
