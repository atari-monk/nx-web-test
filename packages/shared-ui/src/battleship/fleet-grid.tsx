import React, { useState, useEffect } from 'react';
import { FleetService } from './fleet-service';
import { SocketService } from './socket-service';
import { PlayerService } from './player-service';
import { sendMessage } from './sender';
import { GridProps } from './GridProps';

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
    fleetService.onShipRotation(() => {
      setGrid([...fleetService.getGrid()]);
      if (currentHover) {
        const currentShip = fleetService.getCurrentShip();
        const previewCells = fleetService.getShipPlacementPreview(
          currentHover.x,
          currentHover.y,
          currentShip.size
        );
        setHoveredCells(previewCells);
      }
    });
  }, [fleetService, currentHover]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0 && currentHover) {
      const previewCells = fleetService.rotateAndPreviewShip(
        currentHover.x,
        currentHover.y
      );
      setHoveredCells(previewCells);
      setGrid([...fleetService.getGrid()]);
    }
  };

  const handleMouseOver = (x: number, y: number) => {
    setCurrentHover({ x, y });
    const previewCells = fleetService.getValidShipPreview(x, y);
    setHoveredCells(previewCells);
    const ship = fleetService.getCurrentShip();
    const shipName = ship?.name;
    const shipSize = ship?.size;
    sendMessage(`Place your ${shipName} (${shipSize}x1)`);
  };

  const handleMouseClick = (x: number, y: number) => {
    const { success } = fleetService.placeAndValidateShip(
      x,
      y
    );
    if (success) {
      setGrid([...fleetService.getGrid()]);
      setHoveredCells([]);

      if (fleetService.isFleetCompleted()) {
        const playerId = playerService?.getPlayerId();
        if (playerId) {
          setFleetCompleted(true);
          sendMessage('Fleet position completed!');
          socketService?.placeFleet(playerId, fleetService.getFleet());
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
              fleetService.validatePlacement(
                hoveredCells,
                fleetService.getCurrentShip().size
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

export default FleetGrid;
