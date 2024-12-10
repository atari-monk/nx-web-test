import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Grid, Player, ShipPlacement } from '@nx-web-test/shared';

@WebSocketGateway()
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  private players: Player[] = []; // Store players and their ship data

  @SubscribeMessage('placeShip')
  handlePlaceShip(client: Socket, payload: ShipPlacement): void {
    const player = this.players.find((p) => p.id === client.id);

    if (player) {
      // Check if the ship can be placed on the grid (add validation logic here)
      if (this.canPlaceShip(player.grid, payload)) {
        player.ships.push(payload); // Add the ship to the player's ship list
        this.server.emit('shipPlaced', payload); // Notify other players
      } else {
        client.emit('error', 'Invalid ship placement');
      }
    }
  }

  private canPlaceShip(grid: Grid, ship: ShipPlacement): boolean {
    // Logic for validating if a ship can be placed (e.g., no overlap, within grid bounds)
    return true;
  }
}
