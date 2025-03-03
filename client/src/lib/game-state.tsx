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

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>({
    piles: [],
    moveHistory: [],
    gamesWon: 0,
    debugMode: false
  });

  const initGame = useCallback(() => {
    const deck = shuffleDeck();
    const piles = Array(15).fill(null).map((_, index) => ({
      id: index,
      cards: [],
      isEmpty: index === 5 || index === 9 // Keep piles 5 and 9 empty
    }));

    // Distribute cards only to non-empty piles
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
      moveHistory: []
    }));
  }, []);

  const validateMove = useCallback((fromPile: number, toPile: number): boolean => {
    const sourcePile = state.piles[fromPile];
    const targetPile = state.piles[toPile];

    if (!sourcePile || !targetPile) return false;
    if (sourcePile.cards.length === 0) return false;

    const movingCard = sourcePile.cards[sourcePile.cards.length - 1];

    // Check if move is to empty pile
    if (targetPile.cards.length === 0) {
      // Only allow if there are matching cards elsewhere
      const hasMatches = state.piles.some((pile, i) =>
        i !== fromPile && i !== toPile &&
        pile.cards.length > 0 &&
        pile.cards[pile.cards.length - 1].value === movingCard.value
      );
      return hasMatches;
    }

    // Check if move is stacking on matching value
    const topCard = targetPile.cards[targetPile.cards.length - 1];
    return topCard.value === movingCard.value && targetPile.cards.length < 4;
  }, [state.piles]);

  const makeMove = useCallback((fromPile: number) => {
    setState(prev => {
      const sourcePile = prev.piles[fromPile];
      if (!sourcePile || sourcePile.cards.length === 0) return prev;

      // Find all valid target piles
      const validTargets = prev.piles
        .map((_, index) => index)
        .filter(index => index !== fromPile && validateMove(fromPile, index));

      if (validTargets.length === 0) return prev;

      // Prioritize moves that complete sets
      const targetPileIndex = validTargets.reduce((best, current) => {
        const currentPile = prev.piles[current];
        const bestPile = prev.piles[best];
        // Prefer piles that would be completed (have 3 cards)
        if (currentPile.cards.length === 3 && bestPile.cards.length !== 3) return current;
        if (bestPile.cards.length === 3 && currentPile.cards.length !== 3) return best;
        // Otherwise prefer piles with more matching cards
        return current;
      }, validTargets[0]);

      const newPiles = [...prev.piles];
      const movingCard = sourcePile.cards[sourcePile.cards.length - 1];

      // Update source pile
      newPiles[fromPile] = {
        ...sourcePile,
        cards: sourcePile.cards.slice(0, -1),
        isEmpty: sourcePile.isEmpty // Keep original isEmpty state
      };

      // Update target pile
      newPiles[targetPileIndex] = {
        ...newPiles[targetPileIndex],
        cards: [...newPiles[targetPileIndex].cards, movingCard],
        isEmpty: false // Keep original isEmpty state
      };

      // Check for win condition
      const hasWon = newPiles.every(pile =>
        pile.cards.length === 0 ||
        (pile.cards.length === 4 && pile.cards.every(card => card.value === pile.cards[0].value))
      );

      return {
        ...prev,
        piles: newPiles,
        moveHistory: [...prev.moveHistory, {
          fromPile,
          toPile: targetPileIndex,
          card: movingCard
        }],
        gamesWon: hasWon ? prev.gamesWon + 1 : prev.gamesWon
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
        cards: newPiles[lastMove.toPile].cards.slice(0, -1),
        isEmpty: newPiles[lastMove.toPile].cards.length === 1
      };

      // Add card back to source pile
      newPiles[lastMove.fromPile] = {
        ...newPiles[lastMove.fromPile],
        cards: [...newPiles[lastMove.fromPile].cards, lastMove.card],
        isEmpty: false
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
    setState(prev => ({
      ...prev,
      debugMode: !prev.debugMode
    }));
  }, []);

  const solve = useCallback(async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Simple state with just card values (ranks)
    type State = number[][];
    type Move = { from: number, to: number };

    function toSimpleState(): State {
      return state.piles.map(pile => pile.cards.map(card => card.value));
    }

    function getCompleteSets(state: State): number {
      return state.filter(pile =>
        pile.length === 4 && pile.every(v => v === pile[0])
      ).length;
    }

    function logMove(state: State, move: Move) {
      const fromPile = state[move.from];
      const toPile = state[move.to];
      const movingCard = fromPile[fromPile.length - 1];
      const toCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;
      console.log(
        `Moving ${movingCard} from pile ${move.from} (${fromPile.join(',')}) ` +
        `to pile ${move.to} (${toPile.length > 0 ? toPile.join(',') : 'empty'})`
      );
    }

    function stateToString(state: State): string {
      // Sort piles by content to detect equivalent states
      return state
        .map(pile => pile.length === 0 ? '-' : [...pile].sort((a, b) => a - b).join(','))
        .sort()
        .join('|');
    }

    function getValidMoves(state: State): Move[] {
      const moves: Move[] = [];
      const completedRanks = new Set<number>();

      // First identify completed ranks
      state.forEach(pile => {
        if (pile.length === 4 && pile.every(v => v === pile[0])) {
          completedRanks.add(pile[0]);
        }
      });

      // Find and sort moves by priority
      const prioritizedMoves: Move[] = [];
      const otherMoves: Move[] = [];

      for (let from = 0; from < state.length; from++) {
        if (state[from].length === 0) continue;
        const card = state[from][state[from].length - 1];

        // Skip moving cards that are part of completed ranks
        if (completedRanks.has(card)) continue;

        for (let to = 0; to < state.length; to++) {
          if (from === to) continue;

          // Skip if the move wouldn't be valid in the game
          if (!validateMove(from, to)) continue;

          if (state[to].length === 0) {
            // For empty piles, verify there are other matching cards
            const hasMatches = state.some((pile, i) =>
              i !== from && i !== to &&
              pile.length > 0 &&
              pile[pile.length - 1] === card
            );
            if (hasMatches) {
              otherMoves.push({ from, to });
            }
          } else if (state[to].length < 4) {
            const topCard = state[to][state[to].length - 1];
            if (topCard === card) {
              // Prioritize moves that build/complete sets
              if (state[to].length === 3) {
                prioritizedMoves.unshift({ from, to });
              } else {
                prioritizedMoves.push({ from, to });
              }
            }
          }
        }
      }

      return [...prioritizedMoves, ...otherMoves];
    }

    function applyMove(state: State, move: Move): State {
      const newState = state.map(pile => [...pile]);
      const card = newState[move.from].pop()!;
      newState[move.to].push(card);
      return newState;
    }

    async function dfs(
      state: State,
      path: Move[] = [],
      visited = new Set<string>(),
      depth = 0
    ): Promise<Move[] | null> {
      if (depth % 10 === 0) {
        console.log(`\nDepth ${depth}:`);
        console.log(`Complete sets: ${getCompleteSets(state)}`);
        console.log(`Visited states: ${visited.size}`);
        await sleep(0);
      }

      // Check for solution
      const completeSets = getCompleteSets(state);
      if (completeSets === 13) {
        console.log("\nFound winning state!");
        return path;
      }

      // Get state signature and check for cycles
      const stateKey = stateToString(state);
      if (visited.has(stateKey)) return null;
      visited.add(stateKey);

      // Get valid moves
      const moves = getValidMoves(state);

      // Try each move
      for (const move of moves) {
        // Log move details
        if (depth % 10 === 0) {
          logMove(state, move);
        }

        const nextState = applyMove(state, move);
        const nextSets = getCompleteSets(nextState);

        // Log when we complete a new set
        if (nextSets > completeSets) {
          console.log(`\nCompleted new set at depth ${depth}:`);
          logMove(state, move);
        }

        // Try this move
        const result = await dfs(nextState, [...path, move], visited, depth + 1);
        if (result) return result;
      }

      return null;
    }

    // Start solving
    console.log("\nStarting solve...");
    const initialState = toSimpleState();
    console.log("Initial state:", initialState);

    const solution = await dfs(initialState);

    if (solution) {
      console.log(`\nFound solution with ${solution.length} moves!`);
      for (const move of solution) {
        logMove(initialState, move);
        if (validateMove(move.from, move.to)) {
          makeMove(move.from);
          await sleep(300);
        } else {
          console.error("Invalid move in solution:", move);
          return;
        }
      }
    } else {
      console.log("\nNo solution found");
    }
  }, [state.piles, makeMove, validateMove]);

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