import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User, { IUser, UserRole } from '../models/User';

// Augment Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const AUTH_COOKIE_NAME = 'saar_token';

/**
 * Extract token from HTTP-only cookie first, with Bearer header fallback
 */
function extractToken(req: Request): string | null {
  // 1. Check parsed cookies if cookie-parser is active
  if ((req as any).cookies?.[AUTH_COOKIE_NAME]) {
    return (req as any).cookies[AUTH_COOKIE_NAME];
  }

  // 2. Parse raw Cookie header manually
  const rawCookieHeader = req.headers.cookie;
  if (rawCookieHeader) {
    const cookies = rawCookieHeader.split(';').reduce((acc, cookieStr) => {
      const parts = cookieStr.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);

    if (cookies[AUTH_COOKIE_NAME]) {
      return cookies[AUTH_COOKIE_NAME];
    }
  }

  // 3. Fallback: Authorization Bearer header (for Thunder Client / API testing)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  return null;
}

/**
 * Authentication Middleware
 * Validates JWT from HTTP-only cookie (or Bearer fallback), fetches user from DB,
 * and attaches sanitized user to req.user (passwordHash excluded).
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.',
      });
      return;
    }

    // Retrieve user from MongoDB - passwordHash is excluded by default (select: false)
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account not found or no longer active.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces that req.user has one of the allowed roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to role(s): [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}
