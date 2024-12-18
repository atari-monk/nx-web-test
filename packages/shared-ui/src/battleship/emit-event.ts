import {
  ClientEvent,
  StatusCode,
  EmitPayload,
  ServerEvent,
} from '@nx-web-test/shared';
import { Socket } from 'socket.io-client';

export function emitEvent(
  console: Console,
  target: Socket,
  event: ClientEvent | ServerEvent,
  ids: { playerId: string; socketId: string },
  status: StatusCode,
  message: string,
  data?: any
) {
  const payload: EmitPayload = {
    status,
    event,
    ids,
    message,
    data,
    timestamp: Date.now(),
  };

  if (target instanceof Socket) {
    target.emit(event, payload);
  }

  console.debug(
    `${event}: ${message} for player ${ids.playerId} on socket ${ids.socketId}`
  );
}
