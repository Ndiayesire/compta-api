import { Test, TestingModule } from '@nestjs/testing';
import { ContractTypesController } from './contract-types.controller';
import { ContractTypesService } from './contract-types.service';

describe('ContractTypesController', () => {
  let controller: ContractTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractTypesController],
      providers: [ContractTypesService],
    }).compile();

    controller = module.get<ContractTypesController>(ContractTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
