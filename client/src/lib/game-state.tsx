import { createContext, useContext, useCallback, useState, useEffect } from "react";
import {
  GameState as GameStateType,
  Card,
  CardSuit,
  CardValue,
  gameStateSchema
} from "@shared/schema";
import { z } from "zod";

// Cookie helper functions
function setCookie(name: string, value: string, days: number = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

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
  instantWin: () => void;
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

  // Load gamesWon from cookie on initial mount
  useEffect(() => {
    const gamesWonFromCookie = getCookie("gamesWon");
    if (gamesWonFromCookie) {
      const parsedGamesWon = parseInt(gamesWonFromCookie, 10);
      if (!isNaN(parsedGamesWon)) {
        setState(prev => ({
          ...prev,
          gamesWon: parsedGamesWon
        }));
      }
    }
  }, []);

  const initGame = useCallback(() => {
    // Cancel any ongoing animations by clearing all animation-related timeouts
    const highestId = Number(window.setTimeout(() => {}, 0));
    for (let i = 0; i < highestId; i++) {
      try {
        window.clearTimeout(i);
      } catch (e) {
        // Ignore errors from clearing invalid timeout IDs
      }
    }

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
        (pile.cards as Card[]) = deck.slice(cardIndex, cardIndex + 4);
        cardIndex += 4;
      }
    });

    // Update isEmpty property based on actual card count
    piles.forEach(pile => {
      pile.isEmpty = pile.cards.length === 0;
    });

    // Preserve gamesWon when starting a new game
    setState(prev => ({
      ...prev,
      piles,
      moveHistory: [],
      gameWon: false,
      selectedPile: null,
      selectedCardId: null,
      validMoves: []
    }));
    
    // Add a subtle hint about the cheat code in the console
    console.log("%c🃏 Fifteen Solitaire", "font-size: 16px; font-weight: bold; color: #8B4513;");
    
    // Only show keyboard hint
    console.log("%cTip: Sometimes winning is just a keystroke away...", "font-style: italic; color: #666;");
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
    const highestTimeoutId = Number(setTimeout(() => {}, 0));
    for (let i = 0; i < highestTimeoutId; i++) {
      try {
        clearTimeout(i);
      } catch (e) {
        // Ignore errors from clearing invalid timeout IDs
      }
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

  const loadGame = useCallback((savedState: GameStateType) => {
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
        } as GameState; // Cast to our local GameState type
        
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
      
      // Try to recover gamesWon from cookie if localStorage fails
      const gamesWonFromCookie = getCookie("gamesWon");
      if (gamesWonFromCookie) {
        const parsedGamesWon = parseInt(gamesWonFromCookie, 10);
        if (!isNaN(parsedGamesWon)) {
          // Initialize a new game but preserve gamesWon from cookie
          initGame();
          setState(prev => ({
            ...prev,
            gamesWon: parsedGamesWon
          }));
          return;
        }
      }
      
      // If no cookie data, just initialize a new game
      initGame();
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

  const instantWin = useCallback(() => {
    // First, cancel any ongoing animations
    const highestId = Number(window.setTimeout(() => {}, 0));
    for (let i = 0; i < highestId; i++) {
      try {
        window.clearTimeout(i);
      } catch (e) {
        // Ignore errors from clearing invalid timeout IDs
      }
    }

    // Reset all card animations
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const element = card as HTMLElement;
      element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out';
      element.style.transform = '';
      element.style.opacity = '1';
    });

    // Add a subtle flash effect to indicate cheat code activation
    const flashElement = document.createElement('div');
    flashElement.style.position = 'fixed';
    flashElement.style.top = '0';
    flashElement.style.left = '0';
    flashElement.style.width = '100%';
    flashElement.style.height = '100%';
    flashElement.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    flashElement.style.zIndex = '9999';
    flashElement.style.pointerEvents = 'none';
    flashElement.style.transition = 'opacity 0.5s ease-out';
    document.body.appendChild(flashElement);

    // Fade out and remove the flash element
    setTimeout(() => {
      flashElement.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(flashElement);
      }, 500);
    }, 100);

    // Create a new winning state
    setState(prev => {
      // Step 1: Collect all cards from all piles
      const allCards = prev.piles.flatMap(pile => pile.cards);
      
      // Step 2: Group cards by value
      const cardsByValue: Record<CardValue, Card[]> = {} as Record<CardValue, Card[]>;
      allCards.forEach(card => {
        if (!cardsByValue[card.value]) {
          cardsByValue[card.value] = [];
        }
        cardsByValue[card.value].push(card);
      });
      
      // Step 3: Analyze existing piles to find patterns
      const pilePatterns: Record<number, { value: CardValue; count: number }> = {};
      prev.piles.forEach((pile, pileIndex) => {
        if (pile.cards.length === 0) return;
        
        // Check for 3 or 4 of a kind
        const valueCount: Record<CardValue, number> = {} as Record<CardValue, number>;
        pile.cards.forEach(card => {
          valueCount[card.value] = (valueCount[card.value] || 0) + 1;
        });
        
        // Find the most common value in this pile
        let maxCount = 0;
        let maxValue: CardValue | null = null;
        
        Object.entries(valueCount).forEach(([value, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxValue = Number(value) as CardValue;
          }
        });
        
        // If we have 2 or more of a kind, record this pattern
        if (maxCount >= 2 && maxValue !== null) {
          pilePatterns[pileIndex] = { value: maxValue, count: maxCount };
        }
      });
      
      // Step 4: Create new piles with winning arrangement
      const newPiles = Array(15).fill(null).map((_, index) => ({
        id: index,
        cards: [] as Card[],
        isEmpty: false
      }));
      
      // Step 5: Assign values to piles based on patterns
      const assignedValues = new Set<CardValue>();
      const assignedPiles = new Set<number>();
      
      // First, assign piles with 3 or 4 of a kind
      Object.entries(pilePatterns).forEach(([pileIndex, pattern]) => {
        const pileIdx = Number(pileIndex);
        if (pattern.count >= 3 && !assignedValues.has(pattern.value)) {
          // This pile already has 3 or 4 of the same value, keep it
          assignedValues.add(pattern.value);
          assignedPiles.add(pileIdx);
          
          // Get 4 cards of this value
          const cardsOfValue = cardsByValue[pattern.value].slice(0, 4);
          newPiles[pileIdx].cards = cardsOfValue;
          
          // Remove these cards from available cards
          cardsByValue[pattern.value] = cardsByValue[pattern.value].filter(
            card => !cardsOfValue.includes(card)
          );
        }
      });
      
      // Next, assign piles with 2 of a kind (if no other pile has 2+ of the same value)
      Object.entries(pilePatterns).forEach(([pileIndex, pattern]) => {
        const pileIdx = Number(pileIndex);
        if (pattern.count === 2 && !assignedValues.has(pattern.value) && !assignedPiles.has(pileIdx)) {
          // Check if any other pile has 2+ of this value
          const otherPileHasSameValue = Object.entries(pilePatterns)
            .some(([otherIdx, otherPattern]) => 
              Number(otherIdx) !== pileIdx && 
              otherPattern.value === pattern.value && 
              otherPattern.count >= 2
            );
          
          if (!otherPileHasSameValue) {
            // This pile has 2 of a kind and no other pile has 2+ of the same value
            assignedValues.add(pattern.value);
            assignedPiles.add(pileIdx);
            
            // Get 4 cards of this value
            const cardsOfValue = cardsByValue[pattern.value].slice(0, 4);
            newPiles[pileIdx].cards = cardsOfValue;
            
            // Remove these cards from available cards
            cardsByValue[pattern.value] = cardsByValue[pattern.value].filter(
              card => !cardsOfValue.includes(card)
            );
          }
        }
      });
      
      // Finally, assign remaining values to empty piles
      const remainingValues = Object.keys(cardsByValue)
        .map(v => Number(v) as CardValue)
        .filter(value => !assignedValues.has(value) && cardsByValue[value].length === 4);
      
      // Find empty piles (excluding the two that should remain empty)
      const emptyPileIndices = Array.from({ length: 15 }, (_, i) => i)
        .filter(i => !assignedPiles.has(i))
        .slice(0, remainingValues.length);
      
      // Assign remaining values to empty piles
      remainingValues.forEach((value, index) => {
        if (index < emptyPileIndices.length) {
          const pileIdx = emptyPileIndices[index];
          assignedValues.add(value);
          assignedPiles.add(pileIdx);
          
          // Get 4 cards of this value
          const cardsOfValue = cardsByValue[value].slice(0, 4);
          newPiles[pileIdx].cards = cardsOfValue;
        }
      });
      
      // Mark empty piles
      newPiles.forEach((pile, index) => {
        pile.isEmpty = pile.cards.length === 0;
      });
      
      // Ensure we have exactly 13 non-empty piles (with 2 empty piles)
      const nonEmptyPiles = newPiles.filter(pile => !pile.isEmpty);
      if (nonEmptyPiles.length !== 13) {
        console.warn(`Expected 13 non-empty piles, but got ${nonEmptyPiles.length}`);
      }
      
      // First update the piles without setting gameWon to true
      return {
        ...prev,
        piles: newPiles,
        moveHistory: [],
        redoStack: [],
        selectedPile: null,
        selectedCardId: null,
        validMoves: []
      };
    });
    
    // Set the game to won state after a small delay to allow animations to work properly
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        gameWon: true,
        gamesWon: prev.gamesWon + 1
      }));
    }, 300);
  }, []);

  // Add keyboard event listener for the "www" cheat code
  useEffect(() => {
    const keyPresses: { key: string; timestamp: number }[] = [];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track 'w' key presses
      if (e.key.toLowerCase() === 'w') {
        // Don't activate cheat if game is already won
        if (state.gameWon) return;
        
        const now = Date.now();
        
        // Add this key press to the history
        keyPresses.push({ key: 'w', timestamp: now });
        
        // Only keep key presses from the last second
        const recentPresses = keyPresses.filter(press => now - press.timestamp < 1000);
        
        // Update the key press history
        keyPresses.length = 0;
        keyPresses.push(...recentPresses);
        
        // Check if we have 3 'w' presses within 1 second
        if (recentPresses.length === 3 && recentPresses.every(press => press.key === 'w')) {
          // Trigger the instant win
          instantWin();
          
          // Clear the key press history
          keyPresses.length = 0;
        }
      }
    };
    
    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [instantWin, state.gameWon]);

  // Save state to localStorage and gamesWon to cookie whenever it changes
  useEffect(() => {
    // Save full state to localStorage
    localStorage.setItem("gameState", JSON.stringify(state));
    
    // Save gamesWon to cookie as backup
    setCookie("gamesWon", state.gamesWon.toString());
  }, [state]);

  return (
    <GameContext.Provider
      value={{
        state: state as unknown as GameStateType,
        makeMove,
        undo,
        redo,
        initGame,
        loadGame,
        validateMove,
        toggleDebug,
        solve,
        instantWin
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