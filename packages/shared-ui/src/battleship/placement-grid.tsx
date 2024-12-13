import React, { useState, useEffect } from 'react';
import { PlacementService } from './placement-service';
import { SocketService } from './socket-service';
import { PlayerService } from './player-service';
import { sendMessage } from './sender';

interface GridProps {
  gridSize: number;
}

const PlacementGrid: React.FC<GridProps> = ({ gridSize }) => {
  const [placementService] = useState(() => new PlacementService(gridSize));
  const [grid, setGrid] = useState(placementService.getGrid());
  const [fleetCompleted, setFleetCompleted] = useState(false);
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
  } | null>(null);

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
    placementService.onShipRotation(() => {
      setGrid([...placementService.getGrid()]);
      if (currentHover) {
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
      placementService.rotateShip();
      if (currentHover) {
        const currentShip = placementService.getCurrentShip();
        const previewCells = placementService.getShipPlacementPreview(
          currentHover.x,
          currentHover.y,
          currentShip.size
        );
        setHoveredCells(previewCells);
      }
      setGrid([...placementService.getGrid()]);
    }
  };

  const handleMouseOver = (x: number, y: number) => {
    setCurrentHover({ x, y });

    const currentShip = placementService.getCurrentShip();
    let previewCells = placementService.getShipPlacementPreview(
      x,
      y,
      currentShip.size
    );

    let isValidPlacement = placementService.validatePlacement(
      previewCells,
      currentShip.size
    );

    if (!isValidPlacement) {
      placementService.rotateShip();
      previewCells = placementService.getShipPlacementPreview(
        x,
        y,
        currentShip.size
      );

      isValidPlacement = placementService.validatePlacement(
        previewCells,
        currentShip.size
      );
    }

    setHoveredCells(previewCells);
    sendMessage(`Place your ${placementService.getCurrentShip()?.name} (
        ${placementService.getCurrentShip()?.size}x1)`);
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

      if (placementService.isFleetCompleted()) {
        const playerId = playerService?.getPlayerId();
        console.log(`playerId:${playerId}`);
        if (playerId) {
          setFleetCompleted(true);
          sendMessage('Fleet position completed!');
          socketService?.placeFleet(playerId, placementService.getFleet());
        } else {
          sendMessage("Invalid playerId! can't proceed!");
        }
      }
    } else {
      sendMessage('Invalid placement. Try again!');
    }
  };

  return (
    <div onWheel={handleWheel}>
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
