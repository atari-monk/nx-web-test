import { ClientEvent } from './client-event';
import { ServerEvent } from './server-event';
import { StatusCode } from './status-code';

export interface EmitPayload<T = any> {
  status: StatusCode;
  event: ClientEvent | ServerEvent;
  ids: { playerId: string; socketId: string };
  message: string;
  data?: T;
  timestamp?: number;
}
