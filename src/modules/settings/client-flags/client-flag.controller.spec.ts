import { Test, TestingModule } from '@nestjs/testing';
import { ClientFlagController } from './client-flag.controller';

describe('ClientFlagController', () => {
  let controller: ClientFlagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientFlagController],
    }).compile();

    controller = module.get<ClientFlagController>(ClientFlagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
