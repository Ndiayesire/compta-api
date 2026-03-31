import { randomBytes } from 'crypto';

export function generatePassword(length: number): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';

  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    const index = bytes[i] % charset.length;
    password += charset[index];
  }

  return password;
}