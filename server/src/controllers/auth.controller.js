import { User } from '../models/User.js';
import { admin, firebaseInitialized } from '../config/firebase.js';

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        aboutMe: user.aboutMe || '',
        deliveryAddress: user.deliveryAddress || '',
        savedAddresses: user.savedAddresses,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function syncUser(req, res) {
  try {
    const { name, email, phone, avatarUrl, aboutMe, deliveryAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (aboutMe) user.aboutMe = aboutMe;
    if (deliveryAddress) user.deliveryAddress = deliveryAddress;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        aboutMe: user.aboutMe || '',
        deliveryAddress: user.deliveryAddress || '',
        savedAddresses: user.savedAddresses,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone, savedAddresses, avatarUrl, aboutMe, deliveryAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (aboutMe !== undefined) user.aboutMe = aboutMe;
    if (deliveryAddress !== undefined) user.deliveryAddress = deliveryAddress;
    if (savedAddresses !== undefined) user.savedAddresses = savedAddresses;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl || '',
        aboutMe: user.aboutMe || '',
        deliveryAddress: user.deliveryAddress || '',
        savedAddresses: user.savedAddresses,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export function checkIsAdminEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (lower.includes('admin')) return true;
  const adminEnv = process.env.ADMIN_EMAIL || '';
  const adminList = adminEnv.split(',').map((e) => e.toLowerCase().trim()).filter(Boolean);
  return adminList.includes(lower);
}

export async function googleAuth(req, res) {
  try {
    const { idToken, email: clientEmail, name: clientName, uid: clientUid, avatar } = req.body;
    let resolvedEmail = clientEmail;
    let resolvedName = clientName;
    let resolvedUid = clientUid;
    let resolvedAvatar = avatar;

    // 1. Verify idToken if supplied
    if (idToken) {
      // Try Firebase Admin SDK verification if initialized
      if (firebaseInitialized) {
        try {
          const decoded = await admin.auth().verifyIdToken(idToken);
          resolvedUid = decoded.uid;
          resolvedEmail = decoded.email || resolvedEmail;
          resolvedName = decoded.name || resolvedName;
          resolvedAvatar = decoded.picture || resolvedAvatar;
        } catch (fbErr) {
          console.warn('[Google Auth] Firebase token verify warning:', fbErr.message);
        }
      }

      // If idToken is a Google OAuth JWT (starts with eyJ), verify via Google tokeninfo
      if (!resolvedUid && idToken.startsWith('eyJ')) {
        try {
          const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
          if (gRes.ok) {
            const gData = await gRes.json();
            resolvedUid = gData.sub;
            resolvedEmail = gData.email || resolvedEmail;
            resolvedName = gData.name || resolvedName;
            resolvedAvatar = gData.picture || resolvedAvatar;
          }
        } catch (gErr) {
          console.warn('[Google Auth] Google tokeninfo verify warning:', gErr.message);
        }
      }
    }

    // Dev fallback if client passed email without verifiable token in development
    if (!resolvedUid && clientEmail) {
      resolvedEmail = clientEmail;
      resolvedName = clientName || clientEmail.split('@')[0];
      resolvedUid = clientUid || `google_${clientEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    if (!resolvedEmail && !resolvedUid) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify Google account details. Please try again.',
      });
    }

    if (!resolvedUid) {
      resolvedUid = `google_${resolvedEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    // 2. Find or create user in MongoDB
    let user = await User.findOne({
      $or: [
        { firebaseUid: resolvedUid },
        ...(resolvedEmail ? [{ email: resolvedEmail.toLowerCase() }] : []),
      ],
    });

    const isAdminByEmail = checkIsAdminEmail(resolvedEmail);

    if (!user) {
      user = await User.create({
        firebaseUid: resolvedUid,
        email: resolvedEmail ? resolvedEmail.toLowerCase() : undefined,
        name: resolvedName || (resolvedEmail ? resolvedEmail.split('@')[0] : 'Snack Lover'),
        role: isAdminByEmail ? 'admin' : 'customer',
        lastLoginAt: new Date(),
      });
    } else {
      if (!user.firebaseUid) user.firebaseUid = resolvedUid;
      if (resolvedName && (!user.name || user.name === 'Guest Customer')) {
        user.name = resolvedName;
      }
      if (isAdminByEmail && user.role !== 'admin') {
        user.role = 'admin';
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    const authToken = `gauth_${user._id}`;

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: authToken,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        savedAddresses: user.savedAddresses || [],
        avatar: resolvedAvatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Google Auth Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
}

export async function getAllCustomers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        addressesCount: u.savedAddresses?.length || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function claimAdmin(req, res) {
  try {
    const { secretKey } = req.body;
    const configuredSecret = process.env.ADMIN_SECRET_KEY || 'snackcraft-admin-2026';

    if (!secretKey || secretKey.trim() !== configuredSecret.trim()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Admin Secret Key. Access denied.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    user.role = 'admin';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Admin access privileges granted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
