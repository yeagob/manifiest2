import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'protest-simulator-jwt-secret-key-change-in-production';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const requireAuth = (req, res, next) => {
  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
      return next();
    }
  }

  // Fallback to session-based auth
  if (req.session?.userId) {
    req.userId = req.session.userId;
    return next();
  }

  console.warn('⚠️ Auth required but no token or session found:', {
    hasAuthHeader: !!authHeader,
    hasSession: !!req.session,
    sessionId: req.sessionID,
    cookies: req.cookies
  });

  return res.status(401).json({
    error: 'Authentication required',
    message: 'Please log in to continue'
  });
};

export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};

export const optionalAuth = (req, res, next) => {
  // Just pass through, but attach user if available
  next();
};
