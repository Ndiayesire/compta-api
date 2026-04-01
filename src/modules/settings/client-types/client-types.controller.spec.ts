import { Test, TestingModule } from '@nestjs/testing';
import { ClientTypesController } from './client-types.controller';

describe('ClientTypesController', () => {
  let controller: ClientTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientTypesController],
    }).compile();

    controller = module.get<ClientTypesController>(ClientTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
