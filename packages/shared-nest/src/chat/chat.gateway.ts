import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins (configure this in production)
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.chatService.addClient(client.id);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.chatService.removeClient(client.id);
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    client: Socket,
    payload: { room: string; message: string; sender: string }
  ): void {
    const { room, message, sender } = payload;

    this.logger.log(
      `Message received: ${message} from ${sender} (room: ${room})`
    );
    this.server.to(room).emit('receive_message', { message, sender });

    this.chatService.logMessage(room, sender, message);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, room: string): void {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('joined_room', room);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(client: Socket, room: string): void {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    client.emit('left_room', room);
  }
}
