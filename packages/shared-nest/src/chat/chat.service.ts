import { Injectable } from '@nestjs/common';
import { Message, RoomMessages } from '@nx-web-test/shared';

@Injectable()
export class ChatService {
  private clients: Set<string> = new Set();
  private messages: RoomMessages = {};

  addClient(clientId: string): void {
    this.clients.add(clientId);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  logMessage(room: string, sender: string, message: string): void {
    if (!this.messages[room]) {
      this.messages[room] = [];
    }
    this.messages[room].push({
      sender,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  getMessages(room: string): Message[] {
    return this.messages[room] || [];
  }
}
