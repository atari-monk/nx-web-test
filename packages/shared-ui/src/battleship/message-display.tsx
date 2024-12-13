import React, { useState, useEffect } from 'react';

const MessageDisplay: React.FC = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleMessage = (newMessage: string) => {
      setMessage(newMessage);
    };

    window.addEventListener('gameMessage', (event: any) =>
      handleMessage(event.detail)
    );

    return () => {
      window.removeEventListener('gameMessage', (event: any) =>
        handleMessage(event.detail)
      );
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
