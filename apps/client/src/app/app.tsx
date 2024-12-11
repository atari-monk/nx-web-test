import { Chat, GameGrid, SocketStatus } from '@nx-web-test/shared-ui';

export function App() {
  return (
    <div>
      <GameGrid gridSize={10} />
      <Chat />
      <SocketStatus socketUrl="http://localhost:3333" />
    </div>
  );
}

export default App;
