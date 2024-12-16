# Game socket events

In socket-service.ts handle events related to game status

```typescript
import { sendMessage } from './sender';

socket.on('gameReady', (msg) => {
  console.debug('Game ready:', msg);
  sendMessage(`Game ready: ${msg}`);
});

socket.on('fleetPlaced', (playerId) => {
  console.debug('Fleet placed confirmation for playerId:', playerId);
  sendMessage(`Fleet placed: ${playerId}`);
});

socket.on('gameStart', (data) => {
  console.debug('Game start:', data);
  sendMessage(`Game start: ${data.message}, ${data.firstTurn === playerId ? 'Your turn' : 'Wait for your turn'}`);
});

socket.on('turnChange', (nextPlayerId) => {
  console.debug('Turn change:', nextPlayerId);
  sendMessage(`Turn change: ${nextPlayerId === playerId ? 'Your turn' : 'Wait for your turn'}`);
});
```
