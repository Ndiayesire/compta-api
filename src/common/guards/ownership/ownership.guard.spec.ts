import { Test, TestingModule } from '@nestjs/testing';
import { OwnershipGuard } from './ownership.guard';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnershipGuard],
    }).compile();

    guard = module.get<OwnershipGuard>(OwnershipGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});