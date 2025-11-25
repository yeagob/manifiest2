import { v4 as uuidv4 } from 'uuid';

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
}

export default Message;
