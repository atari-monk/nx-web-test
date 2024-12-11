import { Module } from '@nestjs/common';
import {
  StatusModule,
  ChatModule,
  BattleshipModule,
} from '@nx-web-test/shared-nest';
//StatusModule, ChatModule,
@Module({
  imports: [BattleshipModule],
})
export class AppModule {}
