import JsonBaseRepository from './json/JsonBaseRepository.js';

class UserRepository extends JsonBaseRepository {
    constructor() {
        super('users');
    }

    async findByEmail(email) {
        const all = await this.findAll();
        return all.find(user => user.email === email) || null;
    }

    async findByGoogleId(googleId) {
        const all = await this.findAll();
        return all.find(user => user.googleId === googleId) || null;
    }
}

export default new UserRepository();
