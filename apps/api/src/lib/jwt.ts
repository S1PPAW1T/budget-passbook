import jwt, { SignOptions } from 'jsonwebtoken';

const secret = process.env.JWT_SECRET!;
const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, secret) as { userId: string };
}
