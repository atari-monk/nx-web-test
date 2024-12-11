import { Chat, PlacementGrid, SocketStatus } from '@nx-web-test/shared-ui';

export function App() {
  return (
    <div>
      <PlacementGrid gridSize={10} />
      <Chat />
      <SocketStatus socketUrl="http://localhost:3333" />
    </div>
  );
}

export default App;
