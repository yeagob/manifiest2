import MessageRepository from '../repositories/MessageRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import CauseRepository from '../repositories/CauseRepository.js';
import Message from '../models/Message.js';

class MessageService {
    async getByCause(causeId) {
        return MessageRepository.findByCause(causeId);
    }

    async getMostLiked(causeId, limit = 10) {
        const messages = await MessageRepository.findByCause(causeId);
        return messages
            .sort((a, b) => b.likes - a.likes)
            .slice(0, limit);
    }

    async getByUser(userId) {
        return MessageRepository.findByUser(userId);
    }

    async createMessage(userId, { causeId, message, type }) {
        const cause = await CauseRepository.findById(causeId);
        if (!cause) throw new Error('Cause not found');

        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const newMessage = new Message({
            causeId,
            userId: user.id,
            userName: user.name,
            userPicture: user.picture,
            message,
            type: type || 'placard'
        });

        return MessageRepository.create(newMessage);
    }

    async likeMessage(userId, messageId) {
        const message = await MessageRepository.findById(messageId);
        if (!message) throw new Error('Message not found');

        if (!message.likedBy.includes(userId)) {
            message.likedBy.push(userId);
            message.likes++;
            await MessageRepository.update(messageId, message);
        }

        return message;
    }

    async unlikeMessage(userId, messageId) {
        const message = await MessageRepository.findById(messageId);
        if (!message) throw new Error('Message not found');

        const index = message.likedBy.indexOf(userId);
        if (index > -1) {
            message.likedBy.splice(index, 1);
            message.likes--;
            await MessageRepository.update(messageId, message);
        }

        return message;
    }

    async deleteMessage(userId, messageId) {
        const message = await MessageRepository.findById(messageId);
        if (!message) throw new Error('Message not found');

        if (message.userId !== userId) {
            throw new Error('Not authorized');
        }

        return MessageRepository.delete(messageId);
    }
}

export default new MessageService();
