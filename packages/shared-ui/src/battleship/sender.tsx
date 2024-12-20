import { SocketEvent } from '@nx-web-test/shared';

export const sendMessage = (message: string) => {
  console.log('Sending message:', message);
  const event = new CustomEvent(SocketEvent.GameMessage, { detail: message });
  window.dispatchEvent(event);
};
