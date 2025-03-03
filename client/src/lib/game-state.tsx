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
      isEmpty: index === 5 || index === 9 // Piles 6 and 10 (0-based index)
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
      moveHistory: []
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
        gamesWon: hasWon ? prev.gamesWon + 1 : prev.gamesWon
      };
    });
  }, []);

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
    setState(prev => ({
      ...prev,
      debugMode: !prev.debugMode
    }));
  }, []);

  const solve = useCallback(async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // State types matching the example algorithm
    type Card = { rank: number; };
    type Pile = Card[];
    type State = Pile[];
    type Move = { from: number; to: number; };

    function toSimpleState(): State {
      return state.piles.map(pile =>
        pile.cards.map(card => ({ rank: card.value }))
      );
    }

    function canMove(fromPile: Pile, toPile: Pile): boolean {
      if (fromPile.length === 0) return false;
      const fromCard = fromPile[fromPile.length - 1];

      // Can move to empty pile
      if (toPile.length === 0) return true;

      // Can only stack on matching rank if pile isn't full
      if (toPile.length >= 4) return false;
      const toCard = toPile[toPile.length - 1];
      return toCard.rank === fromCard.rank;
    }

    function getValidMoves(state: State): Move[] {
      const moves: Move[] = [];

      for (let from = 0; from < state.length; from++) {
        if (state[from].length === 0) continue;

        for (let to = 0; to < state.length; to++) {
          if (from === to) continue;

          if (canMove(state[from], state[to])) {
            // For empty pile moves, verify there are matching cards elsewhere
            if (state[to].length === 0) {
              const sourceCard = state[from][state[from].length - 1];
              const hasMatches = state.some((pile, i) =>
                i !== from && i !== to &&
                pile.length > 0 &&
                pile[pile.length - 1].rank === sourceCard.rank
              );
              if (hasMatches) {
                moves.push({ from, to });
              }
            } else {
              moves.push({ from, to });
            }
          }
        }
      }

      return moves;
    }

    function applyMove(state: State, move: Move): State {
      const newState = state.map(pile => [...pile]);
      const card = newState[move.from].pop()!;
      newState[move.to].push(card);
      return newState;
    }

    function isGoal(state: State): boolean {
      let completePiles = 0;
      for (const pile of state) {
        if (pile.length === 0) continue;
        if (pile.length === 4 && pile.every(c => c.rank === pile[0].rank)) {
          completePiles++;
        }
      }
      return completePiles === 13;
    }

    function stateToString(state: State): string {
      // Sort piles and cards within piles for consistent comparison
      return state
        .map(pile => pile.length === 0 ? '-' : [...pile]
          .map(c => c.rank)
          .sort((a, b) => a - b)
          .join(',')
        )
        .sort()
        .join('|');
    }

    console.log("Starting solve...");
    const initialState = toSimpleState();
    console.log("Initial state:");
    initialState.forEach((pile, i) => {
      console.log(`Pile ${i}: ${pile.map(c => c.rank).join(',')}`);
    });

    const maxMoves = 260; // 5 moves * 52 cards
    const visited = new Set<string>();
    const queue: Array<{ state: State, path: Move[] }> = [{
      state: initialState,
      path: []
    }];

    let iterations = 0;
    while (queue.length > 0) {
      iterations++;
      if (iterations % 1000 === 0) {
        console.log(`Iteration ${iterations}, Queue size: ${queue.length}, Visited states: ${visited.size}`);
        await sleep(0);
      }

      const current = queue.shift()!;

      if (current.path.length > maxMoves) {
        console.log("Exceeded max moves, skipping state");
        continue;
      }

      if (isGoal(current.state)) {
        console.log(`Found solution with ${current.path.length} moves!`);
        console.log("Executing solution moves:");

        // Execute each move with proper validation and delay
        for (const move of current.path) {
          // Log the move details
          const fromPile = current.state[move.from];
          const movingCard = fromPile[fromPile.length - 1];
          console.log(`Moving ${movingCard.rank} from pile ${move.from} to ${move.to}`);

          // Validate and execute the move
          if (validateMove(move.from, move.to)) {
            makeMove(move.from);
            await sleep(300); // Animation delay
          } else {
            console.error(`Invalid move detected: ${move.from} -> ${move.to}`);
            return;
          }
        }
        return;
      }

      const stateKey = stateToString(current.state);
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const moves = getValidMoves(current.state);
      if (iterations === 1 || iterations % 100 === 0) {
        console.log(`At iteration ${iterations}, depth ${current.path.length}:`);
        console.log(`Found ${moves.length} valid moves:`, moves);
      }

      // Sort moves to prioritize completing sets
      const sortedMoves = moves.sort((a, b) => {
        const stateA = applyMove(current.state, a);
        const stateB = applyMove(current.state, b);
        const completeA = stateA[a.to].length === 4;
        const completeB = stateB[b.to].length === 4;
        return Number(completeB) - Number(completeA);
      });

      for (const move of sortedMoves) {
        const nextState = applyMove(current.state, move);
        queue.push({
          state: nextState,
          path: [...current.path, move]
        });
      }
    }

    console.log(`Search terminated after ${iterations} iterations`);
    console.log("No solution found");
  }, [state.piles, makeMove, validateMove]);

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