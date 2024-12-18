import { ClientEvent } from './client-event';

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
  event: ClientEvent;
  message: string;
  data?: T;
  timestamp?: number;
}
