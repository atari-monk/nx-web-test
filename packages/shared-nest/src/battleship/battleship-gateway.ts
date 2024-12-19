import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PlayerService } from './player-service';
import { EmitPayload, SocketEvent } from '@nx-web-test/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BattleshipGateway {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(BattleshipGateway.name);

  constructor(private readonly playerService: PlayerService) {}

  @SubscribeMessage(SocketEvent.JoinGame)
  handleJoinGame(client: Socket, payload: EmitPayload): void {
    const {
      ids: { playerId },
    } = payload;
    this.logger.debug(`Handling joinGame for playerId: ${playerId}`);
    this.playerService.joinGame(this.server, client, playerId);
  }

  @SubscribeMessage(SocketEvent.Disconnect)
  handleDisconnect(client: Socket): void {
    this.logger.debug(`Handling disconnect for socketId: ${client.id}`);
    this.playerService.removePlayer(client.id);
  }

  @SubscribeMessage(SocketEvent.PlaceFleet)
  handlePlaceFleet(client: Socket, payload: EmitPayload): void {
    const {
      ids: { playerId, socketId },
      data,
    } = payload;
    this.logger.debug(
      `Handling placeFleet for player ${playerId} on socket ${socketId}`
    );
    this.playerService.placeFleet(this.server, client, playerId, data);
  }

  @SubscribeMessage(SocketEvent.Attack)
  handleAttack(client: Socket, payload: EmitPayload): void {
    const {
      ids: { playerId, socketId },
      data: { coords },
    } = payload;
    this.logger.debug(
      `Attack received from player ${playerId} on socket ${socketId} at coordinates (${coords.x}, ${coords.y})`
    );
    this.playerService.attack(this.server, client, playerId, coords);
  }
}
