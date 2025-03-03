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
        "w-[4.5rem] h-[6rem] bg-white rounded-lg shadow-md border-2 border-gray-200",
        "relative",
        "transition-transform hover:scale-105 active:scale-95",
        disabled ? "opacity-75" : "opacity-100",
        className
      )}
    >
      <div className="absolute top-1 left-2 flex gap-1">
        <span className={cn("text-lg font-semibold", suitColor)}>{value}</span>
        <span className={cn("text-lg", suitColor)}>{suitSymbol}</span>
      </div>
      <div className="absolute bottom-1 right-2 flex gap-1 rotate-180">
        <span className={cn("text-lg font-semibold", suitColor)}>{value}</span>
        <span className={cn("text-lg", suitColor)}>{suitSymbol}</span>
      </div>
    </button>
  );
}