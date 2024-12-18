import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PlayerService } from './player-service';
import { Grid, ShipPlacement } from '@nx-web-test/shared';
import { ServerEvent } from './server-event';

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

  @SubscribeMessage(ServerEvent.JoinGame)
  handleJoinGame(client: Socket, data: { playerId: string }): void {
    const { playerId } = data;
    this.logger.debug(`Handling joinGame for playerId: ${playerId}`);
    this.playerService.joinGame(this.server, client, playerId);
  }

  @SubscribeMessage(ServerEvent.Disconnect)
  handleDisconnect(client: Socket): void {
    this.logger.debug(`Handling disconnect for socketId: ${client.id}`);
    this.playerService.removePlayer(client.id);
  }

  @SubscribeMessage(ServerEvent.PlaceFleet)
  handlePlaceFleet(
    client: Socket,
    data: { playerId: string; grid: Grid; fleet: ShipPlacement[] }
  ): void {
    this.logger.debug(`Handling placeFleet for playerId: ${data.playerId}`);
    this.playerService.placeFleet(this.server, client, data);
  }

  @SubscribeMessage(ServerEvent.Attack)
  handleAttack(
    client: Socket,
    data: { playerId: string; coords: { x: number; y: number } }
  ): void {
    this.logger.debug(`Handling attack from playerId: ${data.playerId}`);
    this.playerService.attack(this.server, client, data);
  }
}
