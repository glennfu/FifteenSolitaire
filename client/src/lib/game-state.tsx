import { createContext, useContext, useCallback, useState } from "react";
import {
  GameState,
  Card,
  CardSuit,
  CardValue,
  gameStateSchema
} from "@shared/schema";

interface GameContextType {
  state: GameState;
  makeMove: (pileId: number) => void;
  undo: () => void;
  initGame: () => void;
  loadGame: (state: GameState) => void;
  validateMove: (fromPile: number, toPile: number) => boolean;
  toggleDebug: () => void;
  solve: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

function shuffleDeck(): Card[] {
  const deck: Card[] = [];
  Object.values(CardSuit).forEach(suit => {
    Object.values(CardValue).forEach(value => {
      if (typeof value === "number") {
        deck.push({
          suit,
          value,
          id: `${suit}-${value}`
        });
      }
    });
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

interface GamePile {
  id: number;
  cards: Card[];
  isEmpty: boolean;
}

interface GameState {
  piles: GamePile[];
  moveHistory: {
    fromPile: number;
    toPile: number;
    card: Card;
  }[];
  gamesWon: number;
  debugMode: boolean;
  gameWon: boolean;
}


export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>({
    piles: [],
    moveHistory: [],
    gamesWon: 0,
    debugMode: false,
    gameWon: false
  });

  const initGame = useCallback(() => {
    const deck = shuffleDeck();
    const piles = Array(15).fill(null).map((_, index) => ({
      id: index,
      cards: [],
      isEmpty: (index + 1) === 6 || (index + 1) === 10
    }));

    // Distribute cards to non-empty piles
    let cardIndex = 0;
    piles.forEach((pile) => {
      if (!pile.isEmpty) {
        pile.cards = deck.slice(cardIndex, cardIndex + 4);
        cardIndex += 4;
      }
    });

    setState(prev => ({
      ...prev,
      piles,
      moveHistory: [],
      gameWon: false
    }));
  }, []);

  const validateMove = useCallback((fromPile: number, toPile: number): boolean => {
    const sourcePile = state.piles[fromPile];
    const targetPile = state.piles[toPile];
    
    if (!sourcePile || !targetPile) return false;
    if (sourcePile.cards.length === 0) return false;
    
    const movingCard = sourcePile.cards[sourcePile.cards.length - 1];
    
    // Can always move to empty pile
    if (targetPile.cards.length === 0) return true;
    
    // Can stack on matching values when pile isn't full
    const topCard = targetPile.cards[targetPile.cards.length - 1];
    return topCard.value === movingCard.value && targetPile.cards.length < 4;
  }, [state.piles]);

  const makeMove = useCallback((pileId: number) => {
    setState(prev => {
      // Find first valid move for the selected pile
      const fromPile = prev.piles[pileId];
      if (!fromPile || fromPile.cards.length === 0) return prev;

      const validMove = prev.piles.findIndex((pile, index) => 
        index !== pileId && validateMove(pileId, index)
      );

      if (validMove === -1) return prev;

      const newPiles = [...prev.piles];
      const movingCard = fromPile.cards[fromPile.cards.length - 1];

      // Remove card from source pile
      newPiles[pileId] = {
        ...fromPile,
        cards: fromPile.cards.slice(0, -1)
      };

      // Add card to target pile
      newPiles[validMove] = {
        ...newPiles[validMove],
        cards: [...newPiles[validMove].cards, movingCard]
      };

      // Record move in history
      const newHistory = [...prev.moveHistory, {
        fromPile: pileId,
        toPile: validMove,
        card: movingCard
      }];

      // Check win condition
      const hasWon = newPiles.every(pile => 
        pile.cards.length === 0 || 
        (pile.cards.length === 4 && pile.cards.every(card => card.value === pile.cards[0].value))
      );

      return {
        ...prev,
        piles: newPiles,
        moveHistory: newHistory,
        gamesWon: hasWon ? prev.gamesWon + 1 : prev.gamesWon,
        gameWon: hasWon
      };
    });
  }, [validateMove]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.moveHistory.length === 0) return prev;
      
      const lastMove = prev.moveHistory[prev.moveHistory.length - 1];
      const newPiles = [...prev.piles];
      
      // Remove card from target pile
      newPiles[lastMove.toPile] = {
        ...newPiles[lastMove.toPile],
        cards: newPiles[lastMove.toPile].cards.slice(0, -1)
      };
      
      // Add card back to source pile
      newPiles[lastMove.fromPile] = {
        ...newPiles[lastMove.fromPile],
        cards: [...newPiles[lastMove.fromPile].cards, lastMove.card]
      };
      
      return {
        ...prev,
        piles: newPiles,
        moveHistory: prev.moveHistory.slice(0, -1)
      };
    });
  }, []);

  const loadGame = useCallback((savedState: GameState) => {
    const parsed = gameStateSchema.safeParse(savedState);
    if (parsed.success) {
      setState(parsed.data);
    } else {
      throw new Error("Invalid game state");
    }
  }, []);

  const toggleDebug = useCallback(() => {
    setState(prev => ({
      ...prev,
      debugMode: !prev.debugMode
    }));
  }, []);

  const solve = useCallback(async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Find all potential matches for each card value
    const findPotentialMoves = () => {
      const matches = new Map<CardValue, {
        sourcePiles: number[],
        targetPiles: number[]
      }>();

      // First catalog all card values and their locations
      state.piles.forEach((pile, pileIndex) => {
        if (pile.cards.length === 0 || pile.cards.length >= 4) return;

        const topCard = pile.cards[pile.cards.length - 1];

        if (!matches.has(topCard.value)) {
          matches.set(topCard.value, {
            sourcePiles: [],
            targetPiles: []
          });
        }

        const entry = matches.get(topCard.value)!;

        // If pile has matching cards, it's a potential target
        if (pile.cards.every(c => c.value === topCard.value)) {
          entry.targetPiles.push(pileIndex);
        }

        // Any pile with a matching top card is a potential source
        entry.sourcePiles.push(pileIndex);
      });

      return matches;
    };

    const findBestMove = (): { fromPile: number, toPile: number } | null => {
      const potentialMoves = findPotentialMoves();

      // First priority: Complete a pile that's already started
      for (const [_, { sourcePiles, targetPiles }] of potentialMoves) {
        for (const toPile of targetPiles) {
          const targetPileCards = state.piles[toPile].cards;
          if (targetPileCards.length >= 4) continue;

          for (const fromPile of sourcePiles) {
            if (fromPile === toPile) continue;
            if (validateMove(fromPile, toPile)) {
              return { fromPile, toPile };
            }
          }
        }
      }

      // Second priority: Start a new group in an empty pile
      const emptyPiles = state.piles
        .map((pile, index) => ({ index, isEmpty: pile.cards.length === 0 }))
        .filter(p => p.isEmpty)
        .map(p => p.index);

      if (emptyPiles.length > 0) {
        // Look for cards that have matches elsewhere
        for (const [_, { sourcePiles }] of potentialMoves) {
          if (sourcePiles.length >= 2) {
            const fromPile = sourcePiles[0];
            const toPile = emptyPiles[0];
            if (validateMove(fromPile, toPile)) {
              return { fromPile, toPile };
            }
          }
        }
      }

      return null;
    };

    let moveCount = 0;
    const maxMoves = 50; // Prevent infinite loops

    while (moveCount < maxMoves && !state.gameWon) {
      const move = findBestMove();
      if (!move) break;

      makeMove(move.fromPile);
      await sleep(300); // Match animation duration
      moveCount++;
    }
  }, [state, makeMove, validateMove]);

  // Save state to localStorage whenever it changes
  useCallback(() => {
    localStorage.setItem("gameState", JSON.stringify(state));
  }, [state]);

  return (
    <GameContext.Provider 
      value={{
        state,
        makeMove,
        undo,
        initGame,
        loadGame,
        validateMove,
        toggleDebug,
        solve
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}