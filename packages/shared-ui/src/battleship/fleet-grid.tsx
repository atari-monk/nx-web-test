import React, { useState, useEffect, useCallback } from 'react';
import { FleetService } from './fleet-service';
import { SocketService } from './socket-service';
import { PlayerService } from './player-service';
import { sendMessage } from './sender';
import { FleetGridProps } from './fleet-grid-props';
import { Cell, FleetUtils } from '@nx-web-test/shared';

const FleetGrid: React.FC<FleetGridProps> = ({ gridSize, onFleetComplete }) => {
  const playerService = PlayerService.getInstance();
  const socketService = SocketService.getInstance();

  const [fleetService] = useState(() => new FleetService(gridSize));
  const [grid, setGrid] = useState(fleetService.getGrid());
  const [fleetCompleted, setFleetCompleted] = useState(false);
  const [hoveredCells, setHoveredCells] = useState<{ x: number; y: number }[]>(
    []
  );
  const [currentHover, setCurrentHover] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleShipRotation = useCallback(() => {
    setGrid(fleetService.getGrid());
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
      setGrid(fleetService.getGrid());
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
      setGrid(fleetService.getGrid());
      setHoveredCells([]);

      if (fleetService.isFleetCompleted()) {
        const playerId = playerService?.getPlayerId();
        if (playerId) {
          setFleetCompleted(true);
          if (fleetService.isFleetCompleted()) {
            onFleetComplete();
          }
          socketService?.placeFleet(playerId, {
            grid: fleetService.getGrid(),
            fleet: fleetService.getFleet(),
          });
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
