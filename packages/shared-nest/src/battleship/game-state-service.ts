import { Injectable } from '@nestjs/common';
import { Cell, ShipPlacement } from '@nx-web-test/shared';

@Injectable()
export class GameStateService {
  private playerData = new Map<
    string,
    { grid: Cell[][]; ships: ShipPlacement[] }
  >();

  savePlayerState(
    playerId: string,
    grid: Cell[][],
    ships: ShipPlacement[]
  ): void {
    this.playerData.set(playerId, { grid, ships });
  }

  getPlayerState(playerId: string) {
    return this.playerData.get(playerId);
  }

  getAllPlayerStates() {
    return Array.from(this.playerData.entries());
  }

  deletePlayerState(playerId: string): void {
    this.playerData.delete(playerId);
  }
}
