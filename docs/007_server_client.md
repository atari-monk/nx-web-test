# Server, Client events

## Server events

### joinGame

client: Socket, data: { playerId: string }

If player alrady existing.  
Updates its socketId.
Loads saved game state.

Emits loadState, joined

loadState

{
grid: savedState.grid,
ships: savedState.ships,
}

joined

{ message: 'Reconnected to the game!' }

Adds new player if < 2

Emits joined { message: 'Joined the game!' }

if 2 players

Emits 'gameReady', 'Both players have joined. Place your fleets!'

> = 2

Emits error 'Game is already full!'

### attack

client: Socket, { x, y }: { x: number; y: number }

```typescript
attack({ x, y }: { x: number; y: number })
{
 this.socket?.emit('attack', { x, y });
}
```
