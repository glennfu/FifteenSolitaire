import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";

export function Board() {
  const { state, makeMove } = useGameState();

  return (
    <div 
      className="grid grid-cols-5 gap-y-12 gap-x-4 justify-items-center h-[700px]" 
      style={{ userSelect: "none" }}
    >
      {/* First row - 5 piles */}
      {state.piles.slice(0, 5).map((pile) => (
        <Pile
          key={pile.id}
          pile={pile}
          onCardClick={(pileId) => makeMove(pileId)}
        />
      ))}

      {/* Middle row - 5 piles */}
      {state.piles.slice(5, 10).map((pile) => (
        <Pile
          key={pile.id}
          pile={pile}
          onCardClick={(pileId) => makeMove(pileId)}
        />
      ))}

      {/* Bottom row - 5 piles */}
      {state.piles.slice(10, 15).map((pile) => (
        <Pile
          key={pile.id}
          pile={pile}
          onCardClick={(pileId) => makeMove(pileId)}
        />
      ))}
    </div>
  );
}