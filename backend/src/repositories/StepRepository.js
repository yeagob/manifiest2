import JsonBaseRepository from './json/JsonBaseRepository.js';

class StepRepository extends JsonBaseRepository {
    constructor() {
        super('steps');
    }

    async findByUser(userId) {
        const all = await this.findAll();
        return all.filter(step => step.userId === userId);
    }

    async findByCause(causeId) {
        const all = await this.findAll();
        return all.filter(step => step.causeId === causeId);
    }

    async findByDate(date) {
        const all = await this.findAll();
        // Assuming date is stored in ISO format and we want to match YYYY-MM-DD
        // But steps might have a specific date field or use createdAt
        return all.filter(step => {
            const stepDate = step.createdAt ? step.createdAt.split('T')[0] : '';
            return stepDate === date;
        });
    }
}

export default new StepRepository();
