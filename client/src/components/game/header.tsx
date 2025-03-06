import { Button } from "@/components/ui/button";
import { useGameState } from "@/lib/game-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { RefreshCw } from "lucide-react"; // Import the refresh icon

export function Header() {
  const { state, initGame } = useGameState();
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  
  // Keep the original menu function but don't use it for now
  const openMenu = () => {
    // Original menu opening logic
    console.log("Original menu function called");
  };
  
  // New function to handle new game button click
  const handleNewGameClick = () => {
    setShowNewGameDialog(true);
  };
  
  // Function to start a new game
  const startNewGame = () => {
    initGame();
    setShowNewGameDialog(false);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-background border-b">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Pyramid Solitaire</h1>
        <span className="ml-2 text-sm text-muted-foreground">
          Games Won: {state.gamesWon}
        </span>
      </div>
      
      {/* Replace hamburger icon with new game icon */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleNewGameClick}
        aria-label="New Game"
      >
        <RefreshCw className="h-5 w-5" />
      </Button>
      
      {/* New Game Confirmation Dialog */}
      <Dialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Game?</DialogTitle>
            <DialogDescription>
              Are you sure you want to start a new game? Your current progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={startNewGame}>
              New Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
} 