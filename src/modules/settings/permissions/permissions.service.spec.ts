import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, prismaMockProvider],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
