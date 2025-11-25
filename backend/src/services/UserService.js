import UserRepository from '../repositories/UserRepository.js';
import CauseRepository from '../repositories/CauseRepository.js';

class UserService {
    async getUserProfile(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) return null;

        const causes = await Promise.all(
            user.causesSupported.map(causeId => CauseRepository.findById(causeId))
        );

        return {
            user,
            causes: causes.filter(c => c !== null)
        };
    }

    async updateProfile(userId, { name, picture }) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        if (name) user.name = name;
        if (picture) user.picture = picture;

        return UserRepository.update(userId, user);
    }

    async updateAvatar(userId, config) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        user.avatar = {
            base: config.base || user.avatar.base,
            eyes: config.eyes || user.avatar.eyes,
            mouth: config.mouth || user.avatar.mouth,
            accessory: config.accessory || user.avatar.accessory,
            bgColor: config.bgColor || user.avatar.bgColor,
            skinTone: config.skinTone || user.avatar.skinTone
        };

        return UserRepository.update(userId, user);
    }

    async getUserCauses(userId) {
        return CauseRepository.findByUser(userId);
    }
}

export default new UserService();
