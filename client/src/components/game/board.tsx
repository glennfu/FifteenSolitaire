import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";

export function Board() {
  const { state, makeMove } = useGameState();

  return (
    <div 
      className="w-full max-w-3xl mx-auto grid grid-cols-5 gap-2" 
      style={{ 
        userSelect: "none",
        height: "calc(100vh - 6rem)", // Account for footer height + padding
        gridTemplateRows: "1fr 1fr 1fr",
      }}
    >
      {/* Add debug borders to visualize grid cells */}
      <div className="col-span-5 grid grid-cols-5 gap-2 border-2 border-blue-500 p-2">
        {state.piles.slice(0, 5).map((pile) => (
          <div key={pile.id} className="border-2 border-red-500">
            <Pile
              pile={pile}
              onCardClick={(pileId) => makeMove(pileId)}
            />
          </div>
        ))}
      </div>

      <div className="col-span-5 grid grid-cols-5 gap-2 border-2 border-green-500 p-2">
        {state.piles.slice(5, 10).map((pile) => (
          <div key={pile.id} className="border-2 border-red-500">
            <Pile
              pile={pile}
              onCardClick={(pileId) => makeMove(pileId)}
            />
          </div>
        ))}
      </div>

      <div className="col-span-5 grid grid-cols-5 gap-2 border-2 border-yellow-500 p-2">
        {state.piles.slice(10, 15).map((pile) => (
          <div key={pile.id} className="border-2 border-red-500">
            <Pile
              pile={pile}
              onCardClick={(pileId) => makeMove(pileId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}