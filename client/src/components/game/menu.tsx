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

export function Menu() {
  const { initGame, state, toggleDebug, solve } = useGameState();
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Function to handle new game button click
  const handleNewGameClick = () => {
    setShowNewGameDialog(true);
  };
  
  // Function to start a new game
  const startNewGame = () => {
    initGame();
    setShowNewGameDialog(false);
  };

  return (
    <>
      {/* New Game Button (replacing the hamburger menu) */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleNewGameClick}
        aria-label="New Game"
        className="text-amber-100 hover:text-amber-50 hover:bg-transparent"
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