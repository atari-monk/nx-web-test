export class PlayerService {
  private static instance: PlayerService;
  private playerId: string;

  private constructor() {
    this.playerId = this.generatePlayerId();
  }

  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  private generatePlayerId(): string {
    return `player-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getPlayerId(): string {
    return this.playerId;
  }
}
