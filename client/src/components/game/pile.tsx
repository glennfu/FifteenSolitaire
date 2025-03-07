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

  // Handler for clicking anywhere on the pile
  const handlePileClick = () => {
    if (!disabled && pile.cards.length > 0) {
      onCardClick?.(pile.id);
    }
  };

  return (
    <div 
      className={cn(
        "relative",
        pile.cards.length === 0 && "border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-opacity-30 bg-gray-100 dark:bg-gray-800", 
        className,
        pile.cards.length > 0 && !disabled && "cursor-pointer"
      )}
      style={{
        width: `${cardSize.width}px`,
        height: `${pileHeight}px`,
        boxShadow: pile.cards.length === 0 ? 'inset 0 0 10px rgba(0, 0, 0, 0.05)' : 'none'
      }}
      onClick={handlePileClick}
    >
      {pile.cards.map((card, index) => {
        // Generate a truly random rotation for each card
        // Use the card's ID to create a consistent but unique rotation for each card
        const cardIdSum = card.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const randomRotation = ((cardIdSum % 3) - 1) * 0.8; // -0.8 to +0.8 degrees (slightly reduced)
        
        return (
          <motion.div
            key={card.id}
            layout
            initial={false}
            animate={{
              y: index * cardOffset,
              rotate: randomRotation,
              zIndex: index
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{
              position: 'absolute',
              width: '100%',
              pointerEvents: 'none',
              filter: `drop-shadow(0 ${Math.min(3, index)}px ${Math.min(2, index)}px rgba(0, 0, 0, 0.1))`
            }}
          >
            <Card
              card={card}
              disabled={true}
              width={cardSize.width}
              height={cardSize.height}
              isOlderIOS={isOlderIOS}
            />
          </motion.div>
        );
      })}
    </div>
  );
}