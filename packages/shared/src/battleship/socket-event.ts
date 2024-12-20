export enum SocketEvent {
  Connect_Error = 'connect_error',
  Connect_Timeout = 'connect_timeout',
  ConnectionStatus = 'connectionStatus', //local event
  GameMessage = 'gameMessage', //local custom event
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
