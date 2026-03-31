import { Test, TestingModule } from '@nestjs/testing';
import { LegalFormsController } from './legal-forms.controller';

describe('LegalFormsController', () => {
  let controller: LegalFormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegalFormsController],
    }).compile();

    controller = module.get<LegalFormsController>(LegalFormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
