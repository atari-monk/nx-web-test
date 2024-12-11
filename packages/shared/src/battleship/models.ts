export interface Cell {
  id: number; // Unique identifier for the cell
  occupied: boolean; // Whether a ship occupies this cell
  hit: boolean; // Whether this cell has been targeted in an attack
}

export interface Grid {
  size: number; // Size of the grid (e.g., 10x10)
  cells: Cell[][]; // 2D array of cells
}

export interface ShipPlacement {
  x: number; // x-coordinate (row)
  y: number; // y-coordinate (column)
  shipType: string; // Type of ship (e.g., "Battleship")
  size: number; // Size of the ship
  orientation: 'horizontal' | 'vertical'; // Orientation of the ship
}

export interface Player {
  id: string; // Unique identifier for the player (e.g., persistent ID)
  socketId: string; // Current WebSocket connection ID
  name?: string; // Optional player name
  grid: Grid; // Player's grid
  ships: ShipPlacement[]; // List of the player's ships
  state: 'placement' | 'ready' | 'in-turn'; // Current state of the player
}

export interface Ship {
  name: string; // Name of the ship
  size: number; // Size of the ship
  orientation: 'horizontal' | 'vertical'; // Default orientation of the ship
}
