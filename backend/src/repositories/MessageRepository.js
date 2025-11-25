import JsonBaseRepository from './json/JsonBaseRepository.js';

class MessageRepository extends JsonBaseRepository {
    constructor() {
        super('messages');
    }

    async findByCause(causeId) {
        const all = await this.findAll();
        return all.filter(msg => msg.causeId === causeId);
    }

    async findByUser(userId) {
        const all = await this.findAll();
        return all.filter(msg => msg.userId === userId);
    }
}

export default new MessageRepository();
