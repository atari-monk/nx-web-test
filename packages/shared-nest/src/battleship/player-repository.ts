import { Injectable } from '@nestjs/common';
import { Player, Cell, Grid, ShipPlacement } from '@nx-web-test/shared';

@Injectable()
export class PlayerRepository {
  private MAX_PLAYERS = 2;
  private players: Player[] = [];
  private currentTurnIndex = 0;

  getPlayerInTurn() {
    return this.players[this.currentTurnIndex];
  }

  getOpponentPlayer(currentPlayerId: string) {
    return this.players.find((p) => p.id !== currentPlayerId);
  }

  getPlayerById(playerId: string): Player | false {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return false;
    return player;
  }

  getPlayerBySocketId(socketId: string): Player | false {
    const playerIndex = this.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex === -1) return false;
    return this.players[playerIndex];
  }

  removePlayerBySocketId(socketId: string): boolean {
    const index = this.players.findIndex((p) => p.socketId === socketId);
    if (index !== -1) {
      this.players.splice(index, 1);
      return true;
    }
    return false;
  }

  updateSocketId(playerId: string, socketId: string) {
    const existingPlayer = this.getPlayerById(playerId);
    if (!existingPlayer) return false;
    existingPlayer.socketId = socketId;
    return existingPlayer;
  }

  isFull() {
    return this.players.length === this.MAX_PLAYERS;
  }

  isReady() {
    return this.players.every((p) => p.state === 'ready');
  }

  setInTurnState() {
    this.players.forEach((p) => (p.state = 'in-turn'));
  }

  setTurnIndex() {
    this.currentTurnIndex = Math.floor(Math.random() * this.players.length);
  }

  setNextTurnIndex() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % 2;
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

  checkAllShipsSunk(player: Player): boolean {
    const allSunk = player.ships.every((ship) =>
      this.isShipSunk(player.grid, ship)
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
}
