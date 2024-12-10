export interface Cell {
  id: number;
  occupied: boolean; // Whether a ship occupies this cell
}

export interface Grid {
  size: number;
  cells: Cell[][];
}

export interface ShipPlacement {
  x: number; // x-coordinate (row)
  y: number; // y-coordinate (column)
  shipType: string; // Type of ship (e.g., "Battleship")
  size: number; // Size of the ship
  orientation: 'horizontal' | 'vertical'; // Orientation of the ship
}

export interface Player {
  id: string;
  name: string;
  grid: Grid;
  ships: ShipPlacement[];
}
