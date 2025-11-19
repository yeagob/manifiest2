import { v4 as uuidv4 } from 'uuid';
import StorageService from '../services/storage.js';

const storage = new StorageService('causes');

class Cause {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.category = data.category || 'other';
    this.createdBy = data.createdBy; // user ID
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.supporters = data.supporters || []; // array of user IDs
    this.totalSteps = data.totalSteps || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.icon = data.icon || '✊';
    this.color = data.color || '#3B82F6';
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    await storage.write(this.id, this);
    return this;
  }

  async delete() {
    return storage.delete(this.id);
  }

  async addSupporter(userId) {
    if (!this.supporters.includes(userId)) {
      this.supporters.push(userId);
      await this.save();
    }
    return this;
  }

  async removeSupporter(userId) {
    this.supporters = this.supporters.filter(id => id !== userId);
    await this.save();
    return this;
  }

  async addSteps(count) {
    this.totalSteps += count;
    await this.save();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      category: this.category,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      supporters: this.supporters,
      supporterCount: this.supporters.length,
      totalSteps: this.totalSteps,
      isActive: this.isActive,
      icon: this.icon,
      color: this.color
    };
  }

  static async findById(id) {
    const data = await storage.read(id);
    return data ? new Cause(data) : null;
  }

  static async findAll() {
    const items = await storage.list();
    return items.map(data => new Cause(data));
  }

  static async findActive() {
    const all = await this.findAll();
    return all.filter(cause => cause.isActive);
  }

  static async findByUser(userId) {
    const all = await this.findAll();
    return all.filter(cause => cause.supporters.includes(userId));
  }

  static async create(data) {
    const cause = new Cause(data);
    await cause.save();
    return cause;
  }

  static async getMostActive(limit = 10) {
    const all = await this.findActive();
    return all
      .sort((a, b) => b.totalSteps - a.totalSteps)
      .slice(0, limit);
  }
}

export default Cause;
