import mongoose from 'mongoose';
import { admin, firebaseInitialized } from '../config/firebase.js';
import { User } from '../models/User.js';

function checkIsAdminEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (lower.includes('admin')) return true;
  const adminEnv = process.env.ADMIN_EMAIL || '';
  const adminList = adminEnv.split(',').map((e) => e.toLowerCase().trim()).filter(Boolean);
  return adminList.includes(lower);
}

/**
 * Middleware to verify token and authenticate the user
 * Supports: Firebase ID Tokens, Google OAuth JWTs, issued gauth_ tokens, and dev tokens
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format',
      });
    }

    const token = authHeader.split('Bearer ')[1].trim();

    // 1. Direct gauth_<id> token issued after Google login
    if (token.startsWith('gauth_')) {
      const identifier = token.replace('gauth_', '');
      let user = null;
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        user = await User.findById(identifier);
      }
      if (!user) {
        user = await User.findOne({ firebaseUid: identifier });
      }
      if (user) {
        user.lastLoginAt = new Date();
        await user.save();
        req.user = user;
        req.auth = {
          uid: user.firebaseUid,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return next();
      }
    }

    // 2. Dev token (convenience for testing)
    if (token.startsWith('dev_token_')) {
      const decodedToken = parseDevToken(token);
      let user = await User.findOne({ firebaseUid: decodedToken.uid });
      if (!user) {
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          phone: decodedToken.phone,
          name: decodedToken.name,
          role: decodedToken.role || 'customer',
        });
      }
      req.user = user;
      req.auth = decodedToken;
      return next();
    }

    let decodedToken = null;

    // 3. Firebase Admin token verification if configured
    if (firebaseInitialized) {
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (err) {
        // Continue to fallback
      }
    }

    // 4. Google OAuth ID Token (JWT standard starting with eyJ)
    if (!decodedToken && token.startsWith('eyJ')) {
      try {
        const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (gRes.ok) {
          const gData = await gRes.json();
          decodedToken = {
            uid: gData.sub,
            email: gData.email,
            name: gData.name,
            picture: gData.picture,
          };
        }
      } catch (e) {
        // Continue
      }
    }

    // 5. Dev token fallback when Firebase is not initialized
    if (!decodedToken && !firebaseInitialized) {
      decodedToken = parseDevToken(token);
    }

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({
        success: false,
        message: 'Could not resolve user from token',
      });
    }

    // Look up or sync user in MongoDB
    let user = await User.findOne({
      $or: [
        { firebaseUid: decodedToken.uid },
        ...(decodedToken.email ? [{ email: decodedToken.email.toLowerCase() }] : []),
      ],
    });

    if (!user) {
    const isAdminByEmail = checkIsAdminEmail(decodedToken.email);

    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email ? decodedToken.email.toLowerCase() : undefined,
        phone: decodedToken.phone_number || decodedToken.phone || undefined,
        name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Customer'),
        role: isAdminByEmail ? 'admin' : 'customer',
      });
    } else if (isAdminByEmail && user.role !== 'admin') {
      user.role = 'admin';
    }
    }

    user.lastLoginAt = new Date();
    await user.save();

    req.user = user;
    req.auth = decodedToken;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication internal server error',
    });
  }
}

/**
 * Middleware to enforce Admin role
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access privileges required',
    });
  }

  next();
}

/**
 * Optional authentication middleware
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split('Bearer ')[1].trim();

    if (token.startsWith('gauth_')) {
      const identifier = token.replace('gauth_', '');
      let user = null;
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        user = await User.findById(identifier);
      }
      if (!user) {
        user = await User.findOne({ firebaseUid: identifier });
      }
      if (user) {
        req.user = user;
        req.auth = {
          uid: user.firebaseUid,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return next();
      }
    }

    if (token.startsWith('dev_token_')) {
      const decoded = parseDevToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (user) {
        req.user = user;
        req.auth = decoded;
      }
      return next();
    }

    let decodedToken = null;
    if (firebaseInitialized) {
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch {
        // ignore
      }
    }

    if (!decodedToken && token.startsWith('eyJ')) {
      try {
        const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (gRes.ok) {
          const gData = await gRes.json();
          decodedToken = {
            uid: gData.sub,
            email: gData.email,
            name: gData.name,
            picture: gData.picture,
          };
        }
      } catch (e) {
        // ignore
      }
    }

    if (decodedToken?.uid) {
      const user = await User.findOne({
        $or: [
          { firebaseUid: decodedToken.uid },
          ...(decodedToken.email ? [{ email: decodedToken.email.toLowerCase() }] : []),
        ],
      });
      if (user) {
        req.user = user;
        req.auth = decodedToken;
      }
    }
  } catch (e) {
    // Silently continue for optional auth
  }

  next();
}

function parseDevToken(token) {
  try {
    const parts = token.split('_');
    const role = parts[2] === 'admin' ? 'admin' : 'customer';
    const uid = parts[3] || 'dev-uid-' + (parts[2] || 'customer');
    return {
      uid,
      email: `${role}@snackstore.local`,
      name: role === 'admin' ? 'Store Manager (Admin)' : 'Valued Customer',
      phone: '+919876543210',
      role,
    };
  } catch {
    return {
      uid: 'dev-uid-guest',
      email: 'customer@snackstore.local',
      name: 'Customer',
      role: 'customer',
    };
  }
}
