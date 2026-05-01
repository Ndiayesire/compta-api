import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employees.service';
import { prismaMockProvider } from '../../common/testing/prisma-mock';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeService, prismaMockProvider],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
