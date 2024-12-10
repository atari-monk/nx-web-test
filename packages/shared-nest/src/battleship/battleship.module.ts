import { Module } from '@nestjs/common';
import { BattleshipGateway } from './battleship-gateway';

@Module({
  providers: [BattleshipGateway],
})
export class BattleshipModule {}
