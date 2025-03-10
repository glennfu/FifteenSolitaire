import { createContext, useContext, useCallback, useState, useEffect } from "react";
import {
  GameState as GameStateType,
  Card,
  CardSuit,
  CardValue,
  gameStateSchema
} from "@shared/schema";
import { z } from "zod";

interface GameContextType {
  state: GameStateType;
  makeMove: (pileId: number) => void;
  undo: () => void;
  redo: () => void;
  initGame: () => void;
  loadGame: (state: GameStateType) => void;
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
  redoStack: {
    fromPile: number;
    toPile: number;
    card: Card;
  }[];
  gamesWon: number;
  debugMode: boolean;
  gameWon: boolean;
  selectedPile: number | null;
  selectedCardId: string | null;
  validMoves: { fromPile: number; toPile: number }[];
}


function isGoalState(piles: GamePile[]): boolean {
  // For debugging
  console.log("Checking win condition");
  
  // Game is won when all non-empty piles have exactly 4 cards of the same value
  for (const pile of piles) {
    // Skip empty piles
    if (pile.isEmpty || pile.cards.length === 0) {
      continue;
    }
    
    // If a pile has cards but not exactly 4, game is not won
    if (pile.cards.length !== 4) {
      console.log(`Pile ${pile.id} has ${pile.cards.length} cards, not 4`);
      return false;
    }
    
    // If cards don't all have the same value, game is not won
    const firstValue = pile.cards[0].value;
    for (const card of pile.cards) {
      if (card.value !== firstValue) {
        console.log(`Pile ${pile.id} has mixed values`);
        return false;
      }
    }
  }
  
  // If we get here, all non-empty piles have exactly 4 cards of the same value
  console.log("Game is won!");
  return true;
}

function getValidMoves(piles: GamePile[]): { fromPile: number; toPile: number }[] {
  const moves: { fromPile: number; toPile: number }[] = [];

  for (let fromPile = 0; fromPile < piles.length; fromPile++) {
    if (piles[fromPile].cards.length === 0) continue;

    const sourceCard = piles[fromPile].cards[piles[fromPile].cards.length - 1];

    for (let toPile = 0; toPile < piles.length; toPile++) {
      if (fromPile === toPile) continue;

      // Can always move to empty pile
      if (piles[toPile].cards.length === 0) {
        moves.push({ fromPile, toPile });
        continue;
      }

      // Can only stack on matching values when pile isn't full
      const targetPile = piles[toPile];
      const targetCard = targetPile.cards[targetPile.cards.length - 1];

      if (targetCard.value === sourceCard.value && targetPile.cards.length < 4) {
        moves.push({ fromPile, toPile });
      }
    }
  }

  return moves;
}

function pileStateToString(piles: GamePile[]): string {
  return piles
    .map(pile => pile.cards.map(card => `${card.value}-${card.suit}`).join(","))
    .join("|");
}

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>({
    piles: [],
    moveHistory: [],
    redoStack: [],
    gamesWon: 0,
    debugMode: false,
    gameWon: false,
    selectedPile: null,
    selectedCardId: null,
    validMoves: []
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

    // Update isEmpty property based on actual card count
    piles.forEach(pile => {
      pile.isEmpty = pile.cards.length === 0;
    });

    setState(prev => ({
      ...prev,
      piles,
      moveHistory: [],
      gameWon: false,
      selectedPile: null,
      selectedCardId: null,
      validMoves: []
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

      let moveIndex = 0;
      let validMoves: { fromPile: number; toPile: number }[] = [];
      
      // Get the current card being moved
      const movingCard = fromPile.cards[fromPile.cards.length - 1];

      // Computing new valid moves if:
      // 1. Selecting a different card than before
      // 2. No valid moves exist yet
      if (movingCard.id !== prev.selectedCardId || prev.validMoves.length === 0) {
        const matchingPiles: number[] = [];
        const emptyPiles: number[] = [];

        // Gather all valid destinations
        prev.piles.forEach((pile, index) => {
          if (index === pileId) return; // Skip source pile

          // Check for valid empty piles
          if (pile.cards.length === 0) {
            emptyPiles.push(index);
          }
          // Check for valid matching piles
          else if (pile.cards.length < 4) {
            const topCard = pile.cards[pile.cards.length - 1];
            if (topCard.value === movingCard.value) {
              matchingPiles.push(index);
            }
          }
        });

        // Sort empty piles by proximity
        emptyPiles.sort((a, b) => Math.abs(a - pileId) - Math.abs(b - pileId));

        // Create ordered list of moves
        validMoves = [
          ...matchingPiles.map(toPile => ({ fromPile: pileId, toPile })),
          ...emptyPiles.map(toPile => ({ fromPile: pileId, toPile }))
        ];
      } else {
        // Use existing valid moves list but update the fromPile to the current pile
        validMoves = prev.validMoves.map(move => ({
          ...move,
          fromPile: pileId // Update to current pile since the card has moved
        }));

        // Find the next move in sequence
        if (prev.moveHistory.length > 0) {
          const lastMove = prev.moveHistory[prev.moveHistory.length - 1];
          if (lastMove.card.id === movingCard.id) {
            const lastIndex = validMoves.findIndex(move => move.toPile === lastMove.toPile);
            if (lastIndex !== -1) {
              moveIndex = (lastIndex + 1) % validMoves.length;
            }
          }
        }
      }

      // No valid moves available
      if (validMoves.length === 0) return prev;

      const targetMove = validMoves[moveIndex];

      // Double check the move is still valid
      const targetPile = prev.piles[targetMove.toPile];
      
      // Fix: Check if we're trying to move a card to the same pile it's already in
      if (targetMove.fromPile === targetMove.toPile) {
        return {
          ...prev,
          selectedPile: null,
          selectedCardId: null,
          validMoves: []
        };
      }
      
      // Check if target pile is full
      if (targetPile.cards.length >= 4) {
        return {
          ...prev,
          selectedPile: null,
          selectedCardId: null,
          validMoves: []
        };
      }

      // Execute the move
      const newPiles = [...prev.piles];

      // Remove card from source
      const cardToMove = fromPile.cards[fromPile.cards.length - 1];
      newPiles[pileId] = {
        ...fromPile,
        cards: fromPile.cards.slice(0, -1),
        isEmpty: fromPile.cards.length === 1 // Will be empty after removing the card
      };

      // Add to target - use the exact same card object to preserve suit
      newPiles[targetMove.toPile] = {
        ...targetPile,
        cards: [...targetPile.cards, cardToMove],
        isEmpty: false // No longer empty after adding a card
      };

      // Check win condition after the move is applied
      const hasWon = isGoalState(newPiles);
      console.log("Win condition result:", hasWon);

      // If game is won, increment games won counter
      const newGamesWon = hasWon ? prev.gamesWon + 1 : prev.gamesWon;
      
      // Create the new state with updated win status
      const newState = {
        ...prev,
        piles: newPiles,
        moveHistory: [...prev.moveHistory, {
          fromPile: pileId,
          toPile: targetMove.toPile,
          card: cardToMove
        }],
        redoStack: [], // Clear redo stack on new move
        gamesWon: newGamesWon,
        gameWon: hasWon, // Set the win flag
        selectedPile: null, // Reset selection after move
        selectedCardId: null,
        validMoves: []
      };
      
      // Log the new state for debugging
      if (hasWon) {
        console.log("Game won state:", newState);
      }
      
      return newState;
    });
  }, []);

  const undo = useCallback(() => {
    // First, cancel any ongoing animations by clearing all animation-related timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Reset all card animations with smooth transitions
    const resetAllCards = () => {
      // Get all cards and reset their styles with smooth transitions
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const element = card as HTMLElement;
        // Use a smooth transition for returning cards
        element.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out';
        element.style.transform = '';
        element.style.opacity = '1';
      });
      
      // Reset empty tile opacity with smooth transition
      const emptyTiles = document.querySelectorAll('.empty-tile');
      emptyTiles.forEach(tile => {
        const element = tile as HTMLElement;
        element.style.transition = 'opacity 0.4s ease-out';
        element.style.opacity = '1';
      });
    };
    
    // Reset cards with smooth animations before state update
    resetAllCards();
    
    // Now update the state
    setState(prev => {
      if (prev.moveHistory.length === 0) return prev;
      
      // If we're not in a win state, just do a normal undo
      if (!prev.gameWon) {
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
          moveHistory: prev.moveHistory.slice(0, -1),
          redoStack: [...prev.redoStack, lastMove],
          selectedPile: null,
          selectedCardId: null,
          validMoves: []
        };
      }
      
      // Special handling for undoing from a win state
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

      // Decrement the games won counter
      const newGamesWon = Math.max(0, prev.gamesWon - 1);

      return {
        ...prev,
        piles: newPiles,
        moveHistory: prev.moveHistory.slice(0, -1),
        redoStack: [...prev.redoStack, lastMove],
        selectedPile: null,
        selectedCardId: null,
        validMoves: [],
        gameWon: false,
        gamesWon: newGamesWon
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev;

      const moveToRedo = prev.redoStack[prev.redoStack.length - 1];
      const newPiles = [...prev.piles];

      // Remove card from source pile
      newPiles[moveToRedo.fromPile] = {
        ...newPiles[moveToRedo.fromPile],
        cards: newPiles[moveToRedo.fromPile].cards.slice(0, -1),
        isEmpty: newPiles[moveToRedo.fromPile].cards.length === 1 // Will be empty after removing the card
      };

      // Add card to target pile
      newPiles[moveToRedo.toPile] = {
        ...newPiles[moveToRedo.toPile],
        cards: [...newPiles[moveToRedo.toPile].cards, moveToRedo.card],
        isEmpty: false // No longer empty after adding a card
      };

      return {
        ...prev,
        piles: newPiles,
        moveHistory: [...prev.moveHistory, moveToRedo],
        redoStack: prev.redoStack.slice(0, -1),
        selectedPile: null,
        selectedCardId: null,
        validMoves: []
      };
    });
  }, []);

  const loadGame = useCallback((savedState: GameState) => {
    try {
      const parsed = gameStateSchema.safeParse(savedState);
      if (parsed.success) {
        // Create a copy of the parsed data
        const loadedState = {
          ...parsed.data,
          // Ensure these properties exist with default values if they're missing
          gameWon: parsed.data.gameWon || false,
          selectedPile: parsed.data.selectedPile || null,
          selectedCardId: parsed.data.selectedCardId || null,
          validMoves: parsed.data.validMoves || [],
          // Initialize redoStack if it doesn't exist
          redoStack: parsed.data.redoStack || []
        };
        
        // Update isEmpty property based on actual card count for each pile
        loadedState.piles = loadedState.piles.map(pile => ({
          ...pile,
          isEmpty: pile.cards.length === 0
        }));
        
        setState(loadedState);
      } else {
        throw new Error("Invalid game state");
      }
    } catch (error) {
      console.error("Error loading game:", error);
      initGame(); // Fall back to a new game if loading fails
    }
  }, [initGame]);

  const toggleDebug = useCallback(() => {
    setState(prev => ({
      ...prev,
      debugMode: !prev.debugMode
    }));
  }, []);

  const solve = useCallback(async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    async function findSolution(
      currentPiles: GamePile[],
      visited = new Set<string>(),
      path: { fromPile: number; toPile: number }[] = []
    ): Promise<{ fromPile: number; toPile: number }[] | null> {
      if (isGoalState(currentPiles)) return path;

      const stateKey = pileStateToString(currentPiles);
      if (visited.has(stateKey)) return null;
      visited.add(stateKey);

      const validMoves = getValidMoves(currentPiles);

      for (const move of validMoves) {
        // Deep clone the current state
        const nextPiles = currentPiles.map(pile => ({
          ...pile,
          cards: [...pile.cards]
        }));

        // Apply the move
        const movingCard = nextPiles[move.fromPile].cards.pop()!;
        nextPiles[move.toPile].cards.push(movingCard);

        const result = await findSolution(nextPiles, visited, [...path, move]);
        if (result) return result;

        await sleep(50); // Small delay to prevent blocking
      }

      return null;
    }

    // Start the solving process
    const solution = await findSolution(state.piles);
    if (!solution) return;

    // Execute the solution moves with animation delays
    for (const move of solution) {
      makeMove(move.fromPile);
      await sleep(300); // Match animation duration
    }
  }, [state.piles, makeMove]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("gameState", JSON.stringify(state));
  }, [state]);

  return (
    <GameContext.Provider
      value={{
        state,
        makeMove,
        undo,
        redo,
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