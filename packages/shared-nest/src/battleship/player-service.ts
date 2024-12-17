import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlayerRepository } from './player-repository';

@Injectable()
export class PlayerService {
  private logger = new Logger(PlayerService.name);

  constructor(private readonly playerRepository: PlayerRepository) {}

  joinGame(server: Server, client: Socket, playerId: string) {
    if (this.reconnectPlayer(client, playerId)) return;
    if (this.addNewPlayer(client, playerId)) return;
    if (this.gameReady(server)) return;
    this.gameFull(client);
  }

  private reconnectPlayer(client: Socket, playerId: string) {
    const existingPlayer = this.playerRepository.updateSocketId(
      playerId,
      client.id
    );
    if (!existingPlayer) return false;
    const msg = 'Reconnected to the game';
    client.emit('reconnectPlayer', {
      message: msg,
      grid: existingPlayer.grid,
      ships: existingPlayer.ships,
    });
    this.logger.debug(msg);
    return true;
  }

  private addNewPlayer(client: Socket, playerId: string) {
    if (this.playerRepository.isFull()) return false;
    this.playerRepository.addNewPlayer(playerId, client.id);
    const msg = 'Joined the game';
    client.emit('joined', { message: msg });
    this.logger.debug(msg);
    return true;
  }

  private gameReady(server: Server) {
    if (!this.playerRepository.isFull()) return false;
    const msg = 'Both players have joined. Place your fleets!';
    server.emit('gameReady', {
      message: msg,
    });
    this.logger.debug(msg);
    return true;
  }

  private gameFull(client: Socket) {
    const msg = 'Game is already full';
    client.emit('error', { message: msg });
    this.logger.debug(msg);
  }

  removePlayer(socketId: string) {
    const player = this.playerRepository.getPlayerBySocketId(socketId);
    if (!player) return;
    this.logger.debug(`Player ${player.id} disconnected`);
    setTimeout(() => {
      const playerStillDisconnected =
        this.playerRepository.getPlayerBySocketId(socketId);
      if (playerStillDisconnected) {
        if (this.playerRepository.removePlayerBySocketId(socketId))
          this.logger.debug(`Player ${player.id} removed after grace period`);
      }
    }, 30000);
  }
}
