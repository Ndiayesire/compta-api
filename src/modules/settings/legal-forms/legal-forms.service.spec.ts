import { Test, TestingModule } from '@nestjs/testing';
import { LegalFormsService } from './legal-forms.service';

describe('LegalFormsService', () => {
  let service: LegalFormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegalFormsService],
    }).compile();

    service = module.get<LegalFormsService>(LegalFormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
