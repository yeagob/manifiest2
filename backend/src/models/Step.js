import { v4 as uuidv4 } from 'uuid';
import StorageService from '../services/storage.js';

const storage = new StorageService('steps');

class Step {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.causeId = data.causeId;
    this.steps = data.steps || 0;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async save() {
    await storage.write(this.id, this);
    return this;
  }

  async delete() {
    return storage.delete(this.id);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      causeId: this.causeId,
      steps: this.steps,
      timestamp: this.timestamp,
      date: this.date
    };
  }

  static async findById(id) {
    const data = await storage.read(id);
    return data ? new Step(data) : null;
  }

  static async findAll() {
    const items = await storage.list();
    return items.map(data => new Step(data));
  }

  static async findByUser(userId) {
    const all = await this.findAll();
    return all.filter(step => step.userId === userId);
  }

  static async findByCause(causeId) {
    const all = await this.findAll();
    return all.filter(step => step.causeId === causeId);
  }

  static async findByUserAndCause(userId, causeId) {
    const all = await this.findAll();
    return all.filter(step => step.userId === userId && step.causeId === causeId);
  }

  static async findByDate(date) {
    const all = await this.findAll();
    return all.filter(step => step.date === date);
  }

  static async create(data) {
    const step = new Step(data);
    await step.save();
    return step;
  }

  static async getTotalStepsByCause(causeId) {
    const steps = await this.findByCause(causeId);
    return steps.reduce((total, step) => total + step.steps, 0);
  }

  static async getTotalStepsByUser(userId) {
    const steps = await this.findByUser(userId);
    return steps.reduce((total, step) => total + step.steps, 0);
  }

  static async getUserStatsForCause(userId, causeId) {
    const steps = await this.findByUserAndCause(userId, causeId);
    return {
      totalSteps: steps.reduce((total, step) => total + step.steps, 0),
      records: steps.length,
      lastUpdate: steps.length > 0 ? steps[steps.length - 1].timestamp : null
    };
  }
}

export default Step;
