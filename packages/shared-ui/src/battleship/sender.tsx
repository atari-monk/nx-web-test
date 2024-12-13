export const sendMessage = (message: string) => {
  const event = new CustomEvent('gameMessage', { detail: message });
  window.dispatchEvent(event);
};
