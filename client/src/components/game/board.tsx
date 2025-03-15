import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";
import { useEffect, useState, useRef, useCallback } from "react";

const tableStyles = {
  // Remove the background property completely
};

export function Board() {
  const { state, makeMove, undo, redo } = useGameState();
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [verticalSpacing, setVerticalSpacing] = useState(0);
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0); // Add a key to force re-render
  const [isLandscape, setIsLandscape] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Add state to track orientation transitions
  const lastOrientationChange = useRef<number>(0); // Track the last orientation change time
  
  // Touch gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum distance required for a swipe
  
  // Debounce mechanism for gestures
  const lastGestureTime = useRef<number>(0);
  const gestureDebounceTime = 500; // Milliseconds to wait before allowing another gesture action
  
  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  
  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }
    
    const now = Date.now();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Check if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Check if enough time has passed since last gesture
      if ((now - lastGestureTime.current) > gestureDebounceTime) {
        // Left-to-right swipe (backward) for undo
        if (deltaX > minSwipeDistance) {
          e.preventDefault();
          if (state.moveHistory.length > 0) {
            undo();
            lastGestureTime.current = now;
          }
        }
        // Right-to-left swipe (forward) for redo
        else if (deltaX < -minSwipeDistance) {
          e.preventDefault();
          if (state.redoStack && state.redoStack.length > 0) {
            redo();
            lastGestureTime.current = now;
          }
        }
      }
    }
    
    // Reset touch tracking
    touchStartX.current = null;
    touchStartY.current = null;
  }, [undo, redo, state.moveHistory.length, state.redoStack]);
  
  // Handle wheel events for desktop trackpad gestures
  const handleWheel = useCallback((e: WheelEvent) => {
    const now = Date.now();
    
    // Check if it's likely a horizontal trackpad gesture
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 50) {
      // Check if enough time has passed since last gesture
      if ((now - lastGestureTime.current) > gestureDebounceTime) {
        // Right swipe (negative deltaX) for undo
        if (e.deltaX < -50) {
          e.preventDefault();
          if (state.moveHistory.length > 0) {
            undo();
            lastGestureTime.current = now;
          }
        }
        // Left swipe (positive deltaX) for redo
        else if (e.deltaX > 50) {
          e.preventDefault();
          if (state.redoStack && state.redoStack.length > 0) {
            redo();
            lastGestureTime.current = now;
          }
        }
      }
    }
  }, [undo, redo, state.moveHistory.length, state.redoStack]);
  
  // Add event listeners
  useEffect(() => {
    const boardElement = boardRef.current;
    if (boardElement) {
      // Touch events for mobile
      boardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      boardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      // Wheel events for desktop trackpad gestures
      boardElement.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        boardElement.removeEventListener('touchstart', handleTouchStart);
        boardElement.removeEventListener('touchend', handleTouchEnd);
        boardElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleTouchStart, handleTouchEnd, handleWheel]);

  // Helper function to reset all card positions
  const resetAllCardPositions = useCallback(() => {
    // Reset all cards with smooth transitions
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const element = card as HTMLElement;
      // Use a smooth transition for returning cards
      element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out';
      element.style.transform = '';
      element.style.opacity = '1';
    });
    
    // Reset empty tile opacity with smooth transition
    const emptyTiles = document.querySelectorAll('.empty-tile');
    emptyTiles.forEach(tile => {
      const element = tile as HTMLElement;
      element.style.transition = 'opacity 0.3s ease-out';
      element.style.opacity = '1';
    });
    
    // Force a re-render of the entire board by changing the key
    setLayoutKey(prevKey => prevKey + 1);
  }, []);

  // Check if we're in landscape mode - improved for mobile compatibility
  const checkOrientation = useCallback(() => {
    // Method 1: Check window dimensions
    const windowIsLandscape = window.innerWidth > window.innerHeight;
    
    // Method 2: Check orientation API (more reliable on mobile)
    let orientationIsLandscape = false;
    
    // Check if orientation API is available
    if (window.screen && window.screen.orientation) {
      // Modern orientation API
      const orientation = window.screen.orientation.type;
      orientationIsLandscape = orientation.includes('landscape');
    } else if (window.orientation !== undefined) {
      // Older iOS orientation API
      // 90 or -90 indicates landscape
      orientationIsLandscape = Math.abs(Number(window.orientation)) === 90;
    }
    
    // Method 3: Check media query (another reliable method)
    const mediaQueryIsLandscape = window.matchMedia('(orientation: landscape)').matches;
    
    // Combine all methods for maximum reliability
    // At least 2 out of 3 methods should agree for us to consider it landscape
    const methodsAgreeingOnLandscape = [
      windowIsLandscape,
      orientationIsLandscape,
      mediaQueryIsLandscape
    ].filter(Boolean).length;
    
    const isLandscapeOrientation = methodsAgreeingOnLandscape >= 2;
    
    // Only consider landscape if we have enough width (at least 1.2 times the height)
    // This ensures we have enough space for the 8+7 layout
    const hasEnoughWidth = window.innerWidth > window.innerHeight * 1.2;
    
    // For mobile devices, we need to be more lenient with the width requirement
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const widthRequirement = isMobile ? 
      window.innerWidth > window.innerHeight * 1.1 : // More lenient for mobile
      hasEnoughWidth;
    
    // Set landscape mode if orientation is landscape and we have enough width
    const newIsLandscape = isLandscapeOrientation && widthRequirement;
    
    // Only update if the orientation has actually changed
    if (newIsLandscape !== isLandscape) {
      setIsLandscape(newIsLandscape);
      // Mark that we're transitioning between orientations
      setIsTransitioning(true);
      // Record the time of this orientation change
      lastOrientationChange.current = Date.now();
    }
    
    // Debug info to console (can be removed in production)
    console.log('Orientation check:', {
      windowIsLandscape,
      orientationIsLandscape,
      mediaQueryIsLandscape,
      methodsAgreeingOnLandscape,
      isLandscapeOrientation,
      widthRequirement,
      finalDecision: isLandscapeOrientation && widthRequirement,
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      isTransitioning: isTransitioning
    });
  }, [isLandscape]);

  // Calculate optimal card size based on viewport
  useEffect(() => {
    // Detect if we're on an older iOS device
    const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                      !(/OS 1[3-9]/.test(navigator.userAgent)); // iOS 12 or lower
    
    // Check initial orientation
    checkOrientation();
    
    const calculateCardSize = () => {
      // If we're in a transition state, don't recalculate yet
      if (isTransitioning) {
        console.log('Skipping calculation during transition');
        return;
      }
      
      // Check orientation again when calculating
      checkOrientation();
      
      // Use the container width instead of the board width to break the feedback loop
      const containerElement = containerRef.current;
      if (!containerElement) return;
      
      const containerRect = containerElement.getBoundingClientRect();
      let availableWidth = containerRect.width;
      
      // In landscape mode, reserve space for the right sidebar
      if (isLandscape) {
        // Reserve 20% of the screen width for the sidebar, but at least 100px
        const sidebarWidth = Math.max(100, window.innerWidth * 0.2);
        availableWidth -= sidebarWidth;
        
        // Update the CSS variable for sidebar width
        document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
      }
      
      // Adjust footer height based on device and orientation
      const footerHeight = isLandscape ? 0 : (isOlderIOS ? 290 : 146); // No footer in landscape mode
      
      // For mobile devices in landscape, use a more reliable height calculation
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let availableHeight;
      
      if (isLandscape) {
        // On mobile in landscape, use the viewport height directly
        // Subtract a small safety margin to prevent overflow
        availableHeight = window.innerHeight - 20; // 20px safety margin
      } else {
        availableHeight = Math.min(
          containerRect.height, 
          window.innerHeight - footerHeight
        );
      }
      
      // Add safety margin based on device
      const safetyMargin = isOlderIOS ? 30 : 10;
      const adjustedHeight = availableHeight - safetyMargin;
      
      // Calculate gap sizes - different for older iOS vs modern devices
      let horizontalGapSize, verticalGapSize;
      if (isOlderIOS) {
        // For older iOS: use smaller horizontal gaps and slightly larger vertical gaps
        horizontalGapSize = Math.min(10, availableWidth * 0.012);
        verticalGapSize = Math.min(12, availableHeight * 0.015);
      } else {
        // For modern devices: keep the original gap calculation
        horizontalGapSize = Math.min(16, Math.min(availableWidth, adjustedHeight) * 0.02);
        verticalGapSize = horizontalGapSize; // Start with the same gap for both
      }
      
      document.documentElement.style.setProperty('--horizontal-gap', `${horizontalGapSize}px`);
      document.documentElement.style.setProperty('--vertical-gap', `${verticalGapSize}px`);
      
      // Calculate maximum card dimensions based on orientation
      let maxCardWidth, maxCardHeight, exactGridWidth;
      
      if (isLandscape) {
        // LANDSCAPE MODE: Implementing the exact algorithm as described
        
        // 1. When the width is greater than the height, we're in landscape mode (already checked)
        
        // 2. Measure the horizontal and vertical space available
        // We've already calculated availableWidth and availableHeight
        
        // 3. Calculate the vertical space needed for stacked cards
        // In a stack of cards, only a portion of each card is visible except the top one
        // For a stack of 10 cards, we need: 1 full card + 9 partial cards
        
        // First, determine the offset for stacked cards (how much of each card is visible)
        // This is typically 20-30% of a card's height
        const stackingOffset = 0.25; // 25% of card height is visible for stacked cards
        
        // For the top row: need space for 4 stacked cards (1 full + 3 partial)
        // For the bottom row: need space for 4 stacked cards (1 full + 3 partial)
        // Plus space for the gap between rows
        
        // Calculate how much vertical space is needed for a stack of 4 cards
        // Formula: full_card_height + (num_stacked_cards - 1) * offset * full_card_height
        // For 4 cards: full_card_height + 3 * offset * full_card_height
        // This simplifies to: full_card_height * (1 + (num_stacked_cards - 1) * offset)
        
        // For 4 cards with 25% offset: full_card_height * (1 + 3 * 0.25) = full_card_height * 1.75
        const stackHeightFactor = 1 + (4 - 1) * stackingOffset; // For 4 cards
        
        // Total vertical space needed: 
        // Top row stack + gap + Bottom row stack
        // = stackHeightFactor * card_height + gap + stackHeightFactor * card_height
        
        // Accounting for the gap between rows (using verticalGapSize)
        // Solve for card_height:
        // availableHeight = 2 * stackHeightFactor * card_height + verticalGapSize
        // card_height = (availableHeight - verticalGapSize) / (2 * stackHeightFactor)
        
        // Add top and bottom padding to ensure cards don't touch the edges
        const topBottomPadding = 30; // 30px padding at top and bottom
        const usableHeight = adjustedHeight - (topBottomPadding * 2);
        
        const maxCardHeightFromVertical = (usableHeight - verticalGapSize) / (2 * stackHeightFactor);
        
        // 4. Calculate the maximum card width based on available horizontal space
        // For the top row: 8 cards with 7 gaps between them
        const maxCardWidthFromHorizontal = (availableWidth - (horizontalGapSize * 7)) / 8;
        
        // Apply the aspect ratio constraint (width:height = 3:4)
        const idealAspectRatio = 3/4; // width:height
        
        // Calculate the height that would result from the max width
        const heightFromMaxWidth = maxCardWidthFromHorizontal / idealAspectRatio;
        
        // 5. Choose the smaller of the two heights to ensure cards fit both horizontally and vertically
        let finalCardWidth, finalCardHeight;
        
        if (heightFromMaxWidth <= maxCardHeightFromVertical) {
          // Width is the limiting factor
          finalCardHeight = heightFromMaxWidth;
          finalCardWidth = maxCardWidthFromHorizontal;
        } else {
          // Height is the limiting factor
          finalCardHeight = maxCardHeightFromVertical;
          finalCardWidth = maxCardHeightFromVertical * idealAspectRatio;
        }
        
        // Apply a small safety factor to ensure cards don't touch the edges
        const safetyFactor = 0.98;
        maxCardWidth = finalCardWidth * safetyFactor;
        maxCardHeight = finalCardHeight * safetyFactor;
        
        // 6. Calculate the exact grid width for the top row (8 cards)
        exactGridWidth = (maxCardWidth * 8) + (horizontalGapSize * 7);
        
        // Store the stacking offset as a CSS variable so it can be used by the Pile component
        document.documentElement.style.setProperty('--stacking-offset', `${stackingOffset}`);
        
        // Log detailed information for debugging
        console.log('Landscape card calculation:', {
          availableWidth,
          availableHeight,
          usableHeight,
          adjustedHeight,
          topBottomPadding,
          stackingOffset,
          stackHeightFactor,
          maxCardHeightFromVertical,
          maxCardWidthFromHorizontal,
          heightFromMaxWidth,
          finalCardWidth,
          finalCardHeight,
          maxCardWidth,
          maxCardHeight
        });
      } else {
        // PORTRAIT MODE: Keep the existing calculation
        // Portrait mode: 5 cards in each row
        maxCardWidth = (availableWidth - (horizontalGapSize * 4)) / 5;
        
        // For height: account for 3 rows with stacking
        // Adjust stacking factor based on device
        const stackingFactor = isOlderIOS ? 1.85 : 1.75;
        
        // Calculate height assuming maximum stacking (5 cards per pile)
        maxCardHeight = (adjustedHeight - (verticalGapSize * 2)) / (3 * stackingFactor);
        
        // Card should maintain a 3:4 aspect ratio (width:height)
        const idealAspectRatio = 3/4;
        
        // Determine limiting dimension
        const heightFromWidth = maxCardWidth / idealAspectRatio;
        if (heightFromWidth <= maxCardHeight) {
          maxCardHeight = heightFromWidth;
        } else {
          maxCardWidth = maxCardHeight * idealAspectRatio;
        }
        
        // Apply safety factor
        const safetyFactor = isOlderIOS ? 0.9 : 0.92;
        maxCardWidth *= safetyFactor;
        maxCardHeight *= safetyFactor;
        
        // Calculate the exact grid width for portrait mode (5 cards)
        exactGridWidth = (maxCardWidth * 5) + (horizontalGapSize * 4);
      }
      
      // Log the calculated dimensions for debugging
      console.log('Card size calculation:', {
        availableWidth,
        availableHeight,
        adjustedHeight,
        maxCardWidth,
        maxCardHeight,
        isLandscape,
        isMobile,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight
      });
      
      setCardSize({
        width: maxCardWidth,
        height: maxCardHeight
      });
      
      // Set the grid width based on the calculated card size
      setGridWidth(exactGridWidth);
      
      // Use a fixed vertical spacing that doesn't depend on card stacking
      // This ensures the layout never shifts when cards are moved
      const fixedVerticalSpacing = Math.min(
        Math.round(adjustedHeight * 0.05), // 5% of available height
        20 // Maximum of 20px
      );
      
      setVerticalSpacing(fixedVerticalSpacing);
      setInitialCalculationDone(true);
      
      // Reset all card positions after recalculating
      resetAllCardPositions();
    };

    // Initial calculation
    calculateCardSize();
    
    // Recalculate on resize, but only if the window size actually changes significantly
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    
    const handleResize = () => {
      // Only recalculate if the window size changes by more than 5%
      const widthChange = Math.abs(window.innerWidth - lastWidth) / lastWidth;
      const heightChange = Math.abs(window.innerHeight - lastHeight) / lastHeight;
      
      if (widthChange > 0.05 || heightChange > 0.05) {
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        
        // Set transitioning state to prevent flickering
        setIsTransitioning(true);
        
        // Wait a moment before recalculating to let the browser stabilize
        setTimeout(() => {
          calculateCardSize();
          // After calculation is done, clear the transitioning state
          setTimeout(() => {
            setIsTransitioning(false);
          }, 100);
        }, 300);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also recalculate on orientation change which is important for mobile
    window.addEventListener('orientationchange', () => {
      // Set transitioning state to prevent flickering
      setIsTransitioning(true);
      
      // Wait longer for orientation change to complete
      setTimeout(() => {
        calculateCardSize();
        // After calculation is done, clear the transitioning state
        setTimeout(() => {
          setIsTransitioning(false);
        }, 200);
      }, 500);
    });
    
    // Add listener for screen orientation change (modern API)
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', () => {
        // Set transitioning state to prevent flickering
        setIsTransitioning(true);
        
        // Wait longer for orientation change to complete
        setTimeout(() => {
          calculateCardSize();
          // After calculation is done, clear the transitioning state
          setTimeout(() => {
            setIsTransitioning(false);
          }, 200);
        }, 500);
      });
    }
    
    // Add listener for media query changes
    const mediaQueryList = window.matchMedia('(orientation: landscape)');
    const handleOrientationChange = () => {
      // Set transitioning state to prevent flickering
      setIsTransitioning(true);
      
      // Wait longer for orientation change to complete
      setTimeout(() => {
        calculateCardSize();
        // After calculation is done, clear the transitioning state
        setTimeout(() => {
          setIsTransitioning(false);
        }, 200);
      }, 500);
    };
    
    // Use the appropriate event listener based on browser support
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleOrientationChange);
    } else if (mediaQueryList.addListener) {
      // Older browsers
      mediaQueryList.addListener(handleOrientationChange);
    }
    
    // Clear the transitioning state after initial load
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleOrientationChange);
      } else if (mediaQueryList.removeListener) {
        mediaQueryList.removeListener(handleOrientationChange);
      }
    };
  }, [resetAllCardPositions, checkOrientation, isLandscape, isTransitioning]);

  // Detect if we're on an older iOS device for CSS classes
  const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                    !(/OS 1[3-9]/.test(navigator.userAgent)); // iOS 12 or lower

  // Render landscape layout (8 piles on top, 7 piles on bottom) with side controls
  const renderLandscapeLayout = () => {
    return (
      <div className="landscape-layout flex flex-row w-full h-full">
        {/* Main game board area */}
        <div className="game-area flex-1 flex flex-col justify-center items-center py-8">
          <div 
            key={`row1-${layoutKey}`}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: "var(--horizontal-gap, 10px)",
              marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 12px)"
            }}
          >
            {state.piles.slice(0, 8).map((pile) => (
              <Pile
                key={`${pile.id}-${layoutKey}`}
                pile={pile}
                onCardClick={(pileId) => makeMove(pileId)}
                cardSize={cardSize}
                isOlderIOS={isOlderIOS}
                stackingOffset={0.25} // Pass the stacking offset to ensure consistent spacing
              >
                {pile.isEmpty && (
                  <div 
                    className="empty-tile border-2 border-dashed border-white/20 rounded-md"
                    style={{
                      width: `${cardSize.width}px`,
                      height: `${cardSize.height}px`,
                      transition: 'opacity 0.3s ease-out'
                    }}
                  />
                )}
              </Pile>
            ))}
          </div>

          <div 
            key={`row2-${layoutKey}`}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "var(--horizontal-gap, 10px)",
              // Center the 7-card row under the 8-card row
              marginLeft: `calc((${cardSize.width}px + var(--horizontal-gap, 10px)) / 2)`,
              marginRight: `calc((${cardSize.width}px + var(--horizontal-gap, 10px)) / 2)`
            }}
          >
            {state.piles.slice(8, 15).map((pile) => (
              <Pile
                key={`${pile.id}-${layoutKey}`}
                pile={pile}
                onCardClick={(pileId) => makeMove(pileId)}
                cardSize={cardSize}
                isOlderIOS={isOlderIOS}
                stackingOffset={0.25} // Pass the stacking offset to ensure consistent spacing
              >
                {pile.isEmpty && (
                  <div 
                    className="empty-tile border-2 border-dashed border-white/20 rounded-md"
                    style={{
                      width: `${cardSize.width}px`,
                      height: `${cardSize.height}px`,
                      transition: 'opacity 0.3s ease-out'
                    }}
                  />
                )}
              </Pile>
            ))}
          </div>
        </div>
        
        {/* Side controls */}
        <div 
          className="side-controls flex flex-col justify-between"
          style={{ 
            width: 'var(--sidebar-width, 20%)',
            minWidth: '100px',
            padding: '20px 10px',
            height: '100%',
            maxHeight: '100vh'
          }}
        >
          {/* Evenly distribute the controls with more spacing */}
          <div className="top-control wooden-ui p-3 flex justify-center items-center">
            {/* New Game button - we'll use a custom event to trigger the actual button */}
            <button 
              className="text-amber-100 hover:text-amber-50 p-2 flex items-center justify-center"
              onClick={() => {
                // Find and click the actual New Game button in the footer
                const newGameBtn = document.querySelector('.footer-controls .new-game-btn');
                if (newGameBtn) {
                  (newGameBtn as HTMLElement).click();
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
              <span className="ml-2">New Game</span>
            </button>
          </div>
          
          <div className="middle-control wooden-ui p-3 text-center">
            <h1 className="text-2xl font-bold text-center text-amber-100">
              {(state.gameWon ?? false) ? "YOU WON!" : "Fifteen"}
            </h1>
            <p className="text-sm text-amber-200 text-center mt-2">
              Games Won: {state.gamesWon}
            </p>
          </div>
          
          <div className="bottom-control wooden-ui p-3 flex justify-center items-center">
            {/* Undo button - we'll use a custom event to trigger the actual button */}
            <button 
              className="text-amber-100 hover:text-amber-50 p-2 flex items-center justify-center"
              onClick={() => {
                // Find and click the actual Undo button in the footer
                const undoBtn = document.querySelector('.footer-controls .undo-btn');
                if (undoBtn) {
                  (undoBtn as HTMLElement).click();
                } else {
                  // Direct fallback if we can't find the button
                  undo();
                }
              }}
              disabled={state.moveHistory.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"></path>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
              </svg>
              <span className="ml-2">Undo</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render portrait layout (5 piles in each row)
  const renderPortraitLayout = () => {
    return (
      <>
        <div 
          key={`row1-${layoutKey}`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "var(--horizontal-gap, 10px)",
            marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 12px)"
          }}
        >
          {state.piles.slice(0, 5).map((pile) => (
            <Pile
              key={`${pile.id}-${layoutKey}`}
              pile={pile}
              onCardClick={(pileId) => makeMove(pileId)}
              cardSize={cardSize}
              isOlderIOS={isOlderIOS}
            >
              {pile.isEmpty && (
                <div 
                  className="empty-tile border-2 border-dashed border-white/20 rounded-md"
                  style={{
                    width: `${cardSize.width}px`,
                    height: `${cardSize.height}px`,
                    transition: 'opacity 0.3s ease-out'
                  }}
                />
              )}
            </Pile>
          ))}
        </div>

        <div 
          key={`row2-${layoutKey}`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "var(--horizontal-gap, 10px)",
            marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 12px)"
          }}
        >
          {state.piles.slice(5, 10).map((pile) => (
            <Pile
              key={`${pile.id}-${layoutKey}`}
              pile={pile}
              onCardClick={(pileId) => makeMove(pileId)}
              cardSize={cardSize}
              isOlderIOS={isOlderIOS}
            >
              {pile.isEmpty && (
                <div 
                  className="empty-tile border-2 border-dashed border-white/20 rounded-md"
                  style={{
                    width: `${cardSize.width}px`,
                    height: `${cardSize.height}px`,
                    transition: 'opacity 0.3s ease-out'
                  }}
                />
              )}
            </Pile>
          ))}
        </div>

        <div 
          key={`row3-${layoutKey}`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "var(--horizontal-gap, 10px)"
          }}
        >
          {state.piles.slice(10, 15).map((pile) => (
            <Pile
              key={`${pile.id}-${layoutKey}`}
              pile={pile}
              onCardClick={(pileId) => makeMove(pileId)}
              cardSize={cardSize}
              isOlderIOS={isOlderIOS}
            >
              {pile.isEmpty && (
                <div 
                  className="empty-tile border-2 border-dashed border-white/20 rounded-md"
                  style={{
                    width: `${cardSize.width}px`,
                    height: `${cardSize.height}px`,
                    transition: 'opacity 0.3s ease-out'
                  }}
                />
              )}
            </Pile>
          ))}
        </div>
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`flex ${isLandscape ? 'justify-start' : 'justify-center'} items-start w-full`}
      style={{
        paddingBottom: isLandscape ? "0" : "80px", // Only add padding in portrait mode
        minHeight: isLandscape ? "100vh" : "calc(100vh - 80px)", // Full height in landscape
        // Add a transition style to prevent flickering
        opacity: isTransitioning ? "0.3" : "1",
        transition: "opacity 0.2s ease-in-out"
      }}
    >
      {isLandscape ? (
        // In landscape mode, we render the entire layout including side controls
        renderLandscapeLayout()
      ) : (
        // In portrait mode, we just render the board
        <div 
          ref={boardRef}
          className="game-board mx-auto"
          style={{ 
            userSelect: "none",
            width: initialCalculationDone ? `${gridWidth}px` : "95%",
            maxWidth: "95vmin",
            paddingTop: "2vmin",
            paddingBottom: "10vmin", // Adjust padding to prevent cards from being cut off
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: "1vh",
            marginTop: "1vh",
          }}
        >
          {renderPortraitLayout()}
        </div>
      )}
    </div>
  );
}