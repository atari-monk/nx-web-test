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
