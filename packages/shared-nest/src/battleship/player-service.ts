import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlayerRepository } from './player-repository';
import { FleetUtils, Grid, ShipPlacement } from '@nx-web-test/shared';

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

  placeFleet(
    server: Server,
    client: Socket,
    data: { playerId: string; grid: Grid; fleet: ShipPlacement[] }
  ) {
    const { playerId, grid, fleet } = data;
    const player = this.playerRepository.getPlayerById(playerId);
    if (!(player && player.state === 'placement')) {
      const msg = `Fleet placement error for player: ${playerId}`;
      client.emit('error', msg);
      this.logger.debug(msg);
      return;
    }
    player.grid = grid;
    player.ships = fleet;
    player.state = 'ready';
    FleetUtils.printGridWithFleet(player.grid, fleet);
    client.emit('fleetPlaced', playerId);
    this.logger.debug(`Fleet placed for player: ${playerId}`);
    this.checkGameReady(server);
  }

  private checkGameReady(server: Server) {
    this.logger.debug('Checking if the game is ready to start.');
    if (!this.playerRepository.isFull()) {
      this.logger.warn('Not enough players to start the game.');
      return;
    }
    if (!this.playerRepository.isReady()) {
      this.logger.log('Not all players are ready yet.');
      return;
    }
    this.logger.debug('All players are ready. Starting the game.');
    this.playerRepository.setInTurnState();
    this.playerRepository.setTurnIndex();
    server.emit('gameStart', {
      message: 'All players have placed their fleets. Game starts!',
      firstTurn: this.playerRepository.getPlayerIdInTurn(),
    });
  }
}
