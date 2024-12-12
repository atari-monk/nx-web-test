export class PlayerService {
  private playerId: string;

  constructor() {
    this.playerId = this.initializePlayerId();
  }

  private initializePlayerId(): string {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) return storedPlayerId;

    const newPlayerId = `player-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('playerId', newPlayerId);
    return newPlayerId;
  }

  getPlayerId(): string {
    return this.playerId;
  }
}
