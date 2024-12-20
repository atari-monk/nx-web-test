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

1. Client<-SocketEvent.Connect
2. Client->SocketEvent.JoinGame
3. Server<-SocketEvent.JoinGame
4. [if player exist] Server->SocketEvent.ReconnectPlayer (todo: handle it on client)
5. Client<-SocketEvent.ReconnectPlayer
6. [if player new] Server->SocketEvent.Joined
7. Client<-SocketEvent.Joined
8. [if players full] Server->SocketEvent.GameReady
9. Client<-SocketEvent.GameReady
10. Server->SocketEvent.Error
11. Client<-SocketEvent.Error
12. Client->SocketEvent.PlaceFleet
13. Server<-SocketEvent.PlaceFleet
14. Client<-SocketEvent.PlaceFleet
15. Client->SocketEvent.Attack
16. Server<-SocketEvent.Attack
17. Server->SocketEvent.AttackResult
18. Client<-SocketEvent.AttackResult
19. Server->SocketEvent.GameStart
20. Client<-SocketEvent.GameStart
21. Server->SocketEvent.TurnChange
22. Client<-SocketEvent.TurnChange
