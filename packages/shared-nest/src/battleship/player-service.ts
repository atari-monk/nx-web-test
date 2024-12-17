import { Injectable, Logger } from '@nestjs/common';
import { Cell, Player } from '@nx-web-test/shared';
import { Server, Socket } from 'socket.io';

@Injectable()
export class PlayerRepository {
  private MAX_PLAYERS = 2;
  private players: Player[] = [];

  getPlayer(playerId: string): Player | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  updateSocketId(playerId: string, socketId: string) {
    const existingPlayer = this.getPlayer(playerId);
    if (!existingPlayer) return false;
    existingPlayer.socketId = socketId;
    return existingPlayer;
  }

  isFull() {
    return this.players.length === this.MAX_PLAYERS;
  }

  addNewPlayer(playerId: string, socketId: string) {
    const player: Player = {
      id: playerId,
      socketId: socketId,
      grid: { size: 10, cells: this.createEmptyGrid(10) },
      ships: [],
      state: 'placement',
    };
    this.players.push(player);
  }

  private createEmptyGrid(size: number): Cell[][] {
    let idCounter = 0;
    const grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        id: idCounter++,
        occupied: false,
        hit: false,
      }))
    );
    return grid;
  }
}

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

  reconnectPlayer(client: Socket, playerId: string) {
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

  addNewPlayer(client: Socket, playerId: string) {
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
}
