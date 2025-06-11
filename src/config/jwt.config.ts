import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'myS3cr3tK3y!@062025$%^&*()_+aBcDeFgHiJkLmNoP',
  expiresIn: process.env.JWT_EXPIRATION || '1d',
})); 