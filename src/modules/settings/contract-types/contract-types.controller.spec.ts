import { Test, TestingModule } from '@nestjs/testing';
import { ContractTypesController } from './contract-types.controller';
import { ContractTypesService } from './contract-types.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('ContractTypesController', () => {
  let controller: ContractTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractTypesController],
      providers: [ContractTypesService, prismaMockProvider],
    }).compile();

    controller = module.get<ContractTypesController>(ContractTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
