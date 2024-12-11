import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { PlacementManager } from './placement-manager';

interface GridProps {
  gridSize: number;
}

const PlacementGrid: React.FC<GridProps> = ({ gridSize }) => {
  const [gameManager] = useState(() => new PlacementManager(gridSize));
  const [grid, setGrid] = useState(gameManager.getGrid());
  const [fleetCompleted, setFleetCompleted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hoveredCells, setHoveredCells] = useState<{ x: number; y: number }[]>(
    []
  );
  const [currentHover, setCurrentHover] = useState<{
    x: number;
    y: number;
  } | null>(null); // Track last hover position

  useEffect(() => {
    const newSocket = io('http://localhost:3333');

    newSocket.on('connect', () => {
      console.debug('Connected to the server');
      newSocket.emit('joinGame');
    });

    // Log all relevant events
    const events = [
      'joined',
      'gameReady',
      'fleetPlaced',
      'gameStart',
      'attackResult',
      'attacked',
      'turnChange',
      'gameOver',
      'error',
    ];

    events.forEach((event) => {
      newSocket.on(event, (data) => {
        console.debug(`Event received: ${event}`, data);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Update grid and hovered cells on rotation
    gameManager.onShipRotation(() => {
      setGrid([...gameManager.getGrid()]); // Trigger grid re-render
      if (currentHover) {
        // Recalculate the preview for the last hovered position
        const currentShip = gameManager.getCurrentShip();
        const previewCells = gameManager.getShipPlacementPreview(
          currentHover.x,
          currentHover.y,
          currentShip.size
        );
        setHoveredCells(previewCells);
      }
    });
  }, [gameManager, currentHover]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0) {
      gameManager.rotateShip(); // Rotate the ship

      // Update hovered cells immediately after rotation
      if (currentHover) {
        const currentShip = gameManager.getCurrentShip();
        const previewCells = gameManager.getShipPlacementPreview(
          currentHover.x,
          currentHover.y,
          currentShip.size
        );
        setHoveredCells(previewCells);
      }

      setStatusMessage(
        `Ship rotated to ${gameManager.getCurrentShip().orientation}`
      );
      setGrid([...gameManager.getGrid()]); // Update the grid immediately after rotation
    }
  };

  const handleMouseOver = (x: number, y: number) => {
    setCurrentHover({ x, y }); // Store the last hovered position

    const currentShip = gameManager.getCurrentShip();
    let previewCells = gameManager.getShipPlacementPreview(
      x,
      y,
      currentShip.size
    );

    // Check if the current orientation is valid
    let isValidPlacement = gameManager.validatePlacement(
      previewCells,
      currentShip.size
    );

    if (!isValidPlacement) {
      // Try rotating the ship
      gameManager.rotateShip();
      setStatusMessage(
        `Ship rotated to ${gameManager.getCurrentShip().orientation}`
      );
      previewCells = gameManager.getShipPlacementPreview(
        x,
        y,
        currentShip.size
      );

      // Validate after rotation
      isValidPlacement = gameManager.validatePlacement(
        previewCells,
        currentShip.size
      );
    }

    setHoveredCells(previewCells);
    setStatusMessage(
      isValidPlacement ? 'Valid placement!' : 'Invalid placement.'
    );
  };

  const handleMouseClick = (x: number, y: number) => {
    const currentShip = gameManager.getCurrentShip();
    const previewCells = gameManager.getShipPlacementPreview(
      x,
      y,
      currentShip.size
    );

    const isValidPlacement = gameManager.validatePlacement(
      previewCells,
      currentShip.size
    );
    if (isValidPlacement) {
      gameManager.placeShip(previewCells);
      setGrid(gameManager.getGrid());
      setHoveredCells([]);
      setStatusMessage('');

      if (gameManager.isFleetCompleted()) {
        setFleetCompleted(true);
        setStatusMessage('Fleet completed! Sending to server...');
        socket?.emit('placeFleet', gameManager.getFleet());
      }
    } else {
      setStatusMessage('Invalid placement. Try again!');
    }
  };

  return (
    <div onWheel={handleWheel}>
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
                onClick={() => handleMouseClick(rowIndex, colIndex)}
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

export default PlacementGrid;
