import {
  ClientEvent,
  Grid,
  ServerEvent,
  ShipPlacement,
  StatusCode,
} from '@nx-web-test/shared';
import { io, Socket } from 'socket.io-client';
import { PlayerService } from './player-service';
import { sendMessage } from './sender';
import { emitEvent } from './emit-event';

export class SocketService {
  private static instance: SocketService;
  private socket: Socket;

  private constructor(serverUrl: string, playerId: string) {
    this.socket = this.connectToServer(serverUrl, playerId);
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      const playerService = PlayerService.getInstance();
      SocketService.instance = new SocketService(
        'http://localhost:3333',
        playerService.getPlayerId()
      );
    }
    return SocketService.instance;
  }

  private connectToServer(serverUrl: string, playerId: string): Socket {
    const socket = io(serverUrl, {
      query: { playerId },
    });

    socket.on(ClientEvent.Connect, () => {
      emitEvent(
        console,
        socket,
        ServerEvent.JoinGame,
        { playerId, socketId: socket.id ?? '' },
        StatusCode.OK,
        'Client connecting to the server'
      );
    });

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
      sendMessage(
        `Game start: ${data.message}, ${
          data.firstTurn === playerId ? 'Your turn' : 'Wait for your turn'
        }`
      );
    });

    socket.on('turnChange', (nextPlayerId) => {
      console.debug('Turn change:', nextPlayerId);
      sendMessage(
        `Turn change: ${
          nextPlayerId === playerId ? 'Your turn' : 'Wait for your turn'
        }`
      );
    });

    return socket;
  }

  getSocket(): Socket {
    return this.socket;
  }

  disconnect() {
    this.socket.disconnect();
  }

  placeFleet(data: { playerId: string; grid: Grid; fleet: ShipPlacement[] }) {
    this.socket?.emit('placeFleet', data);
  }

  attack(playerId: string, { x, y }: { x: number; y: number }) {
    this.socket?.emit('attack', { playerId, coords: { x, y } });
  }
}
