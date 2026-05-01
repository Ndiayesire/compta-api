import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { OwnershipGuard } from './ownership.guard';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnershipGuard, Reflector],
    }).compile();

    guard = module.get<OwnershipGuard>(OwnershipGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});