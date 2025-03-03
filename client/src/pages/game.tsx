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

  console.log("Debug mode:", state.debugMode); // Debug log - added from original code


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Game board */}
      <div className="flex-1 overflow-y-auto p-4">
        <Board />
      </div>

      {/* Debug panel - positioned below board but above footer */}
      {state.debugMode && (
        <div className="overflow-y-auto p-4" style={{ maxHeight: '30vh' }}>
          <DebugPanel />
        </div>
      )}

      {/* Footer - always at bottom */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
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