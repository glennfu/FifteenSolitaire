import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";
import { useGameState } from "@/lib/game-state";

export function Menu() {
  const { initGame, state, toggleDebug, solve } = useGameState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="h-6 w-6" />
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
  );
}