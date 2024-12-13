import {
  Chat,
  FleetGrid,
  MessageDisplay,
  SocketStatus,
} from '@nx-web-test/shared-ui';

export function App() {
  return (
    <div>
      <FleetGrid gridSize={10} />
      <MessageDisplay />

      {/* <Chat /> */}
      {/* <SocketStatus socketUrl="http://localhost:3333" /> */}
    </div>
  );
}

export default App;
