import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { prismaMockProvider } from '../../common/testing/prisma-mock';

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientsService, prismaMockProvider],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
