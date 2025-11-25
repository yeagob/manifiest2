import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import BaseRepository from '../BaseRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '../../../../data');

class JsonBaseRepository extends BaseRepository {
    constructor(collectionName) {
        super();
        this.collectionPath = join(DATA_PATH, collectionName);
    }

    async ensureDir() {
        try {
            await fs.access(this.collectionPath);
        } catch {
            await fs.mkdir(this.collectionPath, { recursive: true });
        }
    }

    async getFilePath(id) {
        await this.ensureDir();
        return join(this.collectionPath, `${id}.json`);
    }

    async findById(id) {
        try {
            const filePath = await this.getFilePath(id);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async findAll() {
        await this.ensureDir();
        const files = await fs.readdir(this.collectionPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const items = await Promise.all(
            jsonFiles.map(async (file) => {
                const id = file.replace('.json', '');
                return this.findById(id);
            })
        );

        return items.filter(item => item !== null);
    }

    async create(data) {
        if (!data.id) {
            throw new Error('Data must have an ID');
        }
        const filePath = await this.getFilePath(data.id);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return data;
    }

    async update(id, data) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(`Item ${id} not found`);
        }
        const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
        const filePath = await this.getFilePath(id);
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }

    async delete(id) {
        try {
            const filePath = await this.getFilePath(id);
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
}

export default JsonBaseRepository;
