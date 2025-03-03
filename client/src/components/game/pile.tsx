import { Card } from "./card";
import { GamePile as GamePileType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
        "relative w-[4.5rem]",
        pile.cards.length === 0 ? "h-[6rem]" : "min-h-[9rem]", 
        pile.cards.length === 0 && "border-2 border-dashed border-gray-300 rounded-lg", 
        className
      )}
    >
      {pile.cards.map((card, index) => (
        <motion.div
          key={card.id}
          layout
          initial={false}
          animate={{
            y: index * 25
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            position: 'absolute',
            width: '100%',
            zIndex: index,
          }}
        >
          <Card
            card={card}
            onClick={() => onCardClick?.(pile.id)}
            disabled={!topCard || card.id !== topCard.id || disabled}
          />
        </motion.div>
      ))}
    </div>
  );
}