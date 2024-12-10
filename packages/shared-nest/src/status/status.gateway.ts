import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins (configure this in production)
  },
})
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private logger = new Logger(StatusGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    // Emit a connection status to the client
    client.emit('connection_status', { message: 'Connected to the server' });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Emit a disconnection status
    client.emit('connection_status', {
      message: 'Disconnected from the server',
    });
  }

  @SubscribeMessage('request_status')
  handleRequestStatus(client: Socket): void {
    // Emit current connection status
    client.emit('connection_status', {
      message: 'Connection status requested',
    });
  }
}
