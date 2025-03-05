import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";

export function Board() {
  const { state, makeMove } = useGameState();

  return (
    <div 
      className="w-full max-w-7xl mx-auto grid grid-cols-5 gap-2 md:gap-4 lg:gap-6" 
      style={{ 
        userSelect: "none",
        height: "calc(100vh - 6rem)", // Account for footer height + padding
        gridTemplateRows: "1fr 1fr 1fr",
      }}
    >
      <div className="col-span-5 grid grid-cols-5 gap-2 md:gap-4 lg:gap-6">
        {state.piles.slice(0, 5).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
          />
        ))}
      </div>

      <div className="col-span-5 grid grid-cols-5 gap-2 md:gap-4 lg:gap-6">
        {state.piles.slice(5, 10).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
          />
        ))}
      </div>

      <div className="col-span-5 grid grid-cols-5 gap-2 md:gap-4 lg:gap-6">
        {state.piles.slice(10, 15).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
          />
        ))}
      </div>
    </div>
  );
}