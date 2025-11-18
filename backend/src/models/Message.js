import { v4 as uuidv4 } from 'uuid';
import StorageService from '../services/storage.js';

const storage = new StorageService('messages');

class Message {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.causeId = data.causeId;
    this.userId = data.userId;
    this.userName = data.userName;
    this.userPicture = data.userPicture;
    this.message = data.message;
    this.type = data.type || 'placard'; // placard, shout, support
    this.createdAt = data.createdAt || new Date().toISOString();
    this.likes = data.likes || 0;
    this.likedBy = data.likedBy || []; // array of user IDs
  }

  async save() {
    await storage.write(this.id, this);
    return this;
  }

  async delete() {
    return storage.delete(this.id);
  }

  async addLike(userId) {
    if (!this.likedBy.includes(userId)) {
      this.likedBy.push(userId);
      this.likes++;
      await this.save();
    }
    return this;
  }

  async removeLike(userId) {
    const index = this.likedBy.indexOf(userId);
    if (index > -1) {
      this.likedBy.splice(index, 1);
      this.likes--;
      await this.save();
    }
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      causeId: this.causeId,
      userId: this.userId,
      userName: this.userName,
      userPicture: this.userPicture,
      message: this.message,
      type: this.type,
      createdAt: this.createdAt,
      likes: this.likes,
      likedBy: this.likedBy
    };
  }

  static async findById(id) {
    const data = await storage.read(id);
    return data ? new Message(data) : null;
  }

  static async findAll() {
    const items = await storage.list();
    return items.map(data => new Message(data));
  }

  static async findByCause(causeId) {
    const all = await this.findAll();
    return all
      .filter(message => message.causeId === causeId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findByUser(userId) {
    const all = await this.findAll();
    return all
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async create(data) {
    const message = new Message(data);
    await message.save();
    return message;
  }

  static async getRecentByCause(causeId, limit = 50) {
    const messages = await this.findByCause(causeId);
    return messages.slice(0, limit);
  }

  static async getMostLikedByCause(causeId, limit = 10) {
    const messages = await this.findByCause(causeId);
    return messages
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }
}

export default Message;
