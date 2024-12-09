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
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
