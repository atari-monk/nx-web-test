import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export enum EmitEvent {
  ReconnectPlayer = 'reconnectPlayer',
  Joined = 'joined',
  GameReady = 'gameReady',
  GameStart = 'gameStart',
  TurnChange = 'turnChange',
  AttackResult = 'attackResult',
  GameOver = 'gameOver',
  Error = 'error',
}

export enum StatusCode {
  OK = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
  ServiceUnavailable = 503,
}

export interface EmitPayload<T = any> {
  status: StatusCode;
  event: EmitEvent;
  message: string;
  data?: T;
  timestamp?: number;
}

export function emitEvent(
  logger: Logger,
  target: Socket | Server,
  event: EmitEvent,
  ids: { playerId: string; socketId: string },
  status: StatusCode,
  message: string,
  data?: any,
  opponentId?: string
) {
  const payload: EmitPayload = {
    status,
    event,
    message,
    data,
    timestamp: Date.now(),
  };

  if (target instanceof Socket) {
    target.emit(event, payload);
  } else if (target instanceof Server) {
    if (opponentId) {
      target.to(opponentId).emit(event, payload);
    } else {
      target.emit(event, payload);
    }
  }

  logger.debug(
    `${event}: ${message} for player ${ids.playerId} on socket ${ids.socketId}`
  );
}
