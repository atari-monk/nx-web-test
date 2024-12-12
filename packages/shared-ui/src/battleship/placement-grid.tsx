import React, { useState, useEffect } from 'react';
import { PlacementService } from './placement-service';
import { SocketService } from './socket-service';
import { PlayerService } from './player-service';

interface GridProps {
  gridSize: number;
}

const PlacementGrid: React.FC<GridProps> = ({ gridSize }) => {
  const [placementService] = useState(() => new PlacementService(gridSize));
  const [grid, setGrid] = useState(placementService.getGrid());
  const [fleetCompleted, setFleetCompleted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [playerService, setPlayerService] = useState<PlayerService | null>(
    null
  );
  const [socketService, setSocketService] = useState<SocketService | null>(
    null
  );
  const [hoveredCells, setHoveredCells] = useState<{ x: number; y: number }[]>(
    []
  );
  const [currentHover, setCurrentHover] = useState<{
    x: number;
    y: number;
  } | null>(null); // Track last hover position

  useEffect(() => {
    const playerService = new PlayerService();
    const socketService = new SocketService(
      'http://localhost:3333',
      playerService.getPlayerId()
    );
    setSocketService(socketService);
    setPlayerService(playerService);

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Update grid and hovered cells on rotation
    placementService.onShipRotation(() => {
      setGrid([...placementService.getGrid()]); // Trigger grid re-render
      if (currentHover) {
        // Recalculate the preview for the last hovered position
        const currentShip = placementService.getCurrentShip();
        const previewCells = placementService.getShipPlacementPreview(
          currentHover.x,
          currentHover.y,
          currentShip.size
        );
        setHoveredCells(previewCells);
      }
    });
  }, [placementService, currentHover]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0) {
      placementService.rotateShip(); // Rotate the ship

      // Update hovered cells immediately after rotation
      if (currentHover) {
        const currentShip = placementService.getCurrentShip();
        const previewCells = placementService.getShipPlacementPreview(
          currentHover.x,
          currentHover.y,
          currentShip.size
        );
        setHoveredCells(previewCells);
      }

      setStatusMessage(
        `Ship rotated to ${placementService.getCurrentShip().orientation}`
      );
      setGrid([...placementService.getGrid()]); // Update the grid immediately after rotation
    }
  };

  const handleMouseOver = (x: number, y: number) => {
    setCurrentHover({ x, y }); // Store the last hovered position

    const currentShip = placementService.getCurrentShip();
    let previewCells = placementService.getShipPlacementPreview(
      x,
      y,
      currentShip.size
    );

    // Check if the current orientation is valid
    let isValidPlacement = placementService.validatePlacement(
      previewCells,
      currentShip.size
    );

    if (!isValidPlacement) {
      // Try rotating the ship
      placementService.rotateShip();
      setStatusMessage(
        `Ship rotated to ${placementService.getCurrentShip().orientation}`
      );
      previewCells = placementService.getShipPlacementPreview(
        x,
        y,
        currentShip.size
      );

      // Validate after rotation
      isValidPlacement = placementService.validatePlacement(
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
    const currentShip = placementService.getCurrentShip();
    const previewCells = placementService.getShipPlacementPreview(
      x,
      y,
      currentShip.size
    );

    const isValidPlacement = placementService.validatePlacement(
      previewCells,
      currentShip.size
    );
    if (isValidPlacement) {
      placementService.placeShip(previewCells);
      setGrid(placementService.getGrid());
      setHoveredCells([]);
      setStatusMessage('');

      if (placementService.isFleetCompleted()) {
        const playerId = playerService?.getPlayerId();
        console.log(`playerId:${playerId}`);
        if (playerId) {
          setFleetCompleted(true);
          setStatusMessage('Fleet completed! Sending to server...');
          socketService?.placeFleet(playerId, placementService.getFleet());
        } else {
          setStatusMessage("Invalid playerId! can't proceed!");
        }
      }
    } else {
      setStatusMessage('Invalid placement. Try again!');
    }
  };

  return (
    <div onWheel={handleWheel}>
      <h2>
        Place your {placementService.getCurrentShip()?.name} (
        {placementService.getCurrentShip()?.size}x1) | {statusMessage}
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
              placementService.validatePlacement(
                hoveredCells,
                placementService.getCurrentShip().size
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
