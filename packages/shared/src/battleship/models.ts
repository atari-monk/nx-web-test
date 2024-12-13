export interface Cell {
  id: number;
  occupied: boolean;
  hit: boolean;
}

export interface Grid {
  size: number;
  cells: Cell[][];
}

export interface ShipPlacement {
  x: number;
  y: number;
  shipType: string;
  size: number;
  orientation: 'horizontal' | 'vertical';
}

export interface Player {
  id: string;
  socketId: string;
  name?: string;
  grid: Grid;
  ships: ShipPlacement[];
  state: 'placement' | 'ready' | 'in-turn';
}

export interface Ship {
  name: string;
  size: number;
  orientation: 'horizontal' | 'vertical';
}
