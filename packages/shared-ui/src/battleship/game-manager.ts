import { Cell, ShipPlacement } from '@nx-web-test/shared';

export class GameManager {
  private gridSize: number;
  private grid: Cell[][];
  private fleet: ShipPlacement[] = [];
  private currentShipIndex = 0;

  private shipList = [
    { name: 'Frigate', size: 2 },
    { name: 'Destroyer', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Battleship', size: 4 },
    { name: 'Carrier', size: 5 },
  ];

  constructor(gridSize: number) {
    this.gridSize = gridSize;
    this.grid = Array.from({ length: gridSize }, (_, rowIndex) =>
      Array.from({ length: gridSize }, (_, colIndex) => ({
        id: rowIndex * gridSize + colIndex,
        occupied: false,
      }))
    );
  }

  getGrid() {
    return this.grid;
  }

  getFleet() {
    return this.fleet;
  }

  getCurrentShip() {
    return this.shipList[this.currentShipIndex];
  }

  placeShip(selectedCells: { x: number; y: number }[]): boolean {
    const currentShip = this.getCurrentShip();
    if (!this.validatePlacement(selectedCells, currentShip.size)) return false;

    // Mark cells as occupied
    selectedCells.forEach(({ x, y }) => {
      this.grid[x][y].occupied = true;
    });

    // Add ship to fleet
    const orientation =
      selectedCells[0].x === selectedCells[1].x ? 'horizontal' : 'vertical';
    this.fleet.push({
      x: selectedCells[0].x,
      y: selectedCells[0].y,
      shipType: currentShip.name,
      size: currentShip.size,
      orientation,
    });

    this.currentShipIndex += 1;
    return true;
  }

  isFleetCompleted(): boolean {
    return this.currentShipIndex >= this.shipList.length;
  }

  validatePlacement(
    selection: { x: number; y: number }[],
    size: number
  ): boolean {
    if (selection.length !== size) return false;

    const allInRow = selection.every((cell) => cell.x === selection[0].x);
    const allInColumn = selection.every((cell) => cell.y === selection[0].y);

    if (!allInRow && !allInColumn) return false;

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

    return !selection.some(({ x, y }) =>
      this.getAdjacentCells(x, y).some(
        ({ x: adjX, y: adjY }) =>
          adjX >= 0 &&
          adjX < this.gridSize &&
          adjY >= 0 &&
          adjY < this.gridSize &&
          this.grid[adjX][adjY].occupied
      )
    );
  }

  private getAdjacentCells(x: number, y: number) {
    return [
      { x: x - 1, y: y - 1 },
      { x: x - 1, y },
      { x: x - 1, y: y + 1 },
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x + 1, y: y - 1 },
      { x: x + 1, y },
      { x: x + 1, y: y + 1 },
    ];
  }
}
