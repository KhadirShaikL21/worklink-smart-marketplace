import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const ACCESS_TTL = '30m';
const REFRESH_TTL = '30d';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}
