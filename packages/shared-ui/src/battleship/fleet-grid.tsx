import React, { useState, useEffect, useCallback } from 'react';
import { FleetService } from './fleet-service';
import { SocketService } from './socket-service';
import { PlayerService } from './player-service';
import { sendMessage } from './sender';
import { GridProps } from './GridProps';
import { Cell, FleetUtils } from '@nx-web-test/shared';

const FleetGrid: React.FC<GridProps> = ({ gridSize }) => {
  const [fleetService] = useState(() => new FleetService(gridSize));
  const [grid, setGrid] = useState(fleetService.getGrid());
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
    const playerServiceInstance = new PlayerService();
    const socketServiceInstance = new SocketService(
      'http://localhost:3333',
      playerServiceInstance.getPlayerId()
    );
    setSocketService(socketServiceInstance);
    setPlayerService(playerServiceInstance);

    return () => {
      socketServiceInstance.disconnect();
    };
  }, []);

  const handleShipRotation = useCallback(() => {
    setGrid(fleetService.getGrid()); // Update grid state from fleetService
    if (currentHover) {
      const previewCells = fleetService.getShipPlacementPreview(
        currentHover.x,
        currentHover.y,
        fleetService.getCurrentShip().size
      );
      setHoveredCells(previewCells);
    }
  }, [currentHover, fleetService]);

  useEffect(() => {
    fleetService.onShipRotation(handleShipRotation);

    return () => {
      if (fleetService.onShipRotationCallbacks) {
        fleetService.onShipRotationCallbacks =
          fleetService.onShipRotationCallbacks.filter(
            (callback) => callback !== handleShipRotation
          );
      }
    };
  }, [handleShipRotation, fleetService]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0 && currentHover) {
      const previewCells = fleetService.rotateAndPreviewShip(
        currentHover.x,
        currentHover.y
      );
      setHoveredCells(previewCells);
      setGrid(fleetService.getGrid()); // Update grid on rotation
    }
  };

  const handleMouseOver = (x: number, y: number) => {
    setCurrentHover({ x, y });
    const previewCells = fleetService.getValidShipPreview(x, y);
    setHoveredCells(previewCells);
    const ship = fleetService.getCurrentShip();
    sendMessage(`Place your ${ship?.name} (${ship?.size}x1)`);
  };

  const handleMouseClick = (x: number, y: number) => {
    const { success } = fleetService.placeAndValidateShip(x, y);
    if (success) {
      setGrid(fleetService.getGrid()); // Update grid after placing ship
      setHoveredCells([]);

      if (fleetService.isFleetCompleted()) {
        const playerId = playerService?.getPlayerId();
        if (playerId) {
          setFleetCompleted(true);
          sendMessage('Fleet position completed!');
          socketService?.placeFleet(playerId, fleetService.getFleet());
          FleetUtils.printGridWithFleet(
            fleetService.getGrid(),
            fleetService.getFleet()
          );
        } else {
          sendMessage("Invalid playerId! Can't proceed!");
        }
      }
    } else {
      sendMessage('Invalid placement. Try again!');
    }
  };

  const getCellStyle = (isHovered: boolean, isValid: boolean, cell: Cell) => ({
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
  });

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
        {grid.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isHovered = hoveredCells.some(
              (hoveredCell) =>
                hoveredCell.x === rowIndex && hoveredCell.y === colIndex
            );
            const isValid =
              isHovered &&
              fleetService.validatePlacement(
                hoveredCells,
                fleetService.getCurrentShip().size
              );

            return (
              <div
                key={cell.id}
                onClick={() => handleMouseClick(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseOver(rowIndex, colIndex)}
                style={getCellStyle(isHovered, isValid, cell)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default FleetGrid;
