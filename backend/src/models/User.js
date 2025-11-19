import { v4 as uuidv4 } from 'uuid';
import StorageService from '../services/storage.js';

const storage = new StorageService('users');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.name = data.name;
    this.picture = data.picture;
    this.googleId = data.googleId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.totalSteps = data.totalSteps || 0;
    this.causesSupported = data.causesSupported || []; // array of cause IDs
    this.stepDistribution = data.stepDistribution || {}; // { causeId: { interval: 1, count: 0 } }

    // Avatar customization
    this.avatar = data.avatar || {
      emoji: '✊', // Default protest symbol
      color: '#6366F1' // Default indigo color
    };
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    await storage.write(this.id, this);
    return this;
  }

  async delete() {
    return storage.delete(this.id);
  }

  async addSteps(count) {
    this.totalSteps += count;
    await this.save();
    return this;
  }

  async supportCause(causeId, interval = 1) {
    if (!this.causesSupported.includes(causeId)) {
      this.causesSupported.push(causeId);
    }
    this.stepDistribution[causeId] = {
      interval: interval, // every N steps goes to this cause
      count: this.stepDistribution[causeId]?.count || 0
    };
    await this.save();
    return this;
  }

  async unsupportCause(causeId) {
    this.causesSupported = this.causesSupported.filter(id => id !== causeId);
    delete this.stepDistribution[causeId];
    await this.save();
    return this;
  }

  async updateStepDistribution(causeId, interval) {
    if (this.stepDistribution[causeId]) {
      this.stepDistribution[causeId].interval = interval;
      await this.save();
    }
    return this;
  }

  async updateAvatar(emoji, color) {
    this.avatar = {
      emoji: emoji || this.avatar.emoji,
      color: color || this.avatar.color
    };
    await this.save();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      picture: this.picture,
      googleId: this.googleId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      totalSteps: this.totalSteps,
      causesSupported: this.causesSupported,
      stepDistribution: this.stepDistribution,
      avatar: this.avatar
    };
  }

  static async findById(id) {
    const data = await storage.read(id);
    return data ? new User(data) : null;
  }

  static async findByEmail(email) {
    const all = await storage.list();
    const userData = all.find(user => user.email === email);
    return userData ? new User(userData) : null;
  }

  static async findByGoogleId(googleId) {
    const all = await storage.list();
    const userData = all.find(user => user.googleId === googleId);
    return userData ? new User(userData) : null;
  }

  static async findAll() {
    const items = await storage.list();
    return items.map(data => new User(data));
  }

  static async create(data) {
    const user = new User(data);
    await user.save();
    return user;
  }

  static async findOrCreate(googleData) {
    let user = await this.findByGoogleId(googleData.googleId);
    if (!user) {
      user = await this.create({
        email: googleData.email,
        name: googleData.name,
        picture: googleData.picture,
        googleId: googleData.googleId
      });
    }
    return user;
  }
}

export default User;
