import { useCallback, useEffect, useState } from "react";
import { Board } from "@/components/game/board";
import { Menu } from "@/components/game/menu";
import { DebugPanel } from "@/components/game/debug-panel";
import { WinDialog } from "@/components/game/win-dialog";
import { useGameState } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

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

  console.log("Debug mode:", state.debugMode); // Debug log

  return (
    <div className="relative min-h-screen bg-background">
      {/* Main content area */}
      <div className="pb-20"> {/* Add padding to account for footer */}
        <div className="p-4">
          <Board />
        </div>

        {/* Debug panel */}
        {state.debugMode && (
          <div className="p-4 mt-4">
            <DebugPanel />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-3xl mx-auto p-4 flex justify-between items-center">
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

      <WinDialog 
        isOpen={showWinDialog} 
        onNewGame={handleNewGame}
      />
    </div>
  );
}