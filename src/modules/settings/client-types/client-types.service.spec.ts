import { Test, TestingModule } from '@nestjs/testing';
import { ClientTypesService } from './client-types.service';

describe('ClientTypesService', () => {
  let service: ClientTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientTypesService],
    }).compile();

    service = module.get<ClientTypesService>(ClientTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
