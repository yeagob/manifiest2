import { v4 as uuidv4 } from 'uuid';

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

    // SVG Avatar configuration
    this.avatar = data.avatar || {
      base: 'face',
      eyes: 'determined',
      mouth: 'shouting',
      accessory: 'none',
      bgColor: '#3B82F6',
      skinTone: 'tone3'
    };
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
}

export default User;
