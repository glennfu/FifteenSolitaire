import { useCallback, useEffect } from "react";
import { Board } from "@/components/game/board";
import { Menu } from "@/components/game/menu";
import { DebugPanel } from "@/components/game/debug-panel";
import { useGameState } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

export default function Game() {
  const { state, undo, initGame, loadGame } = useGameState();

  useEffect(() => {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      try {
        loadGame(JSON.parse(savedState));
      } catch {
        initGame();
      }
    } else {
      initGame();
    }
  }, [loadGame, initGame]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  return (
    <div className="fixed inset-0 bg-background">
      <div className="h-[calc(100vh-4rem)] flex items-start justify-center p-4">
        <Board />
      </div>

      {state.debugMode && <DebugPanel />}

      <div className="fixed bottom-0 left-0 right-0 p-4">
        <div className="flex justify-between items-center">
          <Menu />
          <div>
            <h1 className="text-2xl font-bold text-center">Fifteen</h1>
            <p className="text-sm text-muted-foreground text-center">
              Games Won: {state.gamesWon}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleUndo}
            disabled={state.moveHistory.length === 0}
          >
            <Undo2 className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}