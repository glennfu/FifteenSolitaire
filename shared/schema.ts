import { z } from "zod";

export enum CardSuit {
  Hearts = "hearts",
  Diamonds = "diamonds",
  Clubs = "clubs",
  Spades = "spades"
}

export enum CardValue {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13
}

export interface Card {
  suit: CardSuit;
  value: CardValue;
  id: string;
}

export interface GamePile {
  id: number;
  cards: Card[];
  isEmpty: boolean;
}

export interface GameState {
  piles: GamePile[];
  moveHistory: {
    fromPile: number;
    toPile: number;
    card: Card;
  }[];
  gamesWon: number;
  debugMode: boolean;
}

export const cardSchema = z.object({
  suit: z.nativeEnum(CardSuit),
  value: z.nativeEnum(CardValue),
  id: z.string()
});

export const gamePileSchema = z.object({
  id: z.number(),
  cards: z.array(cardSchema),
  isEmpty: z.boolean()
});

export const gameStateSchema = z.object({
  piles: z.array(gamePileSchema),
  moveHistory: z.array(z.object({
    fromPile: z.number(),
    toPile: z.number(),
    card: cardSchema
  })),
  gamesWon: z.number(),
  debugMode: z.boolean()
});
