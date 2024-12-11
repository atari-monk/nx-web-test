import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Cell, ShipPlacement } from '@nx-web-test/shared';

interface GridProps {
  gridSize: number;
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

  const [socket, setSocket] = useState<Socket | null>(null);
  const [fleet, setFleet] = useState<ShipPlacement[]>([]);
  const [currentShip, setCurrentShip] = useState({
    name: 'Frigate',
    size: 2,
  });
  const [selectedCells, setSelectedCells] = useState<
    { x: number; y: number }[]
  >([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isFleetCompleted, setIsFleetCompleted] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3333'); // Replace with your server URL
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCellClick = (x: number, y: number) => {
    setSelectedCells((prev) => {
      const isAlreadySelected = prev.some(
        (cell) => cell.x === x && cell.y === y
      );

      if (isAlreadySelected) {
        // Deselect the cell
        return prev.filter((cell) => cell.x !== x || cell.y !== y);
      } else {
        // Validate the single cell before adding it
        if (!isCellPlacementValid(x, y)) {
          setStatusMessage(
            'Invalid placement. Cell is too close to another ship!'
          );
          return prev;
        }

        const newSelection = [...prev, { x, y }];

        // Check if full ship is placed
        if (newSelection.length === currentShip.size) {
          const isValid = validatePlacement(newSelection);
          if (isValid) {
            setGrid((prevGrid) => {
              const newGrid = prevGrid.map((row) =>
                row.map((cell) => ({ ...cell }))
              );
              newSelection.forEach(({ x, y }) => {
                newGrid[x][y].occupied = true;
              });
              return newGrid;
            });

            setFleet((prevFleet) => {
              const updatedFleet = [
                ...prevFleet,
                {
                  x: newSelection[0].x,
                  y: newSelection[0].y,
                  shipType: currentShip.name,
                  size: currentShip.size,
                  orientation:
                    newSelection[0].x === newSelection[1].x
                      ? 'horizontal'
                      : 'vertical',
                },
              ];

              const nextShip = shipList[updatedFleet.length];
              if (nextShip) {
                setCurrentShip(nextShip);
                setStatusMessage('');
              } else {
                setStatusMessage('Fleet completed! Sending to server...');
                socket?.emit('placeFleet', updatedFleet);
              }

              return updatedFleet;
            });

            setSelectedCells([]);
          } else {
            setStatusMessage('Invalid placement. Try again!');
            return [];
          }
        }

        return newSelection;
      }
    });
  };

  // Check if a single cell placement is valid
  const isCellPlacementValid = (x: number, y: number): boolean => {
    const adjacentCells = [
      { x: x - 1, y: y - 1 },
      { x: x - 1, y },
      { x: x - 1, y: y + 1 },
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x + 1, y: y - 1 },
      { x: x + 1, y },
      { x: x + 1, y: y + 1 },
    ];

    return adjacentCells.every(
      ({ x: adjX, y: adjY }) =>
        adjX < 0 ||
        adjX >= grid.length ||
        adjY < 0 ||
        adjY >= grid[0].length ||
        !grid[adjX][adjY].occupied
    );
  };

  const validatePlacement = (
    selection: { x: number; y: number }[]
  ): boolean => {
    const { size } = currentShip;

    // Ensure all cells are in the same row or column
    const allInRow = selection.every((cell) => cell.x === selection[0].x);
    const allInColumn = selection.every((cell) => cell.y === selection[0].y);
    if (!allInRow && !allInColumn) return false;

    // Ensure cells are contiguous
    const sorted = [...selection].sort((a, b) =>
      allInRow ? a.y - b.y : a.x - b.x
    );
    for (let i = 0; i < size - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      if (
        (allInRow && next.y !== curr.y + 1) ||
        (allInColumn && next.x !== curr.x + 1)
      ) {
        return false;
      }
    }

    // Ensure no adjacent cells (including diagonals) are occupied
    const isAdjacentOccupied = selection.some(({ x, y }) => {
      const adjacentCells = [
        { x: x - 1, y: y - 1 },
        { x: x - 1, y },
        { x: x - 1, y: y + 1 },
        { x, y: y - 1 },
        { x, y: y + 1 },
        { x: x + 1, y: y - 1 },
        { x: x + 1, y },
        { x: x + 1, y: y + 1 },
      ];

      return adjacentCells.some(
        ({ x: adjX, y: adjY }) =>
          adjX >= 0 &&
          adjX < grid.length &&
          adjY >= 0 &&
          adjY < grid[0].length &&
          grid[adjX][adjY].occupied
      );
    });

    return !isAdjacentOccupied;
  };

  useEffect(() => {
    if (fleet.length === 5) {
      // Assuming 5 ships complete the fleet
      setIsFleetCompleted(true);
      setStatusMessage('Fleet completed! Sending to server...');
      socket?.emit('placeFleet', fleet);
    }
  }, [fleet, socket]);

  const shipList = [
    { name: 'Frigate', size: 2 },
    { name: 'Destroyer', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Battleship', size: 4 },
    { name: 'Carrier', size: 5 },
  ];

  return (
    <div>
      <h2>
        Place your {currentShip.name} ({currentShip.size}x1) | {statusMessage}
      </h2>
      <div
        className="battleship-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 30px)`,
          pointerEvents: isFleetCompleted ? 'none' : 'auto',
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
                backgroundColor: cell.occupied
                  ? 'blue'
                  : selectedCells.some(
                      (sel) => sel.x === rowIndex && sel.y === colIndex
                    )
                  ? 'lightblue'
                  : 'white',
                cursor: 'pointer',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GameGrid;
