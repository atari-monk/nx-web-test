export class PlayerService {
  private static instance: PlayerService;
  private playerId: string;

  private constructor() {
    this.playerId = this.getOrGeneratePlayerId();
  }

  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  private getOrGeneratePlayerId(): string {
    const storedId = localStorage.getItem('playerId');
    if (storedId) {
      return storedId;
    }
    const newId = `player-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('playerId', newId);
    return newId;
  }

  public getPlayerId(): string {
    return this.playerId;
  }
}
