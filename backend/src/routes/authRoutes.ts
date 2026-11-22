import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, transaction, TransactionClient } from '../db/postgres';
import { cache } from '../db/redis';
import { authenticate, SecurityRequest, revokeToken } from '../middleware/security';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medlink_super_secret_jwt_key_2026_postgres_prod';

function generateJwt(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 1. REGISTER NEW PHARMACY OR DISTRIBUTOR (PostgreSQL Backend)
authRouter.post('/register', async (req: Request, res: Response) => {
  const {
    email,
    password,
    role,
    name,
    licenseNumber,
    gstin,
    phone,
    address,
    city,
    state,
    pincode,
    coveragePincodes,
    firebaseUid,
  } = req.body;

  if (!email || !password || !role || !name || !licenseNumber || !gstin || !pincode) {
    return res.status(400).json({
      success: false,
      message: 'Missing mandatory registration fields (email, password, role, name, license number, GSTIN, pincode).',
    });
  }

  if (role !== 'MEDICAL_STORE' && role !== 'DISTRIBUTOR') {
    return res.status(400).json({
      success: false,
      message: 'Invalid role for self-registration. Role must be MEDICAL_STORE or DISTRIBUTOR.',
    });
  }

  try {
    // Check if email already exists
    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1);`, [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${Date.now()}`;
    const entityId = role === 'MEDICAL_STORE' ? `store-${Date.now()}` : `dist-${Date.now()}`;

    await transaction(async (tx: TransactionClient) => {
      // 1. Insert User
      await tx.query(
        `INSERT INTO users (id, email, password_hash, role, status, firebase_uid)
         VALUES ($1, $2, $3, $4, 'PENDING', $5);`,
        [userId, email.toLowerCase().trim(), passwordHash, role, firebaseUid || null]
      );

      // 2. Insert Store or Distributor Profile
      if (role === 'MEDICAL_STORE') {
        await tx.query(
          `INSERT INTO medical_stores (id, user_id, store_name, license_number, gstin, phone, address, city, state, pincode, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING');`,
          [
            entityId,
            userId,
            name.trim(),
            licenseNumber.trim(),
            gstin.trim(),
            phone || '',
            address || '',
            city || 'Mumbai',
            state || 'Maharashtra',
            pincode.trim(),
          ]
        );
      } else {
        await tx.query(
          `INSERT INTO distributors (id, user_id, company_name, license_number, gstin, phone, address, city, state, pincode, coverage_pincodes, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING');`,
          [
            entityId,
            userId,
            name.trim(),
            licenseNumber.trim(),
            gstin.trim(),
            phone || '',
            address || '',
            city || 'Thane',
            state || 'Maharashtra',
            pincode.trim(),
            Array.isArray(coveragePincodes) ? coveragePincodes : [pincode.trim()],
          ]
        );
      }

      // 3. Log Audit
      await tx.query(
        `INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_name, entity_id, new_state)
         VALUES ($1, $2, $3, 'ACCOUNT_REGISTERED', $4, $5, $6);`,
        [
          `audit-${Date.now()}`,
          userId,
          role,
          role === 'MEDICAL_STORE' ? 'medical_stores' : 'distributors',
          entityId,
          JSON.stringify({ name, licenseNumber, gstin, status: 'PENDING' }),
        ]
      );
    });

    return res.status(201).json({
      success: true,
      status: 'PENDING',
      message: 'Registration submitted successfully! Your drug license credentials have been queued for Administrator verification.',
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        role,
        status: 'PENDING',
      },
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
});

// 2. LOGIN USER
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password, demoRole } = req.body;

  try {
    // Quick Demo Login Shortcut
    if (demoRole) {
      let demoUserQuery = `SELECT * FROM users WHERE role = $1 AND status = 'APPROVED' LIMIT 1;`;
      const demoRes = await query(demoUserQuery, [demoRole]);

      if (demoRes.rows.length > 0) {
        const u = demoRes.rows[0];
        let entityName = 'MedLink Demo User';
        let licenseNumber = 'DL-DEMO-001';
        let pincode = '400001';
        let entityId = u.id;

        if (u.role === 'MEDICAL_STORE') {
          const s = await query(`SELECT id, store_name, license_number, pincode FROM medical_stores WHERE user_id = $1;`, [u.id]);
          if (s.rows.length > 0) {
            entityId = s.rows[0].id;
            entityName = s.rows[0].store_name;
            licenseNumber = s.rows[0].license_number;
            pincode = s.rows[0].pincode;
          }
        } else if (u.role === 'DISTRIBUTOR') {
          const d = await query(`SELECT id, company_name, license_number, pincode FROM distributors WHERE user_id = $1;`, [u.id]);
          if (d.rows.length > 0) {
            entityId = d.rows[0].id;
            entityName = d.rows[0].company_name;
            licenseNumber = d.rows[0].license_number;
            pincode = d.rows[0].pincode;
          }
        } else if (u.role === 'ADMIN') {
          entityName = 'Platform Compliance Administrator';
        }

        const token = generateJwt({
          id: u.id,
          email: u.email,
          role: u.role,
          entityId,
          entityName,
          licenseNumber,
          pincode,
        });

        return res.json({
          success: true,
          token,
          user: {
            id: u.id,
            email: u.email,
            role: u.role,
            status: u.status,
            name: entityName,
            entityId,
            licenseNumber,
            pincode,
          },
        });
      }
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Check if logging in as a Pharmacy Staff / Terminal Operator (by username, email, or terminal code)
    const termRes = await query(
      `SELECT t.*, s.store_name, s.license_number, s.pincode, s.id as store_id
       FROM store_terminals t
       JOIN medical_stores s ON t.medical_store_id = s.id
       WHERE (LOWER(t.username) = LOWER($1) OR LOWER(t.terminal_code) = LOWER($1) OR LOWER(COALESCE(t.email, '')) = LOWER($1)) AND t.is_active = TRUE;`,
      [email.trim()]
    );

    if (termRes.rows.length > 0) {
      const term = termRes.rows[0];
      let valid = false;
      if (term.password_hash) {
        valid = await bcrypt.compare(password, term.password_hash);
      }
      if (!valid && term.plain_password === password) {
        valid = true;
      }
      if (valid) {
        await query(`UPDATE store_terminals SET last_login = NOW() WHERE id = $1;`, [term.id]);
        const termEmail = term.email || `${term.username}@terminal.medlink`;
        const token = generateJwt({
          id: term.id,
          email: termEmail,
          role: 'MEDICAL_STORE',
          isTerminal: true,
          terminalCode: term.terminal_code,
          operatorName: term.operator_name,
          entityId: term.store_id,
          entityName: term.store_name,
          licenseNumber: term.license_number,
          pincode: term.pincode,
        });

        return res.json({
          success: true,
          token,
          user: {
            id: term.id,
            email: termEmail,
            username: term.username,
            role: 'MEDICAL_STORE',
            isTerminal: true,
            terminalCode: term.terminal_code,
            terminalName: term.terminal_name,
            operatorName: term.operator_name,
            name: term.store_name,
            entityId: term.store_id,
            licenseNumber: term.license_number,
            pincode: term.pincode,
          },
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid password for terminal operator.' });
      }
    }

    const userRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1);`, [email.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        status: 'PENDING',
        message: 'Your account registration is currently pending Administrator regulatory review.',
      });
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        status: user.status,
        message: `Your account has been ${user.status.toLowerCase()}. Please contact platform support.`,
      });
    }

    let entityName = 'MedLink User';
    let licenseNumber = '';
    let pincode = '';
    let entityId = user.id;

    if (user.role === 'MEDICAL_STORE') {
      const s = await query(`SELECT id, store_name, license_number, pincode FROM medical_stores WHERE user_id = $1;`, [user.id]);
      if (s.rows.length > 0) {
        entityId = s.rows[0].id;
        entityName = s.rows[0].store_name;
        licenseNumber = s.rows[0].license_number;
        pincode = s.rows[0].pincode;
      }
    } else if (user.role === 'DISTRIBUTOR') {
      const d = await query(`SELECT id, company_name, license_number, pincode FROM distributors WHERE user_id = $1;`, [user.id]);
      if (d.rows.length > 0) {
        entityId = d.rows[0].id;
        entityName = d.rows[0].company_name;
        licenseNumber = d.rows[0].license_number;
        pincode = d.rows[0].pincode;
      }
    } else if (user.role === 'ADMIN') {
      entityName = 'Platform Compliance Administrator';
    }

    const token = generateJwt({
      id: user.id,
      email: user.email,
      role: user.role,
      entityId,
      entityName,
      licenseNumber,
      pincode,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        name: entityName,
        entityId,
        licenseNumber,
        pincode,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
});

// 3. LOGOUT USER (Revokes Token in Redis)
authRouter.post('/logout', authenticate, async (req: SecurityRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    await revokeToken(token, 86400); // Revoke for 24 hours
  }
  return res.json({ success: true, message: 'Logged out successfully. Token revoked.' });
});

// 4. GET CURRENT PROFILE
authRouter.get('/me', authenticate, async (req: SecurityRequest, res: Response) => {
  return res.json({ success: true, user: req.user });
});
