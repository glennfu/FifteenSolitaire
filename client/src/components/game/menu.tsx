import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw } from "lucide-react";
import { useGameState } from "@/lib/game-state";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to reset all card animations
function resetAllCardAnimations() {
  // Reset all cards with smooth transitions
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const element = card as HTMLElement;
    // Use a smooth transition for returning cards
    element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out';
    element.style.transform = '';
    element.style.opacity = '1';
  });
  
  // Reset empty tile opacity with smooth transition
  const emptyTiles = document.querySelectorAll('.empty-tile');
  emptyTiles.forEach(tile => {
    const element = tile as HTMLElement;
    element.style.transition = 'opacity 0.3s ease-out';
    element.style.opacity = '1';
  });
  
  // Also cancel any ongoing animations by clearing all animation-related timeouts
  const highestId = Number(window.setTimeout(() => {}, 0));
  for (let i = 0; i < highestId; i++) {
    try {
      window.clearTimeout(i);
    } catch (e) {
      // Ignore errors from clearing invalid timeout IDs
    }
  }
}

export function Menu() {
  const { initGame, state, toggleDebug, solve } = useGameState();
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Function to handle new game button click
  const handleNewGameClick = () => {
    // Skip confirmation if game is already won
    if (state.gameWon) {
      resetAllCardAnimations();
      // Start new game after a short delay to allow transitions to complete
      setTimeout(() => {
        initGame();
      }, 50);
    } else {
      setShowNewGameDialog(true);
    }
  };

  // Function to start a new game
  const startNewGame = () => {
    setShowNewGameDialog(false);
    
    // First reset all animations
    resetAllCardAnimations();
    
    // Then start a new game after a short delay to allow transitions to complete
    setTimeout(() => {
      initGame();
    }, 50);
  };

  return (
    <>
      {/* New Game Button (keeping the refresh icon) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNewGameClick}
        aria-label="New Game"
        className="text-amber-100 hover:text-amber-50 hover:bg-transparent new-game-btn"
      >
        <RefreshCw className="h-6 w-6" />
      </Button>
      
      {/* New Game Confirmation Dialog */}
      <AlertDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start a new game? Your current progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startNewGame}>New Game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Keep the original menu functionality but hidden for now */}
      <div className="hidden">
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <RefreshCw className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => initGame()}>
              New Game
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => solve()}>
              Solve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleDebug()}>
              {state.debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}