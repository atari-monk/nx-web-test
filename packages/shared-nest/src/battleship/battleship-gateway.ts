import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Cell, Grid, Player, ShipPlacement } from '@nx-web-test/shared';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins (configure this in production)
  },
})
export class BattleshipGateway {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(BattleshipGateway.name);
  private players: Player[] = [];
  private currentTurnIndex = 0; // Tracks the current player's turn

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
    if (this.players.length < 2) {
      const player: Player = {
        id: client.id,
        grid: { size: 10, cells: this.createEmptyGrid(10) },
        ships: [],
        state: 'placement',
      };
      this.players.push(player);
      client.emit('joined', { message: 'Joined the game!' });
      this.logger.debug(`Player added: ${player.id}`);

      if (this.players.length === 2) {
        this.server.emit(
          'gameReady',
          'Both players have joined. Place your fleets!'
        );
        this.logger.debug('Both players have joined the game.');
      }
    } else {
      client.emit('error', 'Game is already full!');
      this.logger.debug('Game is already full.');
    }
  }

  @SubscribeMessage('placeFleet')
  handlePlaceFleet(client: Socket, fleet: ShipPlacement[]): void {
    this.logger.debug(`Fleet placement received from: ${client.id}`);
    const player = this.players.find((p) => p.id === client.id);

    if (player && player.state === 'placement') {
      player.ships = fleet; // Store the fleet
      player.state = 'ready';
      client.emit('fleetPlaced', 'Fleet placement complete!');
      this.logger.debug(`Fleet placed for player: ${client.id}`);

      this.checkGameReady();
    } else {
      client.emit('error', 'Invalid action or player not found.');
      this.logger.debug(`Fleet placement error for player: ${client.id}`);
    }
  }

  private checkGameReady(): void {
    this.logger.debug('Checking if the game is ready to start.');
    if (this.players.every((p) => p.state === 'ready')) {
      this.players.forEach((p) => (p.state = 'in-turn'));
      this.currentTurnIndex = Math.floor(Math.random() * 2); // Randomly select the first player
      this.server.emit('gameStart', {
        message: 'All players have placed their fleets. Game starts!',
        firstTurn: this.players[this.currentTurnIndex].id,
      });
      this.logger.debug(
        `Game started. First turn: ${this.players[this.currentTurnIndex].id}`
      );
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

    // Switch turns
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
    let idCounter = 0; // Unique ID counter for each cell
    const grid = Array.from({ length: size }, (_, rowIndex) =>
      Array.from({ length: size }, (_, colIndex) => ({
        id: idCounter++, // Assign a unique ID to each cell
        occupied: false,
        hit: false,
      }))
    );
    this.logger.debug('Empty grid created.');
    return grid;
  }
}
