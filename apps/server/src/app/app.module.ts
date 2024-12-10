import { Module } from '@nestjs/common';
import {
  StatusModule,
  ChatModule,
  BattleshipModule,
} from '@nx-web-test/shared-nest';

@Module({
  imports: [StatusModule, ChatModule, BattleshipModule],
})
export class AppModule {}
