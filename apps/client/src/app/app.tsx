import { Chat, SocketStatus } from '@nx-web-test/shared-ui';

export function App() {
  return (
    <div>
      <style jsx>{`
        /** your style here **/
      `}</style>
      <Chat />
      <SocketStatus socketUrl="http://localhost:3333" />
    </div>
  );
}

export default App;
