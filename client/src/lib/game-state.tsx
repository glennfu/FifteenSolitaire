import { createContext, useContext, useCallback, useState } from "react";
import {
  GameState,
  Card,
  CardSuit,
  CardValue,
  GamePile
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

function isGoalState(piles: GamePile[]): boolean {
  return piles.every(pile =>
    pile.cards.length === 0 ||
    (pile.cards.length === 4 && pile.cards.every(card => card.value === pile.cards[0].value))
  );
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
      isEmpty: false
    }));

    // Distribute cards to piles
    let cardIndex = 0;
    piles.forEach((pile) => {
      pile.cards = deck.slice(cardIndex, cardIndex + 4);
      cardIndex += 4;
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
    setState(savedState);
  }, []);

  const toggleDebug = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        debugMode: !prev.debugMode
      };
      console.log("Debug mode toggled:", newState.debugMode);
      return newState;
    });
  }, []);

  const solve = useCallback(async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Get top card value from a pile, or null if empty
    function getTopValue(pile: GamePile): CardValue | null {
      return pile.cards.length > 0 ? pile.cards[pile.cards.length - 1].value : null;
    }

    // Create a simpler state representation for solving
    function toSimpleState(piles: GamePile[]): number[][] {
      return piles.map(pile => 
        pile.cards.map(card => card.value)
      );
    }

    function stateToString(state: number[][]): string {
      return state.map(pile => pile.length === 0 ? '-' : pile.join(',')).join('|');
    }

    // Try to find a solution
    function solve(startState: number[][]): {from: number, to: number}[] | null {
      const visited = new Set<string>();
      const stack: Array<{
        state: number[][],
        path: {from: number, to: number}[]
      }> = [{
        state: startState,
        path: []
      }];

      while (stack.length > 0) {
        const { state, path } = stack.pop()!;

        // Check if this is a winning state
        let completePiles = 0;
        let isWinning = true;
        for (const pile of state) {
          if (pile.length === 0) continue;
          if (pile.length !== 4) {
            isWinning = false;
            break;
          }
          if (!pile.every(v => v === pile[0])) {
            isWinning = false;
            break;
          }
          completePiles++;
        }

        if (isWinning && completePiles === 13) {
          return path;
        }

        // Skip if we've seen this state
        const stateKey = stateToString(state);
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        // Try all possible moves
        for (let from = 0; from < state.length; from++) {
          if (state[from].length === 0) continue;
          const card = state[from][state[from].length - 1];

          for (let to = 0; to < state.length; to++) {
            if (from === to) continue;

            // Valid moves: to empty pile or matching value with room
            if (state[to].length === 0 || 
                (state[to].length < 4 && state[to][state[to].length - 1] === card)) {
              // Make the move
              const nextState = state.map(pile => [...pile]);
              const movedCard = nextState[from].pop()!;
              nextState[to].push(movedCard);

              stack.push({
                state: nextState,
                path: [...path, { from, to }]
              });
            }
          }
        }
      }

      return null; // No solution found
    }

    console.log("Starting solve...");
    const simpleState = toSimpleState(state.piles);
    const solution = solve(simpleState);

    if (solution) {
      console.log("Solution found:", solution);
      // Execute the solution
      for (const move of solution) {
        makeMove(move.from);
        await sleep(300); // Animation delay
      }
    } else {
      console.log("No solution found");
    }
  }, [state.piles, makeMove]);

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