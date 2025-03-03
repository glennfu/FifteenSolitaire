import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Game from "@/pages/game";
import NotFound from "@/pages/not-found";
import { GameStateProvider } from "@/lib/game-state";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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