export enum SocketEvent {
  Connect = 'connect',
  JoinGame = 'joinGame',
  ReconnectPlayer = 'reconnectPlayer',
  Joined = 'joined',
  Disconnect = 'disconnect',
  GameReady = 'gameReady',
  GameStart = 'gameStart',
  PlaceFleet = 'placeFleet',
  Attack = 'attack',
  TurnChange = 'turnChange',
  AttackResult = 'attackResult',
  GameOver = 'gameOver',
  Error = 'error',
}
