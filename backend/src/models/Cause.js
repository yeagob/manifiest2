import { v4 as uuidv4 } from 'uuid';

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
}

export default Cause;
