import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketStatusProps {
  socketUrl: string;
}

const SocketStatus: React.FC<SocketStatusProps> = ({ socketUrl }) => {
  const [message, setMessage] = useState<string>('Connecting...');

  useEffect(() => {
    const socket: Socket = io(socketUrl, {
      transports: ['websocket'], // Force WebSocket
      reconnectionAttempts: 5, // Retry 5 times
      timeout: 5000, // Timeout for connection
    });

    socket.on('connect', () => {
      const connectionMessage =
        process.env.NODE_ENV === 'production'
          ? 'Connected to the server'
          : `Connected to the server. Socket id = ${socket.id}`;
      setMessage(connectionMessage);
    });

    socket.on('connect_error', (err) => {
      setMessage('Unable to connect to the server. Retrying...');
      console.warn('Socket connection error:', err.message);
    });

    socket.on('disconnect', () => {
      setMessage('Disconnected from the server');
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl]);

  return (
    <div>
      <p>Connection Status: {message}</p>
    </div>
  );
};

export default SocketStatus;
