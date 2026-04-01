import { Test, TestingModule } from '@nestjs/testing';
import { ClientFlagService } from './client-flag.service';

describe('ClientFlagService', () => {
  let service: ClientFlagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientFlagService],
    }).compile();

    service = module.get<ClientFlagService>(ClientFlagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
