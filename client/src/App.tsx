import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Game from "@/pages/game";
import NotFound from "@/pages/not-found";
import { GameStateProvider } from "@/lib/game-state";

// Check if we're in standalone mode - check both process.env and window.STANDALONE_MODE
const isStandaloneMode = 
  (typeof process !== 'undefined' && process.env && process.env.STANDALONE_MODE === 'true') ||
  (typeof window !== 'undefined' && window.STANDALONE_MODE === true);

// Add the missing TypeScript declaration
declare global {
  interface Window {
    STANDALONE_MODE?: boolean;
    __WOUTER_HASH_ROUTING__?: boolean;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log('App rendering, standalone mode:', isStandaloneMode);
  
  // In standalone mode, render the Game component directly
  if (isStandaloneMode) {
    return (
      <QueryClientProvider client={queryClient}>
        <GameStateProvider>
          <div className="standalone-container">
            <Game />
          </div>
        </GameStateProvider>
      </QueryClientProvider>
    );
  }
  
  // Otherwise, use the router
  return (
    <QueryClientProvider client={queryClient}>
      <GameStateProvider>
        <Router />
        <Toaster />
      </GameStateProvider>
    </QueryClientProvider>
  );
}

export default App;