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

    // Convert piles to a simplified state
    type SimplePile = {
      cards: number[],  // Just the values
      completable: boolean  // Can this pile be completed with cards elsewhere?
    };
    type SimpleState = SimplePile[];

    function getSimpleState(): SimpleState {
      return state.piles.map(pile => {
        const values = pile.cards.map(card => card.value);
        // Check if this pile can be completed
        const topValue = values.length > 0 ? values[values.length - 1] : null;
        const completable = topValue !== null && state.piles.some((otherPile, i) =>
          pile.id !== i && otherPile.cards.some(card => card.value === topValue)
        );
        return { cards: values, completable };
      });
    }

    function stateToString(piles: SimpleState): string {
      // Sort each pile's cards and then sort piles themselves
      return piles
        .map(pile => ({
          ...pile,
          cards: [...pile.cards].sort((a, b) => a - b)
        }))
        .sort((a, b) => {
          if (a.cards.length === 0) return 1;
          if (b.cards.length === 0) return -1;
          return a.cards[0] - b.cards[0];
        })
        .map(pile => 
          pile.cards.length === 0 ? '-' : pile.cards.join(',')
        )
        .join('|');
    }

    function evaluateState(state: SimpleState): number {
      let score = 0;
      for (const pile of state) {
        if (pile.cards.length === 4 && 
            pile.cards.every(v => v === pile.cards[0])) {
          score += 100;  // Complete set
        } else if (pile.cards.length > 0) {
          const matches = pile.cards.filter(v => v === pile.cards[0]).length;
          score += matches * 10;  // Partial sets
        }
      }
      return score;
    }

    type Move = { from: number, to: number };

    function getValidMoves(state: SimpleState): Move[] {
      const moves: Move[] = [];
      for (let from = 0; from < state.length; from++) {
        if (state[from].cards.length === 0) continue;
        const card = state[from].cards[state[from].cards.length - 1];

        for (let to = 0; to < state.length; to++) {
          if (from === to) continue;

          // Verify move with game rules
          if (!validateMove(from, to)) continue;

          // Only allow moves that make progress
          if (state[to].cards.length === 0) {
            // Only move to empty pile if we can complete it
            if (state[from].completable) {
              moves.push({ from, to });
            }
          } else if (state[to].cards.length < 4) {
            const topCard = state[to].cards[state[to].cards.length - 1];
            if (topCard === card) {
              moves.push({ from, to });
            }
          }
        }
      }
      return moves;
    }

    function applyMove(state: SimpleState, move: Move): SimpleState {
      const newState = state.map(pile => ({
        ...pile,
        cards: [...pile.cards]
      }));
      const card = newState[move.from].cards.pop()!;
      newState[move.to].cards.push(card);
      return newState;
    }

    function isWinningState(state: SimpleState): boolean {
      let completePiles = 0;
      for (const pile of state) {
        if (pile.cards.length === 0) continue;
        if (pile.cards.length === 4 && 
            pile.cards.every(v => v === pile.cards[0])) {
          completePiles++;
        }
      }
      return completePiles === 13;
    }

    // Start solving
    console.log("Starting solve...");
    const maxDepth = 260;  // Based on 5 moves per card * 52 cards
    const visited = new Set<string>();
    const stack: Array<{
      state: SimpleState,
      moves: Move[],
      score: number
    }> = [{
      state: getSimpleState(),
      moves: [],
      score: 0
    }];

    while (stack.length > 0) {
      // Sort stack by score to try most promising states first
      stack.sort((a, b) => b.score - a.score);
      const current = stack.pop()!;

      if (current.moves.length > maxDepth) {
        console.log("Exceeded max depth, backtracking...");
        continue;
      }

      if (isWinningState(current.state)) {
        console.log("Found solution!");
        // Execute the solution
        for (const move of current.moves) {
          if (validateMove(move.from, move.to)) {
            makeMove(move.from);
            await sleep(300);
          } else {
            console.log("Invalid move detected:", move);
            break;
          }
        }
        return;
      }

      const stateKey = stateToString(current.state);
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      // Get and evaluate moves
      const moves = getValidMoves(current.state);
      for (const move of moves) {
        const nextState = applyMove(current.state, move);
        const score = evaluateState(nextState);
        stack.push({
          state: nextState,
          moves: [...current.moves, move],
          score
        });
      }

      if (stack.length % 1000 === 0) {
        console.log(`Stack size: ${stack.length}, Visited states: ${visited.size}`);
        await sleep(0);  // Prevent browser freeze
      }
    }

    console.log("No solution found");
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