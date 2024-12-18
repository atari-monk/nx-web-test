import { Module } from '@nestjs/common';
import { GameStateService } from './game-state-service';
import { FileHelperService } from './file-helper-service';
import { BattleshipGateway } from './battleship-gateway';
import { PlayerService } from './player-service';
import { PlayerRepository } from './player-repository';

@Module({
  providers: [
    BattleshipGateway,
    PlayerRepository,
    PlayerService,
    GameStateService,
    FileHelperService,
  ],
})
export class BattleshipModule {}
