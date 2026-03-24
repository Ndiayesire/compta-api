import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });
});
