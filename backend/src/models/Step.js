import { v4 as uuidv4 } from 'uuid';

class Step {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.causeId = data.causeId;
    this.steps = data.steps || 0;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
}

export default Step;
