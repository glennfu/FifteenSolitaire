import { Card } from "./card";
import { GamePile as GamePileType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      <AnimatePresence initial={false}>
        {pile.cards.map((card, index) => (
          <motion.div
            key={card.id}
            layout
            initial={false}
            animate={{
              y: index * 25,
              transition: {
                duration: 0.3,
                ease: "linear"
              }
            }}
            className="absolute w-full"
            style={{
              position: index === pile.cards.length - 1 ? "relative" : "absolute",
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
      </AnimatePresence>
    </div>
  );
}