import React, { useState } from 'react';
import {
  Chat,
  FleetGrid,
  MessageDisplay,
  SocketStatus,
  BattleGrid,
} from '@nx-web-test/shared-ui';

export function App() {
  const [gamePhase, setGamePhase] = useState<'fleetPlacement' | 'battle'>(
    'fleetPlacement'
  );
  const gridSize = 10;

  const handleFleetCompletion = () => {
    setGamePhase('battle');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ order: 2 }}>
        <MessageDisplay />
      </div>

      {gamePhase === 'fleetPlacement' ? (
        <FleetGrid
          gridSize={gridSize}
          onFleetComplete={handleFleetCompletion}
        />
      ) : (
        <BattleGrid gridSize={gridSize} />
      )}

      {/* Uncomment these if needed */}
      {/* <Chat /> */}
      {/* <SocketStatus socketUrl="http://localhost:3333" /> */}
    </div>
  );
}

export default App;
