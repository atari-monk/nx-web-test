import { ShipPlacement, Grid } from './models';

export class FleetUtils {
  static getFleetData(ships: ShipPlacement[]): string {
    return ships
      .map((placement) => {
        return `Ship: ${placement.shipType}, Size: ${placement.size}, Position: (${placement.x}, ${placement.y}), Orientation: ${placement.orientation}`;
      })
      .join('\n');
  }

  static printGridWithFleet(grid: Grid, ships: ShipPlacement[]): void {
    const gridRepresentation = grid.cells
      .map((row) => row.map((cell) => (cell.occupied ? 'X' : '.')).join(' '))
      .join('\n');

    console.log('Grid with Fleet:');
    console.log(gridRepresentation);

    console.log('\nFleet Placement Data:');
    console.log(this.getFleetData(ships));
  }
}
