import { Module } from '@nestjs/common';
import { BattleshipGateway } from './battleship-gateway';
import { GameStateService } from './game-state-service';
import { FileHelperService } from './file-helper-service';

@Module({
  providers: [BattleshipGateway, GameStateService, FileHelperService],
})
export class BattleshipModule {}
