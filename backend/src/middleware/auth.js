import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    console.warn('⚠️ Auth required but no session found:', {
      hasSession: !!req.session,
      sessionId: req.sessionID,
      cookies: req.cookies
    });
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to continue'
    });
  }
  next();
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
