import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/environment';
import { UserRole } from '../models/User';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

/**
 * Generate a signed JWT for an authenticated user
 */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Safely verify and decode a JWT token.
 * Returns decoded payload if valid, or null if invalid or expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded;
  } catch (_error) {
    // Malformed, invalid signature, or expired token handled gracefully
    return null;
  }
}
