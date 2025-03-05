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
}

export function Pile({ pile, onCardClick, className, disabled }: PileProps) {
  const topCard = pile.cards[pile.cards.length - 1];
  const [cardOffset, setCardOffset] = useState(25);

  // Adjust card offset based on viewport height and card size
  useEffect(() => {
    const updateOffset = () => {
      // Base card heights at different breakpoints (matching the Card component)
      const smallCardHeight = 96; // 6rem in pixels
      const mediumCardHeight = 120; // 7.5rem in pixels
      const largeCardHeight = 152; // 9.5rem in pixels
      
      // Determine current card height based on screen size
      let currentCardHeight;
      if (window.innerWidth >= 1024) {
        currentCardHeight = largeCardHeight;
      } else if (window.innerWidth >= 768) {
        currentCardHeight = mediumCardHeight;
      } else {
        currentCardHeight = smallCardHeight;
      }
      
      // Calculate offset as a percentage of card height
      // Reduced percentage for more compact stacking
      const offsetPercentage = 0.3;
      const calculatedOffset = Math.round(currentCardHeight * offsetPercentage);
      
      // Apply minimum and maximum constraints
      const minOffset = 20;
      const maxOffset = 50;
      const finalOffset = Math.max(minOffset, Math.min(calculatedOffset, maxOffset));
      
      setCardOffset(finalOffset);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  return (
    <div 
      className={cn(
        "relative w-[4.5rem] md:w-[5.5rem] lg:w-[7rem]",
        pile.cards.length === 0 ? "h-[6rem] md:h-[7.5rem] lg:h-[9.5rem]" : "min-h-[9rem] md:min-h-[11rem] lg:min-h-[14rem]", 
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
          />
        </motion.div>
      ))}
    </div>
  );
}