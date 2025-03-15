import { useCallback, useEffect, useState } from "react";
import { Board } from "@/components/game/board";
import { Menu } from "@/components/game/menu";
import { DebugPanel } from "@/components/game/debug-panel";
import { WinAnimations } from "@/components/game/win-animations";
import { useGameState } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Game() {
  const { state, undo, initGame, loadGame } = useGameState();
  const [showWinDialog, setShowWinDialog] = useState(false);

  useEffect(() => {
    // Try to load from localStorage first
    // If localStorage fails (which can happen on older iPhones overnight),
    // we'll fall back to retrieving gamesWon from cookies in the loadGame function
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      try {
        loadGame(JSON.parse(savedState));
      } catch (error) {
        console.error("Failed to load game from localStorage:", error);
        // The loadGame function will handle fallback to cookies internally
        initGame();
      }
    } else {
      // No saved state, start a new game
      // The GameStateProvider will handle loading gamesWon from cookies if available
      initGame();
    }
  }, [loadGame, initGame]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleNewGame = useCallback(() => {
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

      {/* Win animations */}
      <WinAnimations isWon={state.gameWon ?? false} gamesWon={state.gamesWon} />

      <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{ pointerEvents: "none" }}>
        <div className="flex justify-between items-center">
          <div className="wooden-ui" style={{ pointerEvents: "auto" }}>
            <Menu />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={(state.gameWon ?? false) ? "win" : "normal"}
              className="wooden-ui" 
              style={{ pointerEvents: "auto" }}
              animate={(state.gameWon ?? false) ? {
                scale: [1, 1.2, 1],
                transition: { 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              } : {}}
            >
              <h1 className="text-2xl font-bold text-center text-amber-100">
                {(state.gameWon ?? false) ? "YOU WON!" : "Fifteen"}
              </h1>
              <motion.p 
                className="text-sm text-amber-200 text-center"
                animate={(state.gameWon ?? false) ? {
                  scale: [1, 1.3, 1],
                  color: [
                    "rgb(253, 230, 138)", // amber-200
                    "rgb(252, 211, 77)",  // amber-300
                    "rgb(251, 191, 36)",  // amber-400
                    "rgb(245, 158, 11)",  // amber-500
                    "rgb(253, 230, 138)"  // back to amber-200
                  ],
                  transition: { 
                    duration: 1, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                } : {}}
              >
                Games Won: {state.gamesWon}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          
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
    </div>
  );
}