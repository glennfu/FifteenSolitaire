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
        "w-[4.5rem] h-[6rem] rounded-lg border-2",
        "relative",
        "transition-all duration-300 ease-in-out",
        "bg-white dark:bg-slate-800",
        "border-gray-200 dark:border-gray-700",
        "hover:scale-105 active:scale-95",
        disabled && "opacity-75 hover:scale-100 active:scale-100",
        className
      )}
    >
      <div className="absolute top-0.5 left-1.5 flex gap-0.5">
        <span className={cn("text-lg font-semibold", suitColor)}>{value}</span>
        <span className={cn("text-lg", suitColor)}>{suitSymbol}</span>
      </div>
      <div className="absolute bottom-0.5 right-1.5 flex gap-0.5 rotate-180">
        <span className={cn("text-lg font-semibold", suitColor)}>{value}</span>
        <span className={cn("text-lg", suitColor)}>{suitSymbol}</span>
      </div>
    </button>
  );
}