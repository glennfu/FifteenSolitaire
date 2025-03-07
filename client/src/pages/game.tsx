import { useCallback, useEffect, useState } from "react";
import { Board } from "@/components/game/board";
import { Menu } from "@/components/game/menu";
import { DebugPanel } from "@/components/game/debug-panel";
import { WinDialog } from "@/components/game/win-dialog";
import { useGameState } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { textures } from "@/lib/utils";

export default function Game() {
  const { state, undo, initGame, loadGame } = useGameState();
  const [showWinDialog, setShowWinDialog] = useState(false);

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

  // Show win dialog when game is won
  useEffect(() => {
    if (state.gameWon && !showWinDialog) {
      setShowWinDialog(true);
    }
  }, [state.gameWon]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleNewGame = useCallback(() => {
    setShowWinDialog(false);
    initGame();
  }, [initGame]);

  return (
    <div className="fixed inset-0 overflow-hidden felt-background">
      {/* Simple noise texture */}
      <div className="absolute inset-0 noise-texture" />
      
      <div className="h-full flex items-start justify-center">
        <Board />
      </div>

      {state.debugMode && <DebugPanel />}

      <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ pointerEvents: "none" }}>
        <div className="flex justify-between items-center">
          <div className="wooden-ui" style={{ pointerEvents: "auto" }}>
            <Menu />
          </div>
          
          <div className="wooden-ui" style={{ pointerEvents: "auto" }}>
            <h1 className="text-2xl font-bold text-center text-amber-100">Fifteen</h1>
            <p className="text-sm text-amber-200 text-center">
              Games Won: {state.gamesWon}
            </p>
          </div>
          
          <div className="wooden-ui" style={{ pointerEvents: "auto" }}>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleUndo}
              disabled={state.moveHistory.length === 0}
              className="text-amber-100 hover:text-amber-50 hover:bg-transparent"
            >
              <Undo2 className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {showWinDialog && (
        <WinDialog 
          onClose={() => setShowWinDialog(false)}
          onNewGame={() => {
            setShowWinDialog(false);
            initGame();
          }}
          gamesWon={state.gamesWon}
        />
      )}
    </div>
  );
}