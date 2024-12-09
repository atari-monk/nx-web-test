# Chat

This is base for chat with socket-io.

## 0. Install libs in root of monorepo

```bash
"@nestjs/platform-socket.io": "^10.4.15",
```

```bash
"@nestjs/websockets": "^10.4.15",
```

## 1. Add model to ts lib

```typescript
export interface Message {
    sender: string;
    message: string;
    timestamp: Date;
}

export interface RoomMessages {
    [room: string]: Message[];
}
```

Export from lib.

```typescript
export * from "./chat/models";
```

## 2. Add to nest server

chat.service.ts

```typescript
import { Injectable } from "@nestjs/common";
import { Message, RoomMessages } from "@nx-web-test/shared";

@Injectable()
export class ChatService {
    private clients: Set<string> = new Set();
    private messages: RoomMessages = {};

    addClient(clientId: string): void {
        this.clients.add(clientId);
    }

    removeClient(clientId: string): void {
        this.clients.delete(clientId);
    }

    logMessage(room: string, sender: string, message: string): void {
        if (!this.messages[room]) {
            this.messages[room] = [];
        }
        this.messages[room].push({ sender, message, timestamp: new Date() });
    }

    getMessages(room: string): Message[] {
        return this.messages[room] || [];
    }
}
```

chat.gateway.ts

```typescript
import { Logger } from "@nestjs/common";
import {
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
    SubscribeMessage,
} from "@nestjs/websockets";
import { ChatService } from "./chat.service";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: "*", // Allow all origins (configure this in production)
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server!: Server;

    private logger = new Logger(ChatGateway.name);

    constructor(private readonly chatService: ChatService) {}

    handleConnection(client: Socket): void {
        this.logger.log(`Client connected: ${client.id}`);
        this.chatService.addClient(client.id);
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.chatService.removeClient(client.id);
    }

    @SubscribeMessage("send_message")
    handleSendMessage(
        client: Socket,
        payload: { room: string; message: string; sender: string }
    ): void {
        const { room, message, sender } = payload;

        this.logger.log(
            `Message received: ${message} from ${sender} (room: ${room})`
        );
        this.server.to(room).emit("receive_message", { message, sender });

        this.chatService.logMessage(room, sender, message);
    }

    @SubscribeMessage("join_room")
    handleJoinRoom(client: Socket, room: string): void {
        client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        client.emit("joined_room", room);
    }

    @SubscribeMessage("leave_room")
    handleLeaveRoom(client: Socket, room: string): void {
        client.leave(room);
        this.logger.log(`Client ${client.id} left room ${room}`);
        client.emit("left_room", room);
    }
}
```

Export from lib.

```typescript
export { ChatService } from "./chat/chat.service";
export { ChatGateway } from "./chat/chat.gateway";
```

Use them as providers in app.module.ts or chat.module.ts

```typescript
import { Module } from "@nestjs/common";
import { ChatGateway, ChatService } from "@nx-web-test/shared-nest";

@Module({
    providers: [ChatGateway, ChatService],
})
export class AppModule {}
```

## 3. Add chat component to react lib

chat.tsx

```typescript
import { Message } from "@nx-web-test/shared";
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const Chat: React.FC = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]); // Use the Message model for messages
    const [room, setRoom] = useState("general");
    const [username, setUsername] = useState(""); // Add a username state

    useEffect(() => {
        // Connect to the backend socket
        const newSocket = io("http://localhost:3333"); // Replace with your backend URL
        setSocket(newSocket);

        // Listen for incoming messages
        newSocket.on("receive_message", (data: Message) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const joinRoom = () => {
        if (room.trim()) {
            socket?.emit("join_room", room);
        }
    };

    const sendMessage = () => {
        if (message.trim() && username.trim()) {
            const messageData: Message = {
                sender: username,
                message,
                timestamp: new Date(),
            };
            socket?.emit("send_message", { room, ...messageData });
            setMessage("");
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
                    {messages.map((msg, index) => (
                        <li key={index}>
                            <strong>{msg.sender}:</strong> {msg.message}{" "}
                            <em>
                                ({new Date(msg.timestamp).toLocaleTimeString()})
                            </em>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Chat;
```

Export from lib.

```typescript
export { default as Chat } from "./chat/chat";
```

Use it in app.tsx

```typescript
<Chat />
```
