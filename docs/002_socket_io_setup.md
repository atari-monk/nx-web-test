# Setup socket.io

## 1. Install on monorepo root

```bash
npm install socket.io-client
```

```bash
npm install socket.io
```

## 2. Setup ts nest server main.ts

```typescript
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as socketIo from 'socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const server = app.getHttpServer();
  const io = new socketIo.Server(server, {
    cors: {
      origin: 'http://localhost:4200',
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected. Socket id = ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Client disconnected. Socket id = ${socket.id}`);
    });
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
```

## 3. Setup react component in react lib

```typescript
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
      const connectionMessage = process.env.NODE_ENV === 'production' ? 'Connected to the server' : `Connected to the server. Socket id = ${socket.id}`;
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
```

## 4. Setup export from lib in index.ts

```typescript
export { default as SocketStatus } from './lib/socket-status';
```

## 5. Use component in react client app.tsx

```typescript
import { SocketStatus } from '@nx-web-test/shared-ui';

export function App() {
  return (
    <div>
      <style jsx>{`
        /** your style here **/
      `}</style>
      <SocketStatus socketUrl="http://localhost:3333" />
    </div>
  );
}

export default App;
```
