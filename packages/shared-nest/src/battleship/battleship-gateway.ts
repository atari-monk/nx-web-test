import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Grid, Player, ShipPlacement } from '@nx-web-test/shared';

@WebSocketGateway()
export class BattleshipGateway {
  @WebSocketServer()
  server!: Server;

  private players: Player[] = []; // Store players and their ship data

  @SubscribeMessage('placeShip')
  handlePlaceShip(client: Socket, payload: ShipPlacement): void {
    const player = this.players.find((p) => p.id === client.id);

    if (player) {
      if (this.canPlaceShip(player.grid, payload)) {
        // Mark the cells as occupied
        for (let i = 0; i < payload.size; i++) {
          const x =
            payload.orientation === 'horizontal' ? payload.x : payload.x + i;
          const y =
            payload.orientation === 'horizontal' ? payload.y + i : payload.y;

          if (player.grid.cells[x] && player.grid.cells[x][y]) {
            player.grid.cells[x][y].occupied = true;
          }
        }

        player.ships.push(payload); // Add the ship to the player's list
        this.server.emit('shipPlaced', payload); // Notify other clients
      } else {
        client.emit('error', 'Invalid ship placement');
      }
    }
  }

  private canPlaceShip(grid: Grid, ship: ShipPlacement): boolean {
    const { x, y, size, orientation } = ship;

    // Check boundaries
    if (
      (orientation === 'horizontal' && y + size > grid.size) ||
      (orientation === 'vertical' && x + size > grid.size)
    ) {
      return false;
    }

    // Check for overlaps
    for (let i = 0; i < size; i++) {
      const currentX = orientation === 'horizontal' ? x : x + i;
      const currentY = orientation === 'horizontal' ? y + i : y;

      if (grid.cells[currentX] && grid.cells[currentX][currentY]?.occupied) {
        return false;
      }
    }

    return true;
  }

  @SubscribeMessage('placeFleet')
  handlePlaceFleet(client: Socket, fleet: ShipPlacement[]): void {
    const player = this.players.find((p) => p.id === client.id);

    if (player) {
      player.ships = fleet; // Store the fleet
      this.checkGameReady();
    }
  }

  private checkGameReady(): void {
    if (this.players.every((p) => p.ships.length > 0)) {
      this.server.emit('gameStart', 'All players have placed their fleets!');
    }
  }
}
