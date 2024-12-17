import React, { useState } from 'react';
import { Cell, Grid } from '@nx-web-test/shared';
import { BattleGridProps } from './battle-grid-props';
import { SocketService } from './socket-service';
import { PlayerService } from './player-service';

const BattleGrid: React.FC<BattleGridProps> = ({ gridSize, onCellClick }) => {
  const playerService = PlayerService.getInstance();
  const socketService = SocketService.getInstance();

  const [grid, setGrid] = useState<Grid>(() => ({
    size: gridSize,
    cells: Array.from({ length: gridSize }, (_, rowIndex) =>
      Array.from({ length: gridSize }, (_, colIndex) => ({
        id: rowIndex * gridSize + colIndex,
        occupied: false,
        hit: false,
      }))
    ),
  }));

  const handleCellClick = (x: number, y: number) => {
    setGrid((prevGrid) => {
      const updatedCells = prevGrid.cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex === x && colIndex === y) {
            socketService.attack(playerService.getPlayerId(), { x, y });
            return { ...cell, hit: true };
          }
          return cell;
        })
      );
      return { ...prevGrid, cells: updatedCells };
    });

    if (onCellClick) {
      onCellClick(x, y);
    }
  };

  const getCellStyle = (cell: Cell) => ({
    width: '30px',
    height: '30px',
    border: '1px solid #ccc',
    backgroundColor: cell.hit ? 'red' : 'white',
    cursor: 'pointer',
  });

  return (
    <div
      className="battle-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 30px)`,
      }}
    >
      {grid.cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={cell.id}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            style={getCellStyle(cell)}
          />
        ))
      )}
    </div>
  );
};

export default BattleGrid;
