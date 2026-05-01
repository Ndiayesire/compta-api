import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employees.controller';
import { EmployeeService } from './employees.service';
import { prismaMockProvider } from '../../common/testing/prisma-mock';

describe('EmployeeController', () => {
  let controller: EmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [EmployeeService, prismaMockProvider],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
