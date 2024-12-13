import { Injectable } from '@nestjs/common';
import { writeFile } from 'fs';
import { GameStateService } from './game-state-service';

@Injectable()
export class FileHelperService {
  constructor(private gameStateService: GameStateService) {}

  createFileWithPlayerData(filename: string): void {
    const playerStates = this.gameStateService.getAllPlayerStates();

    const dataToWrite = JSON.stringify(playerStates, null, 2);

    writeFile(filename, dataToWrite, (err) => {
      if (err) {
        console.error('Error writing file', err);
      } else {
        console.log('File created successfully');
      }
    });
  }
}
