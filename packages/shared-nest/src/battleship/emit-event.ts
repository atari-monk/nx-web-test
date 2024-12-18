import { Logger } from '@nestjs/common';
import { ClientEvent, StatusCode, EmitPayload } from '@nx-web-test/shared';
import { Server, Socket } from 'socket.io';

export function emitEvent(
  logger: Logger,
  target: Socket | Server,
  event: ClientEvent,
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
