import CauseRepository from '../repositories/CauseRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import StepRepository from '../repositories/StepRepository.js';
import MessageRepository from '../repositories/MessageRepository.js';
import Cause from '../models/Cause.js';

class CauseService {
    async getAllActive() {
        return CauseRepository.findActive();
    }

    async getMostActive(limit = 10) {
        const active = await CauseRepository.findActive();
        return active
            .sort((a, b) => b.totalSteps - a.totalSteps)
            .slice(0, limit);
    }

    async getById(id) {
        return CauseRepository.findById(id);
    }

    async createCause(userId, data) {
        const cause = new Cause({
            ...data,
            createdBy: userId,
            supporters: [userId]
        });

        await CauseRepository.create(cause);

        // Add to user's supported causes
        const user = await UserRepository.findById(userId);
        if (user) {
            if (!user.causesSupported.includes(cause.id)) {
                user.causesSupported.push(cause.id);
                user.stepDistribution[cause.id] = { interval: 1, count: 0 };
                await UserRepository.update(userId, user);
            }
        }

        return cause;
    }

    async updateCause(userId, causeId, updates) {
        const cause = await CauseRepository.findById(causeId);
        if (!cause) throw new Error('Cause not found');
        if (cause.createdBy !== userId) throw new Error('Not authorized');

        const updatedCause = { ...cause, ...updates };
        return CauseRepository.update(causeId, updatedCause);
    }

    async deleteCause(userId, causeId) {
        const cause = await CauseRepository.findById(causeId);
        if (!cause) throw new Error('Cause not found');
        if (cause.createdBy !== userId) throw new Error('Not authorized');

        return CauseRepository.delete(causeId);
    }

    async supportCause(userId, causeId, interval = 1) {
        const cause = await CauseRepository.findById(causeId);
        if (!cause) throw new Error('Cause not found');

        if (!cause.supporters.includes(userId)) {
            cause.supporters.push(userId);
            await CauseRepository.update(causeId, cause);
        }

        const user = await UserRepository.findById(userId);
        if (user) {
            if (!user.causesSupported.includes(causeId)) {
                user.causesSupported.push(causeId);
            }
            user.stepDistribution[causeId] = {
                interval: interval,
                count: user.stepDistribution[causeId]?.count || 0
            };
            await UserRepository.update(userId, user);
        }

        return cause;
    }

    async unsupportCause(userId, causeId) {
        const cause = await CauseRepository.findById(causeId);
        if (!cause) throw new Error('Cause not found');

        cause.supporters = cause.supporters.filter(id => id !== userId);
        await CauseRepository.update(causeId, cause);

        const user = await UserRepository.findById(userId);
        if (user) {
            user.causesSupported = user.causesSupported.filter(id => id !== causeId);
            delete user.stepDistribution[causeId];
            await UserRepository.update(userId, user);
        }

        return cause;
    }

    async updateDistribution(userId, causeId, interval) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        if (user.stepDistribution[causeId]) {
            user.stepDistribution[causeId].interval = interval;
            await UserRepository.update(userId, user);
        }

        return user.stepDistribution;
    }

    async getSupportersWithSteps(causeId) {
        const cause = await CauseRepository.findById(causeId);
        if (!cause) throw new Error('Cause not found');

        const allSteps = await StepRepository.findByCause(causeId);
        const allMessages = await MessageRepository.findByCause(causeId);

        const userStepsMap = {};
        allSteps.forEach(step => {
            if (!userStepsMap[step.userId]) {
                userStepsMap[step.userId] = 0;
            }
            userStepsMap[step.userId] += step.steps;
        });

        const supporters = await Promise.all(
            Object.keys(userStepsMap).map(async (userId) => {
                const user = await UserRepository.findById(userId);
                if (!user) return null;

                const userMessages = allMessages.filter(msg => msg.userId === userId);
                const latestMessage = userMessages.length > 0
                    ? userMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                    : null;

                return {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    picture: user.picture,
                    avatar: user.avatar,
                    steps: userStepsMap[userId],
                    message: latestMessage ? latestMessage.message : null,
                    messageId: latestMessage ? latestMessage.id : null
                };
            })
        );

        const validSupporters = supporters.filter(s => s !== null);
        validSupporters.sort((a, b) => b.steps - a.steps);

        return {
            totalSupporters: validSupporters.length,
            maxSteps: validSupporters.length > 0 ? validSupporters[0].steps : 0,
            supporters: validSupporters
        };
    }
}

export default new CauseService();
