import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";

export function Board() {
  const { state, makeMove } = useGameState();

  return (
    <div 
      className="w-full max-w-3xl mx-auto grid grid-cols-5 gap-2" 
      style={{ 
        userSelect: "none",
        // Increase row height to accommodate stacked cards (6rem card + 2rem stacking space)
        gridTemplateRows: "repeat(3, minmax(8rem, 1fr))",
        paddingTop: "2rem" // Add some space from top
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