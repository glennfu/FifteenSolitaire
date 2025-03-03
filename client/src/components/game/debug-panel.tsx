import { useGameState } from "@/lib/game-state";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DebugPanel() {
  const { state, validateMove } = useGameState();

  return (
    <Card className="mt-8 p-4">
      <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
      <ScrollArea className="h-48">
        <div className="space-y-2">
          <div>
            <h3 className="font-medium">Move History:</h3>
            {state.moveHistory.map((move, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                Moved {move.card.value} of {move.card.suit} from pile {move.fromPile} to {move.toPile}
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-medium">Pile States:</h3>
            {state.piles.map((pile) => (
              <div key={pile.id} className="text-sm text-muted-foreground">
                Pile {pile.id}: {pile.cards.length} cards
                {pile.cards.length > 0 && (
                  ` (Top: ${pile.cards[pile.cards.length - 1].value} of ${
                    pile.cards[pile.cards.length - 1].suit
                  })`
                )}
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-medium">Valid Moves:</h3>
            {state.piles.map((fromPile) => (
              <div key={fromPile.id}>
                {state.piles.map((toPile) => {
                  if (fromPile.id === toPile.id) return null;
                  const isValid = validateMove(fromPile.id, toPile.id);
                  if (!isValid) return null;
                  return (
                    <div key={toPile.id} className="text-sm text-green-600">
                      Can move from pile {fromPile.id} to {toPile.id}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
