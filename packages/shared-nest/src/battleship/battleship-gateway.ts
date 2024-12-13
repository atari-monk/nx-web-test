import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  Cell,
  FleetUtils,
  Grid,
  Player,
  ShipPlacement,
} from '@nx-web-test/shared';
import { GameStateService } from './game-state-service';
import { FileHelperService } from './file-helper-service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BattleshipGateway {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(BattleshipGateway.name);
  private players: Player[] = [];
  private currentTurnIndex = 0;

  constructor(
    private readonly gameStateService: GameStateService,
    private readonly fileHelperService: FileHelperService
  ) {}

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, data: { playerId: string }): void {
    const { playerId } = data;
    this.logger.debug(
      `Client connected: playerId: ${playerId}, socketId: ${client.id}`
    );

    const existingPlayer = this.players.find((p) => p.id === playerId);

    if (existingPlayer) {
      existingPlayer.socketId = client.id;

      //todo: move this to private method handling save state
      const savedState = this.gameStateService.getPlayerState(playerId);
      if (savedState) {
        existingPlayer.grid.cells = savedState.grid;
        existingPlayer.ships = savedState.ships;
        client.emit('loadState', {
          grid: savedState.grid,
          ships: savedState.ships,
        });
        this.logger.debug(`Loaded state for player: ${playerId}`);
      }

      client.emit('joined', { message: 'Reconnected to the game!' });
      this.logger.debug(`Player reconnected: ${playerId}`);
      return;
    }

    if (this.players.length < 2) {
      //todo: move this to private method handling player adding
      const player: Player = {
        id: playerId,
        socketId: client.id,
        grid: { size: 10, cells: this.createEmptyGrid(10) },
        ships: [],
        state: 'placement',
      };
      this.players.push(player);
      client.emit('joined', { message: 'Joined the game!' });
      this.logger.debug(`Player added: ${player.id}`);

      if (this.players.length === 2) {
        //todo: move this to private method handling game ready
        this.server.emit(
          'gameReady',
          'Both players have joined. Place your fleets!'
        );
        this.logger.debug('Both players have joined the game.');
      }
    } else {
      //todo: move this to private method handling game full
      client.emit('error', 'Game is already full!');
      this.logger.debug('Game is already full.');
    }
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(client: Socket): void {
    const playerIndex = this.players.findIndex((p) => p.socketId === client.id);
    if (playerIndex !== -1) {
      const player = this.players[playerIndex];
      this.logger.debug(`Player disconnected: ${player.id}`);

      setTimeout(() => {
        const stillDisconnected = !this.players.find(
          (p) => p.socketId === client.id
        );
        if (stillDisconnected) {
          this.players.splice(playerIndex, 1);
          this.logger.debug(`Player removed after grace period: ${player.id}`);
        }
      }, 30000);
    }
  }

  @SubscribeMessage('placeFleet')
  handlePlaceFleet(
    client: Socket,
    data: { playerId: string; grid: Grid; fleet: ShipPlacement[] }
  ): void {
    const { playerId, grid, fleet } = data;
    this.logger.debug(`Fleet placement received from playerId: ${playerId}`);
    const player = this.players.find((p) => p.id === playerId);

    if (player && player.state === 'placement') {
      player.grid = grid;
      player.ships = fleet;
      player.state = 'ready';

      this.gameStateService.savePlayerState(playerId, player.grid.cells, fleet);

      FleetUtils.printGridWithFleet(player.grid, fleet);

      client.emit('fleetPlaced', 'Fleet placement complete!');
      this.logger.debug(`Fleet placed for player: ${client.id}`);

      this.checkGameReady();
    } else {
      const msg = `Fleet placement error for player: ${client.id}`;
      client.emit('error', msg);
      this.logger.debug(msg);
    }
  }

  private checkGameReady(): void {
    this.logger.debug('Checking if the game is ready to start.');

    if (this.players.length < 2) {
      this.logger.warn('Not enough players to start the game.');
      return;
    }

    this.fileHelperService.createFileWithPlayerData('fleet_state_debug.json');

    if (this.players.every((p) => p.state === 'ready')) {
      this.logger.debug('All players are ready. Starting the game.');

      this.players.forEach((p) => (p.state = 'in-turn'));

      this.currentTurnIndex = Math.floor(Math.random() * this.players.length);

      this.server.emit('gameStart', {
        message: 'All players have placed their fleets. Game starts!',
        firstTurn: this.players[this.currentTurnIndex].id,
      });

      this.logger.debug(
        `Game started successfully. First turn: Player ${
          this.players[this.currentTurnIndex].id
        }.`
      );
    } else {
      this.logger.log('Not all players are ready yet.');
    }
  }

  @SubscribeMessage('attack')
  handleAttack(client: Socket, { x, y }: { x: number; y: number }): void {
    this.logger.debug(
      `Attack received from: ${client.id} at coordinates (${x}, ${y})`
    );
    const currentPlayer = this.players[this.currentTurnIndex];
    const opponent = this.players.find((p) => p.id !== currentPlayer.id);

    if (!opponent) {
      client.emit('error', 'Opponent not found.');
      this.logger.debug('Opponent not found.');
      return;
    }

    if (client.id !== currentPlayer.id) {
      client.emit('error', 'It is not your turn!');
      this.logger.debug(`Invalid turn attempt by: ${client.id}`);
      return;
    }

    const targetCell = opponent.grid.cells[x]?.[y];
    if (!targetCell) {
      client.emit('error', 'Invalid target.');
      this.logger.debug(
        `Invalid target coordinates: (${x}, ${y}) by: ${client.id}`
      );
      return;
    }

    if (targetCell.hit) {
      client.emit('error', 'Cell already targeted.');
      this.logger.debug(`Cell already targeted: (${x}, ${y}) by: ${client.id}`);
      return;
    }

    targetCell.hit = true;
    if (targetCell.occupied) {
      client.emit('attackResult', { x, y, result: 'hit' });
      this.server.to(opponent.id).emit('attacked', { x, y, result: 'hit' });
      this.logger.debug(`Attack result: hit at (${x}, ${y}) by: ${client.id}`);

      if (this.checkAllShipsSunk(opponent)) {
        this.server.emit('gameOver', { winner: currentPlayer.id });
        this.logger.debug(`Game over. Winner: ${currentPlayer.id}`);
        return;
      }
    } else {
      client.emit('attackResult', { x, y, result: 'miss' });
      this.server.to(opponent.id).emit('attacked', { x, y, result: 'miss' });
      this.logger.debug(`Attack result: miss at (${x}, ${y}) by: ${client.id}`);
    }

    this.currentTurnIndex = (this.currentTurnIndex + 1) % 2;
    this.server.emit('turnChange', this.players[this.currentTurnIndex].id);
    this.logger.debug(
      `Turn changed. Next player: ${this.players[this.currentTurnIndex].id}`
    );
  }

  private checkAllShipsSunk(player: Player): boolean {
    const allSunk = player.ships.every((ship) =>
      this.isShipSunk(player.grid, ship)
    );
    this.logger.debug(
      `Check if all ships sunk for player: ${player.id}, result: ${allSunk}`
    );
    return allSunk;
  }

  private isShipSunk(grid: Grid, ship: ShipPlacement): boolean {
    const { x, y, size, orientation } = ship;

    for (let i = 0; i < size; i++) {
      const currentX = orientation === 'horizontal' ? x : x + i;
      const currentY = orientation === 'horizontal' ? y + i : y;

      if (!grid.cells[currentX]?.[currentY]?.hit) {
        return false;
      }
    }
    return true;
  }

  private createEmptyGrid(size: number): Cell[][] {
    let idCounter = 0;
    const grid = Array.from({ length: size }, (_, rowIndex) =>
      Array.from({ length: size }, (_, colIndex) => ({
        id: idCounter++,
        occupied: false,
        hit: false,
      }))
    );
    this.logger.debug('Empty grid created.');
    return grid;
  }
}
