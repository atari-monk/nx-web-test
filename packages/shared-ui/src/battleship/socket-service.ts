import {
  SocketEvent,
  EmitPayload,
  Grid,
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

    socket.on(SocketEvent.Connect, () => {
      emitEvent(
        console,
        socket,
        SocketEvent.JoinGame,
        { playerId, socketId: socket.id ?? '' },
        StatusCode.OK,
        'Client connecting to the server'
      );
      console.debug('Sending Join Game');
    });

    socket.on(SocketEvent.ReconnectPlayer, (payload: EmitPayload) => {
      const {
        ids: { playerId, socketId },
      } = payload;
      console.debug(`Player ${playerId} on socket ${socketId} Reconnect`);
    });

    socket.on(SocketEvent.Joined, (payload: EmitPayload) => {
      const {
        ids: { playerId, socketId },
      } = payload;
      console.debug(`Player ${playerId} on socket ${socketId} Joined`);
    });

    socket.on(SocketEvent.GameReady, (payload: EmitPayload) => {
      const { message } = payload;
      console.debug('Game ready:', message);
      sendMessage(`Game ready: ${message}`);
    });

    socket.on(SocketEvent.Error, (payload: EmitPayload) => {
      const { message } = payload;
      console.debug('Error:', message);
      sendMessage(`Error: ${message}`);
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

  placeFleet(playerId: string, data: { grid: Grid; fleet: ShipPlacement[] }) {
    this.socket?.emit('placeFleet', data);
    emitEvent(
      console,
      this.socket,
      SocketEvent.PlaceFleet,
      { playerId: playerId, socketId: this.socket.id ?? '' },
      StatusCode.OK,
      'Fleet placing',
      data
    );
  }

  attack(playerId: string, { x, y }: { x: number; y: number }) {
    this.socket?.emit('attack', { playerId, coords: { x, y } });
  }
}
