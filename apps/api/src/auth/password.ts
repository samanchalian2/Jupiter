import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64) as Buffer;
  return 'scrypt$' + salt.toString('base64url') + '$' + key.toString('base64url');
}
export async function verifyPassword(password: string, stored: string) {
  const [, saltValue, keyValue] = stored.split('$');
  if (!saltValue || !keyValue) return false;
  const key = await scrypt(password, Buffer.from(saltValue, 'base64url'), 64) as Buffer;
  return timingSafeEqual(key, Buffer.from(keyValue, 'base64url'));
}
