/**
 * Base Repository Interface
 * Defines the contract for all repositories
 */
class BaseRepository {
    async findById(id) { throw new Error('Not implemented'); }
    async findAll() { throw new Error('Not implemented'); }
    async create(data) { throw new Error('Not implemented'); }
    async update(id, data) { throw new Error('Not implemented'); }
    async delete(id) { throw new Error('Not implemented'); }
}

export default BaseRepository;
