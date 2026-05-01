import { Test, TestingModule } from '@nestjs/testing';
import { ContractTypesService } from './contract-types.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('ContractTypesService', () => {
  let service: ContractTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractTypesService, prismaMockProvider],
    }).compile();

    service = module.get<ContractTypesService>(ContractTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
