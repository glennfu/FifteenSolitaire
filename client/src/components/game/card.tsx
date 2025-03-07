import { Card as CardType, CardSuit, CardValue } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { textures } from "@/lib/utils";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  width: number;
  height: number;
  isOlderIOS?: boolean;
}

export function Card({ card, onClick, className, disabled, width, height, isOlderIOS = false }: CardProps) {
  const [styles, setStyles] = useState({
    fontSize: 18,
    paddingTop: 4,
    paddingLeft: 4,
    borderRadius: 5,
    borderWidth: 1,
    shadowBlur: 4,
    shadowOffset: 2
  });
  
  // Calculate styles when dimensions change
  useEffect(() => {
    if (width > 0 && height > 0) {
      // Font size: adjust based on device
      const fontSizePercent = isOlderIOS ? 0.22 : 0.25;
      const calculatedFontSize = Math.max(isOlderIOS ? 12 : 14, Math.min(isOlderIOS ? 30 : 36, width * fontSizePercent));
      
      // Padding: adjust based on device
      const paddingTopPercent = 0.04;
      const paddingLeftPercent = isOlderIOS ? 0.04 : 0.05;
      const calculatedPaddingTop = Math.max(2, Math.min(10, height * paddingTopPercent));
      const calculatedPaddingLeft = Math.max(isOlderIOS ? 2 : 3, Math.min(10, width * paddingLeftPercent));
      
      // Border properties
      const borderRadiusPercent = isOlderIOS ? 0.03 : 0.04;
      const calculatedBorderRadius = Math.max(isOlderIOS ? 4 : 6, Math.min(isOlderIOS ? 10 : 12, width * borderRadiusPercent));
      const calculatedBorderWidth = Math.max(1, Math.min(2, width * 0.02));
      
      // Shadow properties
      const shadowBlur = Math.max(2, Math.min(8, width * 0.03));
      const shadowOffset = Math.max(1, Math.min(4, width * 0.015));
      
      setStyles({
        fontSize: calculatedFontSize,
        paddingTop: calculatedPaddingTop,
        paddingLeft: calculatedPaddingLeft,
        borderRadius: calculatedBorderRadius,
        borderWidth: calculatedBorderWidth,
        shadowBlur,
        shadowOffset
      });
    }
  }, [width, height, isOlderIOS]);

  const suitColor = card.suit === CardSuit.Hearts || card.suit === CardSuit.Diamonds
    ? "#c41e3a"
    : card.suit === CardSuit.Clubs 
      ? "#000000"
      : "#1a1a1a";

  const suitSymbol = {
    [CardSuit.Hearts]: "♥",
    [CardSuit.Diamonds]: "♦",
    [CardSuit.Clubs]: "♣",
    [CardSuit.Spades]: "♠"
  }[card.suit];

  const value = {
    [CardValue.Ace]: "A",
    [CardValue.Jack]: "J",
    [CardValue.Queen]: "Q",
    [CardValue.King]: "K",
    [CardValue.Two]: "2",
    [CardValue.Three]: "3",
    [CardValue.Four]: "4",
    [CardValue.Five]: "5",
    [CardValue.Six]: "6",
    [CardValue.Seven]: "7",
    [CardValue.Eight]: "8",
    [CardValue.Nine]: "9",
    [CardValue.Ten]: "10"
  }[card.value];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "card",
        "relative",
        "transition-all duration-300 ease-in-out",
        "hover:scale-105 active:scale-95",
        disabled && "hover:scale-100 active:scale-100",
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${styles.borderRadius}px`,
        borderWidth: `${styles.borderWidth}px`,
        borderStyle: 'solid',
        borderColor: 'rgb(200, 200, 200)',
        boxShadow: `0 ${styles.shadowOffset}px ${styles.shadowBlur}px rgba(0, 0, 0, 0.2)`,
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Add noise texture overlay with reduced opacity */}
      <div className="absolute inset-0 noise-texture card-noise" />
      
      <div 
        className="absolute flex gap-0.5"
        style={{
          top: `${styles.paddingTop}px`,
          left: `${styles.paddingLeft}px`,
        }}
      >
        <span 
          className="font-bold"
          style={{ 
            fontSize: `${styles.fontSize}px`, 
            lineHeight: 1,
            color: suitColor 
          }}
        >
          {value}
        </span>
        <span 
          style={{ 
            fontSize: `${styles.fontSize}px`, 
            lineHeight: 1,
            color: suitColor 
          }}
        >
          {suitSymbol}
        </span>
      </div>
      <div 
        className="absolute flex gap-0.5 rotate-180"
        style={{
          bottom: `${styles.paddingTop}px`,
          right: `${styles.paddingLeft}px`,
        }}
      >
        <span 
          className="font-bold"
          style={{ 
            fontSize: `${styles.fontSize}px`, 
            lineHeight: 1,
            color: suitColor 
          }}
        >
          {value}
        </span>
        <span 
          style={{ 
            fontSize: `${styles.fontSize}px`, 
            lineHeight: 1,
            color: suitColor 
          }}
        >
          {suitSymbol}
        </span>
      </div>
      
      {/* Center suit for visual appeal */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          top: '50%',
          left: '50%',
          fontSize: `${styles.fontSize * 2}px`,
          opacity: 1,
          color: suitColor
        }}
      >
        {suitSymbol}
      </div>
    </button>
  );
}