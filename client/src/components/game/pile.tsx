import { Card } from "./card";
import { GamePile as GamePileType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PileProps {
  pile: GamePileType;
  onCardClick?: (pileId: number) => void;
  className?: string;
  disabled?: boolean;
  cardSize: { width: number; height: number };
  isOlderIOS?: boolean;
}

export function Pile({ pile, onCardClick, className, disabled, cardSize, isOlderIOS = false }: PileProps) {
  const topCard = pile.cards[pile.cards.length - 1];
  const [cardOffset, setCardOffset] = useState(25);

  // Calculate card offset based on card size
  useEffect(() => {
    if (cardSize.height > 0) {
      // Calculate offset as percentage of card height
      // Adjust based on device
      const offsetPercentage = isOlderIOS ? 0.25 : 0.3;
      const calculatedOffset = Math.round(cardSize.height * offsetPercentage);
      
      // Apply minimum and maximum constraints
      // Adjust based on device
      const minOffset = isOlderIOS ? 12 : 15;
      const maxOffset = isOlderIOS ? 30 : 40;
      const finalOffset = Math.max(minOffset, Math.min(calculatedOffset, maxOffset));
      
      setCardOffset(finalOffset);
    }
  }, [cardSize.height, isOlderIOS]);

  // Calculate total height needed for the pile
  const pileHeight = pile.cards.length === 0 
    ? cardSize.height 
    : cardSize.height + (cardOffset * (pile.cards.length - 1));

  return (
    <div 
      className={cn(
        "relative",
        pile.cards.length === 0 && "border-2 border-dashed border-gray-300 rounded-lg", 
        className
      )}
      style={{
        width: `${cardSize.width}px`,
        height: `${pileHeight}px`
      }}
    >
      {pile.cards.map((card, index) => (
        <motion.div
          key={card.id}
          layout
          initial={false}
          animate={{
            y: index * cardOffset
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
            width={cardSize.width}
            height={cardSize.height}
            isOlderIOS={isOlderIOS}
          />
        </motion.div>
      ))}
    </div>
  );
}