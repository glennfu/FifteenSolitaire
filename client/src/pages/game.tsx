import { useCallback, useEffect, useState } from "react";
import { Board } from "@/components/game/board";
import { Menu } from "@/components/game/menu";
import { DebugPanel } from "@/components/game/debug-panel";
import { WinDialog } from "@/components/game/win-dialog";
import { useGameState } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

// Wooden UI style
const woodenBlockStyle = {
  backgroundColor: '#8B4513',
  backgroundImage: `linear-gradient(90deg, rgba(139,69,19,1) 0%, rgba(160,82,45,1) 50%, rgba(139,69,19,1) 100%)`,
  boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -2px 3px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)',
  borderRadius: '6px',
  padding: '8px 16px',
  color: '#f8e0c5',
  textShadow: '0 -1px 1px rgba(0, 0, 0, 0.5)',
  border: '1px solid #6b3610'
};

// Add a felt texture with grain
const feltTexture = {
  background: '#1a6c3d',
  backgroundImage: `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' fill-opacity='0.05' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E"),
    radial-gradient(circle at center, #1a6c3d 0%, #0d5c2e 100%)
  `,
  backgroundBlendMode: 'overlay',
};

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
    <div className="fixed inset-0 overflow-hidden" style={feltTexture}>
      <div className="h-full flex items-start justify-center">
        <Board />
      </div>

      {state.debugMode && <DebugPanel />}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#8B4513] z-50" style={{ pointerEvents: "none" }}>
        <div className="flex justify-between items-center">
          <div style={{ ...woodenBlockStyle, pointerEvents: "auto" }}>
            <Menu />
          </div>
          
          <div style={{ ...woodenBlockStyle, pointerEvents: "auto" }}>
            <h1 className="text-2xl font-bold text-center text-amber-100">Fifteen</h1>
            <p className="text-sm text-amber-200 text-center">
              Games Won: {state.gamesWon}
            </p>
          </div>
          
          <div style={{ ...woodenBlockStyle, pointerEvents: "auto" }}>
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

      <WinDialog 
        isOpen={showWinDialog} 
        onNewGame={handleNewGame}
      />
    </div>
  );
}