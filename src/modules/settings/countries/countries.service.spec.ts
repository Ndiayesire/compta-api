import { Test, TestingModule } from '@nestjs/testing';
import { CountriesService } from './countries.service';
import { prismaMockProvider } from '../../../common/testing/prisma-mock';

describe('CountriesService', () => {
  let service: CountriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountriesService, prismaMockProvider],
    }).compile();

    service = module.get<CountriesService>(CountriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
