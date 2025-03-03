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
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Board />
      </div>

      {state.debugMode && <DebugPanel />}

      <div className="p-4 border-t">
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