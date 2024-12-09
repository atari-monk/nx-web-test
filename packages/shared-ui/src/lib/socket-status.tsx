import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketStatusProps {
  socketUrl: string;
}

const SocketStatus: React.FC<SocketStatusProps> = ({ socketUrl }) => {
  const [message, setMessage] = useState<string>('Connecting...');

  useEffect(() => {
    const socket: Socket = io(socketUrl);

    socket.on('connect', () => {
      const connectionMessage =
        process.env.NODE_ENV === 'production'
          ? 'Connected to the server'
          : `Connected to the server. Socket id = ${socket.id}`;
      setMessage(connectionMessage);
    });

    socket.on('connect_error', () => {
      setMessage('Unable to connect to the server');
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [socketUrl]);

  return (
    <div>
      <h3>Connection Status: {message}</h3>
    </div>
  );
};

export default SocketStatus;
