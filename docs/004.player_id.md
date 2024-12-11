## **Q** Problem with this setup is when i refresh brwser it connecs again and i have 2 players on the server despite only one client

This issue arises because the client creates a new WebSocket connection every time it refreshes, causing the server to treat the new connection as a distinct player. To resolve this, you can implement a mechanism to handle reconnections and ensure that each player is uniquely identified. Here's how to approach this:

---

### **1. Use a Persistent Player Identifier (e.g., `localStorage` on the Client Side):**

Store a unique identifier for each player in the client's `localStorage`. This allows the client to re-authenticate itself to the server after a refresh.

#### Client-Side Update

Modify the client to check `localStorage` for an existing player ID before creating a new one:

```typescript
useEffect(() => {
  const playerId = localStorage.getItem('playerId') || generatePlayerId();
  localStorage.setItem('playerId', playerId);

  const newSocket = io('http://localhost:3333', {
    query: { playerId },
  });

  newSocket.on('connect', () => {
    console.debug('Connected to the server');
    newSocket.emit('joinGame', { playerId });
  });

  setSocket(newSocket);

  return () => {
    newSocket.disconnect();
  };
}, []);

function generatePlayerId(): string {
  return `player-${Math.random().toString(36).substring(2, 15)}`;
}
```

---

### **2. Handle Reconnection Logic on the Server**

When a client reconnects, the server should verify whether the player ID already exists in the current list of players. If it does, it should update the player's socket ID instead of adding a new player.

#### Server-Side Update

Update the `handleJoinGame` method to account for reconnecting clients:

```typescript
@SubscribeMessage('joinGame')
handleJoinGame(client: Socket, data: { playerId: string }): void {
  const { playerId } = data;
  this.logger.debug(`Client connected: ${client.id} with playerId: ${playerId}`);

  // Check if the player already exists
  const existingPlayer = this.players.find((p) => p.id === playerId);

  if (existingPlayer) {
    // Update the socket ID for the existing player
    existingPlayer.socketId = client.id;
    client.emit('joined', { message: 'Reconnected to the game!' });
    this.logger.debug(`Player reconnected: ${playerId}`);
    return;
  }

  if (this.players.length < 2) {
    const player: Player = {
      id: playerId,
      socketId: client.id,
      grid: { size: 10, cells: this.createEmptyGrid(10) },
      ships: [],
      state: 'placement',
    };
    this.players.push(player);
    client.emit('joined', { message: 'Joined the game!' });
    this.logger.debug(`Player added: ${player.id}`);

    if (this.players.length === 2) {
      this.server.emit(
        'gameReady',
        'Both players have joined. Place your fleets!'
      );
      this.logger.debug('Both players have joined the game.');
    }
  } else {
    client.emit('error', 'Game is already full!');
    this.logger.debug('Game is already full.');
  }
}
```

---

### **3. Handle Disconnections Gracefully**

If a player disconnects (e.g., closes the browser), you can provide a grace period to allow reconnection:

```typescript
@SubscribeMessage('disconnect')
handleDisconnect(client: Socket): void {
  const playerIndex = this.players.findIndex((p) => p.socketId === client.id);
  if (playerIndex !== -1) {
    const player = this.players[playerIndex];
    this.logger.debug(`Player disconnected: ${player.id}`);

    // Optionally, remove the player if they don't reconnect within a grace period
    setTimeout(() => {
      const stillDisconnected = !this.players.find((p) => p.socketId === client.id);
      if (stillDisconnected) {
        this.players.splice(playerIndex, 1);
        this.logger.debug(`Player removed after grace period: ${player.id}`);
      }
    }, 30000); // 30 seconds grace period
  }
}
```

---

### **Benefits of this Setup**

1. **Persistent Identity:** Players retain their unique identity across browser refreshes.
2. **Reconnection Support:** Disconnected players can rejoin without disrupting the game.
3. **Graceful Handling of Edge Cases:** Disconnections or browser refreshes do not result in duplicate players.

This approach ensures a robust connection-handling mechanism for your game.
