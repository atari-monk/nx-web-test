import { Cell } from '@nx-web-test/shared';
import React, { useState } from 'react';

interface GridProps {
  gridSize: number; // Size of the grid (e.g., 10x10)
}

const GameGrid: React.FC<GridProps> = ({ gridSize }) => {
  const [grid, setGrid] = useState<Cell[][]>(
    Array.from({ length: gridSize }, (_, rowIndex) =>
      Array.from({ length: gridSize }, (_, colIndex) => ({
        id: rowIndex * gridSize + colIndex,
        occupied: false,
      }))
    )
  );

  // Handle click on grid cell to toggle ship placement
  const handleCellClick = (row: number, col: number) => {
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[row][col].occupied = !newGrid[row][col].occupied; // Toggle occupation status
      return newGrid;
    });
  };

  return (
    <div
      className="battleship-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 30px)`,
      }}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={cell.id}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            style={{
              width: '30px',
              height: '30px',
              border: '1px solid #ccc',
              backgroundColor: cell.occupied ? 'blue' : 'white',
              cursor: 'pointer',
            }}
          />
        ))
      )}
    </div>
  );
};

export default GameGrid;
