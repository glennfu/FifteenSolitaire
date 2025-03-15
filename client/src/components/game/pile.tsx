import { Card } from "./card";
import { GamePile } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface PileProps {
  pile: GamePile;
  onCardClick: (pileId: number) => void;
  cardSize: { width: number; height: number };
  isOlderIOS: boolean;
  children?: React.ReactNode;
  stackingOffset?: number;
}

export function Pile({ pile, onCardClick, cardSize, isOlderIOS, children, stackingOffset }: PileProps) {
  const topCard = pile.cards[pile.cards.length - 1];
  const [cardOffset, setCardOffset] = useState(25);
  // Store the initial pile height in a ref to keep it consistent
  const fixedHeightRef = useRef<number | null>(null);
  // Add a ref to track if we need to reset the pile
  const resetRef = useRef<boolean>(true);

  // Calculate card offset based on card size
  useEffect(() => {
    if (cardSize.height > 0) {
      // Reset the fixed height ref when card size changes
      fixedHeightRef.current = null;
      resetRef.current = true;
      
      // If a specific stackingOffset is provided, use that
      if (stackingOffset !== undefined) {
        const calculatedOffset = Math.round(cardSize.height * stackingOffset);
        setCardOffset(calculatedOffset);
      } else {
        // Otherwise calculate offset as percentage of card height
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
      
      // Calculate a fixed height for the pile based on maximum possible cards (5)
      // This will only be set once when the component mounts or when cardSize changes
      if (fixedHeightRef.current === null) {
        const maxCards = 5; // Maximum number of cards in a pile
        const maxOffset = stackingOffset !== undefined 
          ? Math.round(cardSize.height * stackingOffset)
          : cardOffset;
        const maxHeight = cardSize.height + (maxOffset * (maxCards - 1));
        fixedHeightRef.current = maxHeight;
      }
    }
  }, [cardSize.height, isOlderIOS, stackingOffset]);

  // Always use the fixed height, regardless of the number of cards
  // This ensures the layout never shifts when cards are moved
  const pileHeight = fixedHeightRef.current || cardSize.height * 3;

  // Handler for clicking anywhere on the pile
  const handlePileClick = () => {
    if (pile.cards.length > 0) {
      onCardClick(pile.id);
    }
  };

  return (
    <div 
      className={cn(
        "relative",
        (pile.isEmpty || pile.cards.length === 0) && "min-h-[100px]",
        pile.cards.length > 0 && "cursor-pointer"
      )}
      style={{
        width: `${cardSize.width}px`,
        height: `${pileHeight}px`
      }}
      onClick={handlePileClick}
    >
      {pile.cards.length === 0 ? (
        // Render empty tile outline
        children
      ) : (
        // Render cards with proper stacking
        pile.cards.map((card, index) => {
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
                duration: 0.0,
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
        })
      )}
    </div>
  );
}