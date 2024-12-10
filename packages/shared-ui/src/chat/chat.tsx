import { Message } from '@nx-web-test/shared';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const Chat: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]); // Use the Message model for messages
  const [room, setRoom] = useState('general');
  const [username, setUsername] = useState(''); // Add a username state

  useEffect(() => {
    // Connect to the backend socket
    const newSocket = io('http://localhost:3333'); // Replace with your backend URL
    setSocket(newSocket);

    // Listen for incoming messages
    newSocket.on('receive_message', (data: Message) => {
      console.debug('Received message:', data);
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
      <h3>Chat Room: {room}</h3>
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
      </div>
      <div>
        <input
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room name"
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h4>Messages:</h4>
        <ul>
          {messages.map((msg, index) => {
            const formattedTime = new Intl.DateTimeFormat('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(new Date(msg.timestamp));

            return (
              <li key={index}>
                <strong>{msg.sender}:</strong> {msg.message}{' '}
                <em>({formattedTime})</em>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Chat;
