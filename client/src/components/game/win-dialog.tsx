import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy } from "lucide-react";

interface WinDialogProps {
  isOpen: boolean;
  onNewGame: () => void;
}

export function WinDialog({ isOpen, onNewGame }: WinDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Congratulations!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center py-4">
            You've won the game! All card piles have been perfectly matched.
            Would you like to start a new game?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onNewGame} className="w-full">
            Start New Game
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
