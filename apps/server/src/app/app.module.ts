import { Module } from '@nestjs/common';
import { ChatGateway, ChatService } from '@nx-web-test/shared-nest';

@Module({
  providers: [ChatGateway, ChatService],
})
export class AppModule {}
