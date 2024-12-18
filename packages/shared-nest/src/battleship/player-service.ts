import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlayerRepository } from './player-repository';
import {
  EmitEvent,
  FleetUtils,
  Grid,
  ShipPlacement,
  StatusCode,
} from '@nx-web-test/shared';
import { emitEvent } from './emit-event';

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

    emitEvent(
      this.logger,
      client,
      EmitEvent.ReconnectPlayer,
      { playerId, socketId: client.id },
      StatusCode.OK,
      'Reconnected to the game',
      {
        grid: existingPlayer.grid,
        ships: existingPlayer.ships,
      }
    );

    return true;
  }

  private addNewPlayer(client: Socket, playerId: string) {
    if (this.playerRepository.isFull()) return false;

    this.playerRepository.addNewPlayer(playerId, client.id);

    emitEvent(
      this.logger,
      client,
      EmitEvent.Joined,
      { playerId, socketId: client.id },
      StatusCode.OK,
      'Joined the game'
    );

    return true;
  }

  private gameReady(server: Server) {
    if (!this.playerRepository.isFull()) return false;

    emitEvent(
      this.logger,
      server,
      EmitEvent.GameReady,
      { playerId: '', socketId: '' },
      StatusCode.OK,
      'Both players have joined. Place your fleets!'
    );

    return true;
  }

  private gameFull(client: Socket) {
    emitEvent(
      this.logger,
      client,
      EmitEvent.Error,
      { playerId: '', socketId: client.id },
      StatusCode.Forbidden,
      'Game is already full'
    );
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
      emitEvent(
        this.logger,
        client,
        EmitEvent.Error,
        { playerId, socketId: client.id },
        StatusCode.BadRequest,
        `Fleet placement error for player: ${playerId}`
      );
      return;
    }

    player.grid = grid;
    player.ships = fleet;
    player.state = 'ready';
    FleetUtils.printGridWithFleet(player.grid, fleet);

    emitEvent(
      this.logger,
      client,
      EmitEvent.GameReady,
      { playerId, socketId: client.id },
      StatusCode.OK,
      `Fleet placed for player: ${playerId}`
    );

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

    emitEvent(
      this.logger,
      server,
      EmitEvent.GameStart,
      { playerId: '', socketId: '' },
      StatusCode.OK,
      'All players have placed their fleets. Game starts!',
      { firstTurn: this.playerRepository.getPlayerInTurn() }
    );
  }

  attack(
    server: Server,
    client: Socket,
    data: { playerId: string; coords: { x: number; y: number } }
  ) {
    const {
      playerId,
      coords: { x, y },
    } = data;
    this.logger.debug(
      `Attack received from player ${playerId} at coordinates (${x}, ${y})`
    );

    const currentPlayer = this.playerRepository.getPlayerInTurn();
    const opponent = this.playerRepository.getOpponentPlayer(currentPlayer.id);

    if (!opponent) {
      emitEvent(
        this.logger,
        client,
        EmitEvent.Error,
        { playerId, socketId: client.id },
        StatusCode.BadRequest,
        'Opponent not found.'
      );
      return;
    }

    if (playerId !== currentPlayer.id) {
      emitEvent(
        this.logger,
        client,
        EmitEvent.Error,
        { playerId, socketId: client.id },
        StatusCode.BadRequest,
        `Invalid turn attempt by: ${playerId}`
      );
      return;
    }

    const targetCell = opponent.grid.cells[x]?.[y];
    if (!targetCell) {
      emitEvent(
        this.logger,
        client,
        EmitEvent.Error,
        { playerId, socketId: client.id },
        StatusCode.BadRequest,
        `Invalid target coordinates: (${x}, ${y}) by: ${playerId}`
      );
      return;
    }

    if (targetCell.hit) {
      emitEvent(
        this.logger,
        client,
        EmitEvent.Error,
        { playerId, socketId: client.id },
        StatusCode.BadRequest,
        `Cell already targeted: (${x}, ${y}) by: ${playerId}`
      );
      return;
    }

    targetCell.hit = true;

    if (targetCell.occupied) {
      emitEvent(
        this.logger,
        client,
        EmitEvent.AttackResult,
        { playerId, socketId: client.id },
        StatusCode.OK,
        `Attack result: hit at (${x}, ${y}) by: ${playerId}`,
        { x, y, result: 'hit' }
      );

      emitEvent(
        this.logger,
        server,
        EmitEvent.AttackResult,
        { playerId, socketId: client.id },
        StatusCode.OK,
        `Attack result: hit at (${x}, ${y}) by: ${playerId}`,
        { x, y, result: 'hit' },
        opponent.id
      );

      if (this.playerRepository.checkAllShipsSunk(opponent)) {
        emitEvent(
          this.logger,
          server,
          EmitEvent.GameOver,
          { playerId: '', socketId: '' },
          StatusCode.OK,
          `Game over. Winner: ${currentPlayer.id}`,
          { winner: currentPlayer.id }
        );
        return;
      }
    } else {
      emitEvent(
        this.logger,
        client,
        EmitEvent.AttackResult,
        { playerId, socketId: client.id },
        StatusCode.OK,
        `Attack result: miss at (${x}, ${y}) by: ${playerId}`,
        { x, y, result: 'miss' }
      );

      emitEvent(
        this.logger,
        server,
        EmitEvent.AttackResult,
        { playerId, socketId: client.id },
        StatusCode.OK,
        `Attack result: miss at (${x}, ${y}) by: ${playerId}`,
        { x, y, result: 'miss' },
        opponent.id
      );
    }

    this.playerRepository.setNextTurnIndex();
    const nextPlayerId = this.playerRepository.getPlayerInTurn().id;

    emitEvent(
      this.logger,
      server,
      EmitEvent.TurnChange,
      { playerId: '', socketId: '' },
      StatusCode.OK,
      `Turn changed. Next player: ${nextPlayerId}`,
      { nextPlayerId }
    );
  }
}
