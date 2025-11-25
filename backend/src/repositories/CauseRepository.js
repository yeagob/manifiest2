import JsonBaseRepository from './json/JsonBaseRepository.js';

class CauseRepository extends JsonBaseRepository {
    constructor() {
        super('causes');
    }

    async findActive() {
        const all = await this.findAll();
        return all.filter(cause => cause.isActive !== false);
    }

    async findByUser(userId) {
        const all = await this.findAll();
        return all.filter(cause => cause.supporters && cause.supporters.includes(userId));
    }
}

export default new CauseRepository();
