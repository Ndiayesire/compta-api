import { Test, TestingModule } from '@nestjs/testing';
import { LegalFormsController } from './legal-forms.controller';
import { LegalFormsService } from './legal-forms.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('LegalFormsController', () => {
  let controller: LegalFormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegalFormsController],
      providers: [LegalFormsService, prismaMockProvider],
    }).compile();

    controller = module.get<LegalFormsController>(LegalFormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
