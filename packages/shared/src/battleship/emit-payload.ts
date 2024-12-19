import { SocketEvent } from './socket-event';
import { ServerEvent } from './server-event';
import { StatusCode } from './status-code';

export interface EmitPayload<T = any> {
  status: StatusCode;
  event: SocketEvent | ServerEvent;
  ids: { playerId: string; socketId: string };
  message: string;
  data?: T;
  timestamp?: number;
}
