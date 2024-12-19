# Server Client Events

## Server events

```typescript
export enum ServerEvent {
  JoinGame = 'joinGame',
  Disconnect = 'disconnect',
  PlaceFleet = 'placeFleet',
  Attack = 'attack',
}
```

## Client events

```typescript
export enum ClientEvent {
  Connect = 'connect',
  ReconnectPlayer = 'reconnectPlayer',
  Joined = 'joined',
  GameReady = 'gameReady',
  GameStart = 'gameStart',
  TurnChange = 'turnChange',
  AttackResult = 'attackResult',
  GameOver = 'gameOver',
  Error = 'error',
}
```

## Communication sequence

1. Client<-ClientEvent.Connect
2. Client->ServerEvent.JoinGame
3. Server<-ServerEvent.JoinGame
4. [if player exist] Server->ClientEvent.ReconnectPlayer (todo: handle it on client)
5. Client<-ClientEvent.ReconnectPlayer
6. [if player new] Server->ClientEvent.Joined
7. Client<-ClientEvent.Joined
8. [if players full] Server->ClientEvent.GameReady
9. Client<-ClientEvent.GameReady
10. Server->ClientEvent.Error
11. Client<-ClientEvent.Error
12. Client->ClientEvent.PlaceFleet
13. Server<-ClientEvent.PlaceFleet
