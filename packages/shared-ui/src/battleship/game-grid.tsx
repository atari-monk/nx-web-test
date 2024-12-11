import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameManager } from './game-manager';

interface GridProps {
  gridSize: number;
}

const GameGrid: React.FC<GridProps> = ({ gridSize }) => {
  const [gameManager] = useState(() => new GameManager(gridSize));
  const [grid, setGrid] = useState(gameManager.getGrid());
  const [fleetCompleted, setFleetCompleted] = useState(false);
  const [selectedCells, setSelectedCells] = useState<
    { x: number; y: number }[]
  >([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hoveredCells, setHoveredCells] = useState<{ x: number; y: number }[]>(
    []
  );

  useEffect(() => {
    const newSocket = io('http://localhost:3333');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCellClick = (x: number, y: number) => {
    const isAlreadySelected = selectedCells.some(
      (cell) => cell.x === x && cell.y === y
    );

    if (isAlreadySelected) {
      setSelectedCells((prev) =>
        prev.filter((cell) => cell.x !== x || cell.y !== y)
      );
    } else {
      const newSelection = [...selectedCells, { x, y }];
      if (newSelection.length === gameManager.getCurrentShip().size) {
        const isValid = gameManager.placeShip(newSelection);
        if (isValid) {
          setGrid(gameManager.getGrid());
          setSelectedCells([]);
          setStatusMessage('');
          if (gameManager.isFleetCompleted()) {
            setFleetCompleted(true);
            setStatusMessage('Fleet completed! Sending to server...');
            socket?.emit('placeFleet', gameManager.getFleet());
          }
        } else {
          setStatusMessage('Invalid placement. Try again!');
        }
      } else {
        setSelectedCells(newSelection);
      }
    }
  };

  const handleMouseOver = (x: number, y: number) => {
    const currentShip = gameManager.getCurrentShip();
    const previewCells = gameManager.getShipPlacementPreview(
      x,
      y,
      currentShip.size
    );

    setHoveredCells(previewCells);

    const isValidPlacement = gameManager.validatePlacement(
      previewCells,
      currentShip.size
    );
    setStatusMessage(
      isValidPlacement ? 'Valid placement!' : 'Invalid placement.'
    );
  };

  return (
    <div>
      <h2>
        Place your {gameManager.getCurrentShip()?.name} (
        {gameManager.getCurrentShip()?.size}x1) | {statusMessage}
      </h2>
      <div
        className="battleship-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 30px)`,
          pointerEvents: fleetCompleted ? 'none' : 'auto',
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isHovered = hoveredCells.some(
              (hoveredCell) =>
                hoveredCell.x === rowIndex && hoveredCell.y === colIndex
            );
            const isValid =
              hoveredCells.some(
                (hoveredCell) =>
                  hoveredCell.x === rowIndex && hoveredCell.y === colIndex
              ) &&
              gameManager.validatePlacement(
                hoveredCells,
                gameManager.getCurrentShip().size
              );
            return (
              <div
                key={cell.id}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseOver(rowIndex, colIndex)}
                style={{
                  width: '30px',
                  height: '30px',
                  border: '1px solid #ccc',
                  backgroundColor: isHovered
                    ? isValid
                      ? 'green'
                      : 'red'
                    : cell.occupied
                    ? 'blue'
                    : selectedCells.some(
                        (sel) => sel.x === rowIndex && sel.y === colIndex
                      )
                    ? 'lightblue'
                    : 'white',
                  cursor: 'pointer',
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default GameGrid;
