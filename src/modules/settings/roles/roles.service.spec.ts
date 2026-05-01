import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, prismaMockProvider],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
