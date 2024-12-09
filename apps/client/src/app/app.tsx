import { Chat, SocketStatus } from '@nx-web-test/shared-ui';

export function App() {
  return (
    <div>
      <style jsx>{`
        /** your style here **/
      `}</style>
      <SocketStatus socketUrl="http://localhost:3333" />
      <Chat />
    </div>
  );
}

export default App;
