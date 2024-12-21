# Reconnection issue

## Player Id fix

### Current player-service.ts

This is used to generate player id.  
When player refreshed browser id is generated anew.  
I want same id to be able to identiffy client.  
What are my options ?
Just give me code with short description.

```typescript
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
```

### Proposed player-service.ts

To persist the player ID across browser refreshes, you can use the browser's `localStorage`.  
This essentially doesn't get removed unless user removes browser data or in code.
Here's the updated code:

#### Updated Code

```typescript
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
```

#### Description

- The `getOrGeneratePlayerId` method checks if a `playerId` exists in `localStorage`.
- If found, it uses the existing ID; otherwise, it generates a new one and stores it in `localStorage`.
- This ensures the same ID persists across browser refreshes.

### Result

This enabled reconnectPlayer to run on client connect event.  
Next it should be handled on client.

```typescript
private reconnectPlayer(client: Socket, playerId: string) {
    const existingPlayer = this.playerRepository.updateSocketId(
      playerId,
      client.id
    );
    if (!existingPlayer) return false;

    emitEvent(
      this.logger,
      client,
      SocketEvent.ReconnectPlayer,
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
```

## Handle SocketEvent.ReconnectPlayer on client.

