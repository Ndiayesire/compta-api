import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyService, prismaMockProvider],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
