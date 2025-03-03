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
    debugMode: false,
    gameWon: false
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
    setState(prev => ({
      ...prev,
      debugMode: !prev.debugMode
    }));
  }, []);

  const solve = useCallback(async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Simple state with just values to match the example algorithm
    type Pile = number[];
    type State = Pile[];
    type Move = { from: number, to: number };

    function toSimpleState(piles: GamePile[]): State {
      return piles.map(pile => pile.cards.map(card => card.value));
    }

    function isGoal(state: State): boolean {
      let completePiles = 0;
      for (const pile of state) {
        if (pile.length === 0) continue;
        if (pile.length !== 4) return false;
        if (!pile.every(v => v === pile[0])) return false;
        completePiles++;
      }
      return completePiles === 13;
    }

    function getValidMoves(state: State): Move[] {
      const moves: Move[] = [];
      for (let i = 0; i < state.length; i++) {
        if (state[i].length === 0) continue;
        const card = state[i][state[i].length - 1];

        for (let j = 0; j < state.length; j++) {
          if (i === j) continue;

          // Can move to empty pile
          if (state[j].length === 0) {
            moves.push({ from: i, to: j });
            continue;
          }

          // Can stack on matching values when pile isn't full
          const top = state[j][state[j].length - 1];
          if (top === card && state[j].length < 4) {
            moves.push({ from: i, to: j });
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

    function stateToString(state: State): string {
      return state
        .map(pile => pile.length === 0 ? '-' : pile.sort().join(','))
        .join('|');
    }

    function solve(startState: State): Move[] | null {
      const stack: Array<{state: State, path: Move[]}> = [{
        state: startState,
        path: []
      }];
      const visited = new Set<string>();

      let iterations = 0;
      while (stack.length > 0 && iterations < 1000000) {
        iterations++;
        if (iterations % 1000 === 0) {
          console.log(`Iteration ${iterations}, Stack size: ${stack.length}, Visited states: ${visited.size}`);
        }

        const current = stack.pop()!;

        if (isGoal(current.state)) {
          console.log(`Found solution after ${iterations} iterations!`);
          return current.path;
        }

        const stateKey = stateToString(current.state);
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);

        const moves = getValidMoves(current.state);
        console.log(`At depth ${current.path.length}, found ${moves.length} possible moves`);

        for (const move of moves) {
          const nextState = applyMove(current.state, move);
          stack.push({
            state: nextState,
            path: [...current.path, move]
          });
        }
      }

      console.log(`Search terminated after ${iterations} iterations`);
      return null;
    }

    // Convert to simple state and solve
    console.log("Starting solve...");
    const simpleState = toSimpleState(state.piles);
    console.log("Initial state:", simpleState);

    const solution = solve(simpleState);

    if (solution) {
      console.log("Solution found! Executing moves...");
      for (const move of solution) {
        if (validateMove(move.from, move.to)) {
          console.log(`Making move from ${move.from} to ${move.to}`);
          makeMove(move.from);
          await sleep(300);
        } else {
          console.log(`Invalid move detected: ${move.from} -> ${move.to}`);
          break;
        }
      }
    } else {
      console.log("No solution found");
    }
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