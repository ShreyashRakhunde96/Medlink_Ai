import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { cache } from '../db/redis';
import { query } from '../db/postgres';

const JWT_SECRET = process.env.JWT_SECRET || 'medlink_super_secret_jwt_key_2026_postgres_prod';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'MEDICAL_STORE' | 'DISTRIBUTOR' | 'ADMIN';
  entityId?: string; // medical_store_id or distributor_id
  entityName?: string;
  licenseNumber?: string;
  pincode?: string;
}

export interface SecurityRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Validates JWT token, verifies expiration, and checks against Redis token revocation list.
 */
export async function authenticate(req: SecurityRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];

  // Check Token Revocation / Blacklist in Redis
  const isRevoked = await cache.get(`revoked_token:${token}`);
  if (isRevoked) {
    return res.status(401).json({ success: false, message: 'Session has been revoked or logged out.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

/**
 * Strict Role-Based Access Control (RBAC) Guard
 */
export function requireRole(...allowedRoles: Array<'MEDICAL_STORE' | 'DISTRIBUTOR' | 'ADMIN'>) {
  return (req: SecurityRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please sign in.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Business Ownership Guard:
 * Ensures a distributor can only access their own inventory/orders,
 * and a medical store can only access their own orders.
 * Platform Admin has global read/write access.
 */
export async function enforceOwnership(req: SecurityRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  if (req.user.role === 'ADMIN') return next();

  const requestedDistributorId = req.params.distributorId || req.body.distributorId || req.query.distributorId;
  const requestedStoreId = req.params.storeId || req.body.storeId || req.query.storeId;

  if (req.user.role === 'DISTRIBUTOR' && requestedDistributorId && req.user.entityId) {
    if (requestedDistributorId !== req.user.entityId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another distributor’s data.' });
    }
  }

  if (req.user.role === 'MEDICAL_STORE' && requestedStoreId && req.user.entityId) {
    if (requestedStoreId !== req.user.entityId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot access another store’s data.' });
    }
  }

  next();
}

/**
 * Revokes a JWT token (e.g. upon user logout)
 */
export async function revokeToken(token: string, expirySeconds: number = 86400): Promise<void> {
  await cache.set(`revoked_token:${token}`, 'REVOKED', expirySeconds);
}

