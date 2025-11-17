import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '../../data');

/**
 * Generic JSON storage service
 */
class StorageService {
  constructor(collectionName) {
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

  async read(id) {
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

  async write(id, data) {
    const filePath = await this.getFilePath(id);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return data;
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

  async list() {
    await this.ensureDir();
    const files = await fs.readdir(this.collectionPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const id = file.replace('.json', '');
        return this.read(id);
      })
    );

    return items.filter(item => item !== null);
  }

  async exists(id) {
    try {
      const filePath = await this.getFilePath(id);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async update(id, updates) {
    const existing = await this.read(id);
    if (!existing) {
      throw new Error(`Item ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.write(id, updated);
  }
}

export default StorageService;
