import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";

export function Board() {
  const { state, makeMove } = useGameState();

  return (
    <div 
      className="w-full max-w-3xl mx-auto grid grid-cols-5 grid-rows-3 gap-2" 
      style={{ 
        userSelect: "none",
        // Each pile needs about 8rem height (considering card height + stacking)
        gridTemplateRows: "8rem 8rem 8rem"
      }}
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