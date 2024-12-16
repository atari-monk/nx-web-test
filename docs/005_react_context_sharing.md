# SocketService Context Sharing (005_react_context_sharing.md)

## Table of Contents

1. [Context](#context)
2. [Alternative](#alternative)
3. [Why Context](#why-context)
4. [Proposed solution](#proposed-solution)
5. [Failed solution](#failed-solution)
6. [Revised solution](#revised-solution)

## **Context**

[Table of Contents](#table-of-contents)

To share the `SocketService` instance across multiple components in your app, the simplest and most efficient way is to use React Context. This approach avoids creating multiple instances of `SocketService` and ensures all components can access the same instance.

### Steps to Implement:

1. **Create a SocketContext**  
   Create a context to hold the `SocketService` instance.

   ```typescript
   import React, { createContext, useContext, useMemo } from 'react';
   import { SocketService } from './socket-service';

   const SocketContext = createContext<SocketService | null>(null);

   export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const socketService = useMemo(() => new SocketService('http://localhost:3333'), []);

     return <SocketContext.Provider value={socketService}>{children}</SocketContext.Provider>;
   };

   export const useSocket = () => {
     const context = useContext(SocketContext);
     if (!context) {
       throw new Error('useSocket must be used within a SocketProvider');
     }
     return context;
   };
   ```

2. **Wrap Your App with the Provider**  
   Use the `SocketProvider` at the root of your component tree (e.g., in `App` or a higher-level component).

   ```typescript
   import React from 'react';
   import { SocketProvider } from './SocketContext'; // Adjust path as needed
   import App from './App';

   const Root: React.FC = () => {
     return (
       <SocketProvider>
         <App />
       </SocketProvider>
     );
   };

   export default Root;
   ```

3. **Consume the SocketService in Components**  
   Use the `useSocket` hook to access the `SocketService` instance in any component.

   For example, in `FleetGrid`:

   ```typescript
   import React, { useState, useEffect } from 'react';
   import { useSocket } from './SocketContext';

   const FleetGrid: React.FC<GridProps> = ({ gridSize }) => {
     const socketService = useSocket();
     const [grid, setGrid] = useState(/* ... */);

     useEffect(() => {
       // Example usage
       socketService.on('event', (data) => {
         console.log(data);
       });

       return () => {
         socketService.disconnect();
       };
     }, [socketService]);

     // Component logic...
   };
   ```

   Similarly, in other components:

   ```typescript
   const AnotherComponent = () => {
     const socketService = useSocket();

     useEffect(() => {
       socketService.emit('some-event', { data: 'example' });
     }, [socketService]);

     return <div>Socket-enabled Component</div>;
   };
   ```

### Why Use This Approach?

- **Centralized Management:** A single `SocketService` instance is shared across the app.
- **React-friendly:** Keeps your components functional and decoupled from direct instantiation logic.
- **Performance Efficient:** `useMemo` ensures the `SocketService` is only initialized once.

This pattern is scalable and works well even if you need the socket in more components later.

## **Alternative**

[Table of Contents](#table-of-contents)

Yeah but this seems insane amount of boilerplate, i thought we will just initialize instance in app and pass it to components

You're absolutely right that passing the instance directly can be simpler and avoids extra boilerplate, especially for smaller apps. Here's how you can do it:

### Simplified Approach: Initialize in `App` and Pass as Prop

1. **Initialize the `SocketService` in the `App` Component**  
   Create an instance of `SocketService` in your `App` component and pass it down as a prop to child components.

   ```typescript
   import React, { useMemo, useState } from 'react';
   import { FleetGrid, BattleGrid, MessageDisplay } from '@nx-web-test/shared-ui';
   import { SocketService } from './socket-service';

   export function App() {
     const [gamePhase, setGamePhase] = useState<'fleetPlacement' | 'battle'>('fleetPlacement');
     const gridSize = 10;

     // Initialize SocketService once
     const socketService = useMemo(() => new SocketService('http://localhost:3333'), []);

     const handleFleetCompletion = () => {
       setGamePhase('battle');
     };

     return (
       <div>
         {gamePhase === 'fleetPlacement' ? (
           <FleetGrid
             gridSize={gridSize}
             onFleetComplete={handleFleetCompletion}
             socketService={socketService} // Pass down as a prop
           />
         ) : (
           <BattleGrid gridSize={gridSize} socketService={socketService} />
         )}
         <MessageDisplay />
       </div>
     );
   }

   export default App;
   ```

2. **Update `FleetGrid` and Other Components to Accept `socketService` as Prop**  
   Modify `FleetGrid` and other components to use the passed `socketService` instance.

   ```typescript
   import React, { useState, useEffect } from 'react';
   import { SocketService } from './socket-service';

   interface FleetGridProps {
     gridSize: number;
     onFleetComplete: () => void;
     socketService: SocketService;
   }

   const FleetGrid: React.FC<FleetGridProps> = ({ gridSize, onFleetComplete, socketService }) => {
     const [grid, setGrid] = useState(/* ... */);

     useEffect(() => {
       // Example usage of socketService
       socketService.on('some-event', (data) => {
         console.log('Received event:', data);
       });

       return () => {
         socketService.disconnect();
       };
     }, [socketService]);

     // Component logic...
   };

   export default FleetGrid;
   ```

3. **Pass `socketService` Wherever Needed**  
   Similarly, for `BattleGrid` or other components, just add `socketService` to the props.

---

### Pros of This Approach:

- **Minimal Boilerplate:** No context or provider setup.
- **Simple and Explicit:** Child components clearly declare the dependency on `socketService`.

### Cons:

- **Prop Drilling:** If `socketService` needs to go deep into the component hierarchy, this approach can get cumbersome.
- **Less Flexible:** Harder to replace or mock `socketService` globally.

---

### When to Choose This:

- **Small Apps or Prototypes:** Perfect for simpler apps with a few components.
- **Limited Depth:** Use when `socketService` is needed only by a few direct child components.

If your app grows and this starts to feel messy, you can always refactor to use `Context` later!

## **Why Context**

[Table of Contents](#table-of-contents)

The simplest and most efficient way is to use React Context. Are u sure this is most up to date method and industry standard ?

Yes, using **React Context** is still an **up-to-date**, **widely used**, and **industry-standard** approach for sharing a single instance of a service (like `SocketService`) across components in modern React applications. However, there are some nuances and alternatives depending on the app's scale and requirements. Let me clarify why it's commonly used and compare it with other methods.

---

### Why React Context is Standard

1. **Single Source of Truth**: Context ensures that the `SocketService` instance is created once and shared across the app without prop drilling.
2. **Scalability**: It avoids tightly coupling parent components to the needs of deeply nested children.
3. **Clean API**: Components can use the `useSocket` hook to access the service without needing to be passed a prop explicitly.
4. **Compatibility with React Features**: Works seamlessly with hooks, memoization, and server-side rendering (when used carefully).
5. **Minimal Boilerplate**: Once the `Context` and `Provider` are set up, reusing or accessing the service is simple and intuitive.

---

### Industry Trends and Alternatives

While React Context is a common choice, other solutions are emerging or are better suited for specific scenarios:

1. **Using State Management Libraries (Redux, Zustand, Jotai):**

   - If your app already uses a state management library, you can store the `SocketService` instance there.
   - **Example (Zustand)**:

     ```typescript
     import create from 'zustand';

     const useStore = create((set) => ({
       socketService: new SocketService('http://localhost:3333'),
     }));

     const Component = () => {
       const socketService = useStore((state) => state.socketService);
       socketService.emit('test', {});
     };
     ```

2. **Direct Prop Passing:**

   - As discussed earlier, directly passing `SocketService` as a prop is simpler for small apps. However, this becomes cumbersome with deep hierarchies.
   - Best for lightweight, single-purpose apps.

3. **React Query or SWR (for Data-Fetching Scenarios):**

   - If you’re mainly using `SocketService` to fetch real-time data, libraries like **React Query** or **SWR** are industry standards for handling remote data and real-time subscriptions efficiently.
   - **Example (React Query):**

     ```typescript
     import { useQueryClient } from '@tanstack/react-query';

     const queryClient = useQueryClient();
     queryClient.setQueryData('socketService', new SocketService('http://localhost:3333'));
     ```

4. **Custom Hooks Without Context:**

   - You can create a custom hook to manage the `SocketService` lifecycle and use it wherever needed:

     ```typescript
     let socketService: SocketService | null = null;

     const useSocketService = () => {
       if (!socketService) {
         socketService = new SocketService('http://localhost:3333');
       }
       return socketService;
     };

     const Component = () => {
       const socket = useSocketService();
       socket.emit('event', {});
     };
     ```

   - Simpler than Context for small projects but lacks React's lifecycle integration.

---

### Context in the Industry

React Context is heavily used in real-world apps by companies and frameworks like:

- **Next.js**: It’s common to use Context for global state or services like WebSocket or Authentication.
- **Create React App** and similar boilerplates: They promote Context for global services.
- **Examples in Production**:
  - Sharing authentication tokens across components.
  - Providing real-time features (e.g., chat apps) using WebSocket clients like your `SocketService`.

---

### When Context Is Not Ideal

- **Frequent Updates:** If `SocketService` triggers frequent updates (e.g., new events), Context might re-render components unnecessarily. In such cases, libraries like **Zustand** are better.
- **Large Teams/Apps:** For complex state-sharing needs, Redux or a dedicated state library might offer better patterns for maintainability.

---

### Final Verdict

Yes, **React Context is a current best practice** and industry-standard for apps where the need for global shared state or services is moderate. However, for highly dynamic apps or larger teams, tools like Zustand, Redux, or React Query may provide more flexibility and scalability. If your app grows, you can always migrate to a more advanced pattern while still using Context as a foundation.

## **Proposed solution**

[Table of Contents](#table-of-contents)

Problem with this is that playerServiceInstance also needs to be app level shared service and it needs to give param to socket service on creation.

To make both `PlayerService` and `SocketService` shared, app-level services that depend on each other, you can use a React Context pattern, similar to the solution I shared earlier. Here's how to structure it:

---

### Steps to Implement

1. **Create Contexts for Both Services**
   Set up contexts for `PlayerService` and `SocketService` with dependency injection for `SocketService`.

   ```typescript
   import React, { createContext, useContext, useMemo } from 'react';
   import { PlayerService } from './player-service';
   import { SocketService } from './socket-service';

   // Create contexts
   const PlayerContext = createContext<PlayerService | null>(null);
   const SocketContext = createContext<SocketService | null>(null);

   // PlayerProvider
   export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const playerService = useMemo(() => new PlayerService(), []);
     return <PlayerContext.Provider value={playerService}>{children}</PlayerContext.Provider>;
   };

   // SocketProvider, dependent on PlayerProvider
   export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const playerService = usePlayer(); // Access PlayerService
     const socketService = useMemo(() => new SocketService('http://localhost:3333', playerService.getPlayerId()), [playerService]);

     return <SocketContext.Provider value={socketService}>{children}</SocketContext.Provider>;
   };

   // Custom hooks
   export const usePlayer = () => {
     const context = useContext(PlayerContext);
     if (!context) {
       throw new Error('usePlayer must be used within a PlayerProvider');
     }
     return context;
   };

   export const useSocket = () => {
     const context = useContext(SocketContext);
     if (!context) {
       throw new Error('useSocket must be used within a SocketProvider');
     }
     return context;
   };
   ```

---

2. **Wrap Your App with Providers**
   Ensure that the `PlayerProvider` wraps the `SocketProvider` so that the `PlayerService` is available when initializing the `SocketService`.

   ```typescript
   import React from 'react';
   import { PlayerProvider, SocketProvider } from './ServiceContext';
   import App from './App';

   const Root: React.FC = () => {
     return (
       <PlayerProvider>
         <SocketProvider>
           <App />
         </SocketProvider>
       </PlayerProvider>
     );
   };

   export default Root;
   ```

---

3. **Update FleetGrid to Use Contexts**
   Use the `usePlayer` and `useSocket` hooks in `FleetGrid`.

   ```typescript
   import React, { useState, useEffect, useCallback } from 'react';
   import { usePlayer, useSocket } from './ServiceContext';
   import { FleetService } from './fleet-service';
   import { sendMessage } from './sender';
   import { FleetGridProps } from './fleet-grid-props';
   import { Cell, FleetUtils } from '@nx-web-test/shared';

   const FleetGrid: React.FC<FleetGridProps> = ({ gridSize, onFleetComplete }) => {
     const playerService = usePlayer();
     const socketService = useSocket();

     const [fleetService] = useState(() => new FleetService(gridSize));
     const [grid, setGrid] = useState(fleetService.getGrid());
     const [fleetCompleted, setFleetCompleted] = useState(false);
     const [hoveredCells, setHoveredCells] = useState<{ x: number; y: number }[]>([]);
     const [currentHover, setCurrentHover] = useState<{ x: number; y: number } | null>(null);

     const handleShipRotation = useCallback(() => {
       setGrid(fleetService.getGrid());
       if (currentHover) {
         const previewCells = fleetService.getShipPlacementPreview(currentHover.x, currentHover.y, fleetService.getCurrentShip().size);
         setHoveredCells(previewCells);
       }
     }, [currentHover, fleetService]);

     useEffect(() => {
       fleetService.onShipRotation(handleShipRotation);

       return () => {
         if (fleetService.onShipRotationCallbacks) {
           fleetService.onShipRotationCallbacks = fleetService.onShipRotationCallbacks.filter((callback) => callback !== handleShipRotation);
         }
       };
     }, [handleShipRotation, fleetService]);

     const handleMouseClick = (x: number, y: number) => {
       const { success } = fleetService.placeAndValidateShip(x, y);
       if (success) {
         setGrid(fleetService.getGrid());
         setHoveredCells([]);

         if (fleetService.isFleetCompleted()) {
           const playerId = playerService.getPlayerId();
           if (playerId) {
             setFleetCompleted(true);
             onFleetComplete();
             socketService.placeFleet({
               playerId,
               grid: fleetService.getGrid(),
               fleet: fleetService.getFleet(),
             });
             FleetUtils.printGridWithFleet(fleetService.getGrid(), fleetService.getFleet());
           } else {
             sendMessage("Invalid playerId! Can't proceed!");
           }
         }
       } else {
         sendMessage('Invalid placement. Try again!');
       }
     };

     // Render logic remains the same...
   };

   export default FleetGrid;
   ```

---

### Key Benefits

1. **Centralized Dependency Management**: Both `PlayerService` and `SocketService` are managed via React Context, ensuring they are shared across the app and only instantiated once.
2. **Proper Dependency Injection**: `SocketService` depends on `PlayerService`, and this order is respected via nested providers.
3. **Scalability**: Adding additional shared services or dependencies is straightforward using this pattern.

## **Failed solution**

[Table of Contents](#table-of-contents)

Solution above failed. React was not holding service instance after commponnent was switched to other one.

## **Revised solution**

[Table of Contents](#table-of-contents)

To move the services out of React while maintaining centralized, shared instances, we can employ singletons or modules to manage the `SocketService` and `PlayerService`. This approach keeps React components clean and decoupled from the service instantiation logic. Here's how:

---

### Solution: Singleton-Based Shared Services

#### 1. **Singleton for `PlayerService` and `SocketService`**

Create `PlayerService` and `SocketService` as singletons, ensuring a single shared instance for the entire app:

**PlayerService Singleton:**

```typescript
// player-service.ts
export class PlayerService {
  private static instance: PlayerService;
  private playerId: string;

  private constructor() {
    this.playerId = this.generatePlayerId();
  }

  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  private generatePlayerId(): string {
    return `player-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getPlayerId(): string {
    return this.playerId;
  }
}
```

**SocketService Singleton:**

```typescript
// socket-service.ts
import { PlayerService } from './player-service';

export class SocketService {
  private static instance: SocketService;
  private socket: any;

  private constructor(private url: string, private playerId: string) {
    this.socket = this.initializeSocket();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      const playerService = PlayerService.getInstance();
      SocketService.instance = new SocketService('http://localhost:3333', playerService.getPlayerId());
    }
    return SocketService.instance;
  }

  private initializeSocket() {
    // Your socket initialization logic, e.g., socket.io or WebSocket
    console.log(`Initializing socket for player ${this.playerId}`);
    return {}; // Replace with actual socket instance
  }

  public emit(event: string, data: any) {
    console.log(`Emitting event: ${event}`, data);
    // Emit event via socket
  }

  public on(event: string, callback: (data: any) => void) {
    console.log(`Listening to event: ${event}`);
    // Listen for events via socket
  }

  public disconnect() {
    console.log(`Disconnecting socket for player ${this.playerId}`);
    // Disconnect logic
  }
}
```

---

#### 2. **Consume the Services in React Components**

**FleetGrid Component:**

```typescript
import React, { useState, useEffect } from 'react';
import { PlayerService } from './player-service';
import { SocketService } from './socket-service';

const FleetGrid: React.FC<{ gridSize: number; onFleetComplete: () => void }> = ({ gridSize, onFleetComplete }) => {
  const [grid, setGrid] = useState([]);
  const playerService = PlayerService.getInstance();
  const socketService = SocketService.getInstance();

  useEffect(() => {
    socketService.on('game-update', (data) => {
      console.log('Game update received:', data);
    });

    return () => {
      socketService.disconnect();
    };
  }, [socketService]);

  const handleFleetPlacement = () => {
    const playerId = playerService.getPlayerId();
    console.log('Player ID:', playerId);
    socketService.emit('fleet-placed', { playerId, grid });
    onFleetComplete();
  };

  return (
    <div>
      {/* FleetGrid UI */}
      <button onClick={handleFleetPlacement}>Complete Fleet Placement</button>
    </div>
  );
};

export default FleetGrid;
```

---

### Advantages of Singleton Services

1. **Global Accessibility**: `PlayerService` and `SocketService` are shared and accessible anywhere without React-specific logic.
2. **Decoupled from React**: No Context, Providers, or Prop Drilling.
3. **Easy Initialization**: Services initialize only once and can depend on each other.

---

### Considerations

- **Testing**: Mocking singletons may require additional setup.
- **Global State Changes**: If `SocketService` or `PlayerService` updates state, consider a state management library like Zustand for reactivity.

This approach simplifies the architecture, removes React-specific boilerplate, and keeps services independent. Let me know if you'd like further refinements!
