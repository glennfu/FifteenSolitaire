import { Card as CardType, CardSuit, CardValue } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function Card({ card, onClick, className, disabled }: CardProps) {
  const suitColor = card.suit === CardSuit.Hearts || card.suit === CardSuit.Diamonds
    ? "text-red-500"
    : "text-slate-900";

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
    [CardValue.King]: "K"
  }[card.value] || card.value.toString();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-16 h-24 bg-white rounded-lg shadow-sm border-2 border-gray-200",
        "flex flex-col items-center justify-center",
        "transition-transform hover:scale-105 active:scale-95",
        "disabled:opacity-50 disabled:hover:scale-100",
        className
      )}
    >
      <div className={cn("text-lg font-semibold", suitColor)}>
        {value}
      </div>
      <div className={cn("text-2xl", suitColor)}>
        {suitSymbol}
      </div>
    </button>
  );
}
