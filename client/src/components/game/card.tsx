import { Card as CardType, CardSuit, CardValue } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
    borderWidth: 1
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
      const calculatedBorderWidth = Math.max(1, Math.min(2, width * 0.008));
      
      setStyles({
        fontSize: calculatedFontSize,
        paddingTop: calculatedPaddingTop,
        paddingLeft: calculatedPaddingLeft,
        borderRadius: calculatedBorderRadius,
        borderWidth: calculatedBorderWidth
      });
    }
  }, [width, height, isOlderIOS]);

  const suitColor = card.suit === CardSuit.Hearts || card.suit === CardSuit.Diamonds
    ? "text-red-500 dark:text-red-400"
    : "text-slate-900 dark:text-slate-100";

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
        "bg-white dark:bg-slate-800",
        "border-gray-200 dark:border-gray-700",
        "hover:scale-105 active:scale-95",
        disabled && "hover:scale-100 active:scale-100",
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${styles.borderRadius}px`,
        borderWidth: `${styles.borderWidth}px`,
        borderStyle: 'solid'
      }}
    >
      <div 
        className="absolute flex gap-0.5"
        style={{
          top: `${styles.paddingTop}px`,
          left: `${styles.paddingLeft}px`,
        }}
      >
        <span 
          className={cn("font-semibold", suitColor)}
          style={{ fontSize: `${styles.fontSize}px`, lineHeight: 1 }}
        >
          {value}
        </span>
        <span 
          className={suitColor}
          style={{ fontSize: `${styles.fontSize}px`, lineHeight: 1 }}
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
          className={cn("font-semibold", suitColor)}
          style={{ fontSize: `${styles.fontSize}px`, lineHeight: 1 }}
        >
          {value}
        </span>
        <span 
          className={suitColor}
          style={{ fontSize: `${styles.fontSize}px`, lineHeight: 1 }}
        >
          {suitSymbol}
        </span>
      </div>
    </button>
  );
}