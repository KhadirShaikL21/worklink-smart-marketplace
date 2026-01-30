import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokens');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', reason: err.message });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles?.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
