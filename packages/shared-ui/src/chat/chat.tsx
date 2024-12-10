import { Message } from '@nx-web-test/shared';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const Chat: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState('general');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:3333');
    setSocket(newSocket);

    newSocket.on('receive_message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      newSocket?.off('receive_message');
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (room.trim()) {
      socket?.emit('join_room', room);
    }
  };

  const sendMessage = () => {
    if (message.trim() && username.trim()) {
      const messageData: Message = {
        sender: username,
        message,
        timestamp: new Date().toISOString(),
      };
      socket?.emit('send_message', { room, ...messageData });
      setMessage('');
    }
  };

  return (
    <div>
      <div>
        <p>
          <strong>Chat</strong>
          <input
            style={{
              marginLeft: '10px',
              width: '130px',
            }}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          <input
            style={{
              marginLeft: '10px',
              width: '110px',
              display: 'none',
            }}
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Room name"
          />
          <button
            onClick={joinRoom}
            style={{
              marginRight: '10px',
            }}
          >
            Join
          </button>
        </p>
      </div>
      <div>
        <p></p>
      </div>
      <div>
        <input
          style={{
            width: '300px',
          }}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '5px',
            padding: '10px',
            height: '100px',
            maxWidth: '800px',
            overflowY: 'scroll',
            marginTop: '20px',
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {messages.map((msg, index) => {
              const formattedTime = new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }).format(new Date(msg.timestamp));

              return (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <em>{formattedTime} </em>
                  <strong>{msg.sender}:</strong> {msg.message}{' '}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Chat;
