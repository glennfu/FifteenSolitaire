import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";

export function Board() {
  const { state, makeMove } = useGameState();

  return (
    <div className="grid grid-cols-5 gap-4 justify-items-center">
      {/* First row - 5 piles */}
      {state.piles.slice(0, 5).map((pile) => (
        <Pile
          key={pile.id}
          pile={pile}
          onCardClick={(pileId) => makeMove(pileId)}
        />
      ))}
      
      {/* Middle row - 3 piles */}
      <div className="col-span-5 grid grid-cols-3 gap-4 justify-items-center w-full">
        {state.piles.slice(5, 8).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
          />
        ))}
      </div>
      
      {/* Bottom row - 5 piles */}
      {state.piles.slice(8, 13).map((pile) => (
        <Pile
          key={pile.id}
          pile={pile}
          onCardClick={(pileId) => makeMove(pileId)}
        />
      ))}
    </div>
  );
}
