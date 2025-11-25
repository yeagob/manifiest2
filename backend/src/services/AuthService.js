import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import UserRepository from '../repositories/UserRepository.js';
import User from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'protest-simulator-jwt-secret-key-change-in-production';

class AuthService {
    generateToken(userId) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    async verifyGoogleToken(token) {
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
    }

    async loginWithEmail(email, name) {
        let user = await UserRepository.findByEmail(email);

        if (!user) {
            const userData = {
                email: email.toLowerCase(),
                name: name || email.split('@')[0],
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=6366F1&color=fff`
            };
            // Create new User instance
            const newUser = new User(userData);
            // Save to repository
            await UserRepository.create(newUser);
            user = newUser;
        }

        const token = this.generateToken(user.id);
        return { user, token };
    }

    async loginWithGoogle(token) {
        const googleData = await this.verifyGoogleToken(token);
        let user = await UserRepository.findByGoogleId(googleData.googleId);

        if (!user) {
            const newUser = new User({
                email: googleData.email,
                name: googleData.name,
                picture: googleData.picture,
                googleId: googleData.googleId
            });
            await UserRepository.create(newUser);
            user = newUser;
        }

        const jwtToken = this.generateToken(user.id);
        return { user, token: jwtToken };
    }
}

export default new AuthService();
