import { SocketEvent } from '@nx-web-test/shared';
import React, { useState, useEffect } from 'react';

const MessageDisplay: React.FC = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleMessage = (event: any) => {
      console.log('Received message:', event.detail);
      setMessage(event.detail);
    };

    window.addEventListener(SocketEvent.GameMessage, handleMessage);

    return () => {
      window.removeEventListener(SocketEvent.GameMessage, handleMessage);
    };
  }, []);

  return (
    <div
      style={{
        marginTop: '30px',
        padding: '10px',
        border: '1px solid #ccc',
        backgroundColor: '#f9f9f9',
      }}
    >
      <strong>{message}</strong>
    </div>
  );
};

export default MessageDisplay;
