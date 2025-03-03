import { Card } from "./card";
import { GamePile as GamePileType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PileProps {
  pile: GamePileType;
  onCardClick?: (pileId: number) => void;
  className?: string;
  disabled?: boolean;
}

export function Pile({ pile, onCardClick, className, disabled }: PileProps) {
  const topCard = pile.cards[pile.cards.length - 1];

  return (
    <div 
      className={cn(
        "relative w-16 h-24",
        pile.isEmpty && "border-2 border-dashed border-gray-300 rounded-lg",
        className
      )}
    >
      {pile.cards.map((card, index) => (
        <div
          key={card.id}
          className={cn(
            "absolute",
            index === pile.cards.length - 1 ? "relative" : "",
            "transition-transform",
            index > 0 && "top-0"
          )}
          style={{
            transform: `translateY(${index * 2}px)`
          }}
        >
          <Card
            card={card}
            onClick={() => onCardClick?.(pile.id)}
            disabled={!topCard || card.id !== topCard.id || disabled}
          />
        </div>
      ))}
    </div>
  );
}
