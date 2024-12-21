import { Cell, Ship, ShipPlacement, Grid } from '@nx-web-test/shared';

export class FleetService {
  private grid: Grid; // Use Grid type here
  private fleet: ShipPlacement[] = [];
  private currentShipIndex = 0;

  private shipList: Ship[] = [
    { name: 'Frigate', size: 2, orientation: 'horizontal' },
    { name: 'Destroyer', size: 3, orientation: 'horizontal' },
    { name: 'Submarine', size: 3, orientation: 'horizontal' },
    { name: 'Battleship', size: 4, orientation: 'horizontal' },
    { name: 'Carrier', size: 5, orientation: 'horizontal' },
  ];

  onShipRotationCallbacks: (() => void)[] = [];

  constructor(gridSize: number) {
    this.grid = this.createEmptyGrid(gridSize);
  }

  private createEmptyGrid(size: number): Grid {
    let idCounter = 0; // Unique ID counter for each cell
    const grid: Cell[][] = Array.from({ length: size }, (_, rowIndex) =>
      Array.from({ length: size }, (_, colIndex) => ({
        id: idCounter++, // Assign a unique ID to each cell
        occupied: false,
        hit: false,
        miss: false,
      }))
    );

    return { size, cells: grid }; // Return Grid type
  }

  getGrid() {
    return this.grid; // Return the whole Grid object
  }

  getFleet() {
    return this.fleet;
  }

  setGrid(grid: Grid) {
    this.grid = grid;
  }

  setFleet(fleet: ShipPlacement[]) {
    this.fleet = fleet;
    this.currentShipIndex = fleet.length;
  }

  getCurrentShip() {
    return this.shipList[this.currentShipIndex];
  }

  placeShip(selectedCells: { x: number; y: number }[]): boolean {
    const currentShip = this.getCurrentShip();
    if (!this.validatePlacement(selectedCells, currentShip.size)) return false;

    // Mark cells as occupied
    selectedCells.forEach(({ x, y }) => {
      this.grid.cells[x][y].occupied = true; // Access grid via grid.cells
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
          adjX < this.grid.size &&
          adjY >= 0 &&
          adjY < this.grid.size &&
          this.grid.cells[adjX][adjY].occupied
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

  getShipPlacementPreview(
    x: number,
    y: number,
    size: number
  ): { x: number; y: number }[] {
    const currentShip = this.getCurrentShip();
    const orientation = currentShip.orientation;

    const cells: { x: number; y: number }[] = [];

    if (orientation === 'horizontal') {
      if (y + size <= this.grid.size) {
        for (let i = 0; i < size; i++) {
          cells.push({ x, y: y + i });
        }
      }
    } else if (orientation === 'vertical') {
      if (x + size <= this.grid.size) {
        for (let i = 0; i < size; i++) {
          cells.push({ x: x + i, y });
        }
      }
    }

    return cells;
  }

  rotateShip() {
    const currentShip = this.getCurrentShip();
    currentShip.orientation =
      currentShip.orientation === 'horizontal' ? 'vertical' : 'horizontal';

    // Notify listeners about the rotation
    this.onShipRotationCallbacks.forEach((callback) => callback());
  }

  // Method to register callbacks when ship rotates
  onShipRotation(callback: () => void) {
    this.onShipRotationCallbacks.push(callback);
  }

  rotateAndPreviewShip(x: number, y: number) {
    this.rotateShip();
    return this.getShipPlacementPreview(x, y, this.getCurrentShip().size);
  }

  getValidShipPreview(x: number, y: number): { x: number; y: number }[] {
    const currentShip = this.getCurrentShip();
    let previewCells = this.getShipPlacementPreview(x, y, currentShip.size);
    if (!this.validatePlacement(previewCells, currentShip.size)) {
      this.rotateShip();
      previewCells = this.getShipPlacementPreview(x, y, currentShip.size);
    }
    return previewCells;
  }

  placeAndValidateShip(x: number, y: number) {
    const currentShip = this.getCurrentShip();
    const previewCells = this.getShipPlacementPreview(x, y, currentShip.size);

    if (this.validatePlacement(previewCells, currentShip.size)) {
      this.placeShip(previewCells);
      return { success: true };
    }
    return { success: false };
  }
}
