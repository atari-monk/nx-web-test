import { Grid, ShipPlacement } from '@nx-web-test/shared';
import { io, Socket } from 'socket.io-client';
import { PlayerService } from './player-service';

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

    socket.on('connect', () => {
      console.debug('Connected to the server');
      socket.emit('joinGame', { playerId });
    });

    // Setup event listeners for various events
    const events = [
      'joined',
      'gameReady',
      'fleetPlaced',
      'gameStart',
      'attackResult',
      'attacked',
      'turnChange',
      'gameOver',
      'error',
    ];

    events.forEach((event) => {
      socket.on(event, (data) => {
        console.debug(`Event received: ${event}`, data);
      });
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
}
