import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";
import { useEffect, useState, useRef, useCallback } from "react";

export function Board() {
  const { state, makeMove, undo, redo } = useGameState();
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [verticalSpacing, setVerticalSpacing] = useState(0);
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  
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

  // Calculate optimal card size based on viewport
  useEffect(() => {
    // Detect if we're on an older iOS device
    const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                      !(/OS 1[3-9]/.test(navigator.userAgent)); // iOS 12 or lower
    
    const calculateCardSize = () => {
      // Use the container width instead of the board width to break the feedback loop
      const containerElement = containerRef.current;
      if (!containerElement) return;
      
      const containerRect = containerElement.getBoundingClientRect();
      const availableWidth = containerRect.width;
      
      // Adjust footer height based on device
      const footerHeight = isOlderIOS ? 120 : 96; // 7.5rem for older iOS, 6rem for others
      const availableHeight = Math.min(
        containerRect.height, 
        window.innerHeight - footerHeight
      );
      
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
      
      // Calculate maximum card dimensions that would fit in the grid
      const maxCardWidth = (availableWidth - (horizontalGapSize * 4)) / 5;
      
      // For height: account for 3 rows with stacking
      // Adjust stacking factor based on device
      const stackingFactor = isOlderIOS ? 1.85 : 1.75; // Slightly reduced for older iOS
      const maxCardHeight = (adjustedHeight - (verticalGapSize * 2)) / (3 * stackingFactor);
      
      // Card should maintain a 3:4 aspect ratio (width:height)
      const idealAspectRatio = 3/4;
      
      // Determine limiting dimension
      let finalWidth, finalHeight;
      
      const heightFromWidth = maxCardWidth / idealAspectRatio;
      if (heightFromWidth <= maxCardHeight) {
        finalWidth = maxCardWidth;
        finalHeight = heightFromWidth;
      } else {
        finalHeight = maxCardHeight;
        finalWidth = maxCardHeight * idealAspectRatio;
      }
      
      // Apply safety factor based on device - keep original for modern devices
      const safetyFactor = isOlderIOS ? 0.9 : 0.92;
      const finalCardWidth = finalWidth * safetyFactor;
      const finalCardHeight = finalHeight * safetyFactor;
      
      setCardSize({
        width: finalCardWidth,
        height: finalCardHeight
      });
      
      // Calculate the exact grid width based on card size and gaps
      const exactGridWidth = (finalCardWidth * 5) + (horizontalGapSize * 4);
      setGridWidth(exactGridWidth);
      
      // Calculate the total height used by cards
      const totalCardHeight = (finalCardHeight * 3 * stackingFactor);
      
      // Calculate remaining space and distribute it as vertical spacing
      const remainingSpace = adjustedHeight - totalCardHeight;
      
      // If we have extra space, distribute it between the rows
      if (remainingSpace > verticalGapSize * 2) {
        // Calculate how much space we can use for vertical spacing
        // We need to distribute this across 2 gaps between rows
        
        // For skinny layouts (when width is the limiting factor), use more vertical space
        const isSkinnyLayout = heightFromWidth > maxCardHeight;
        
        if (isSkinnyLayout) {
          // For skinny layouts, use more vertical space - up to 25% of available height
          const maxSpacing = Math.min(
            Math.floor(remainingSpace / 2), // Divide by 2 for the two gaps
            availableHeight * 0.25 // Allow up to 25% of available height
          );
          setVerticalSpacing(maxSpacing);
        } else {
          // For wider layouts, be more conservative
          const maxSpacing = Math.min(
            Math.floor(remainingSpace / 3), // Divide by 3 (2 gaps + extra padding)
            availableHeight * 0.1, // Cap at 10% of available height
            40 // Or 40px, whichever is smaller
          );
          setVerticalSpacing(maxSpacing);
        }
      } else {
        // Use the default vertical gap
        setVerticalSpacing(verticalGapSize);
      }
      
      setInitialCalculationDone(true);
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
        calculateCardSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also recalculate on orientation change which is important for mobile
    window.addEventListener('orientationchange', () => {
      // Wait a moment for the orientation change to complete
      setTimeout(calculateCardSize, 300);
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', calculateCardSize);
    };
  }, []);

  // Detect if we're on an older iOS device for CSS classes
  const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                    !(/OS 1[3-9]/.test(navigator.userAgent)); // iOS 12 or lower

  return (
    <div 
      ref={containerRef}
      className="flex justify-center items-start w-full h-full"
      style={{
        height: isOlderIOS ? "calc(100vh - 7.5rem)" : "calc(100vh - 6rem)",
      }}
    >
      <div 
        ref={boardRef}
        className="game-board mx-auto"
        style={{ 
          userSelect: "none",
          height: "auto", // Use auto height to prevent stretching
          maxHeight: "100%", // Ensure it doesn't exceed container height
          overflow: "hidden",
          width: initialCalculationDone ? `${gridWidth}px` : "95%", // Use percentage width if calculation not done
          maxWidth: "95vmin",
          paddingTop: isOlderIOS ? "var(--vertical-gap, 12px)" : "2vmin",
          paddingBottom: isOlderIOS ? "var(--vertical-gap, 12px)" : "2vmin",
          display: "flex",
          flexDirection: "column",
          justifyContent: verticalSpacing > 0 ? "space-between" : "flex-start"
        }}
      >
        {isOlderIOS ? (
          <>
            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--horizontal-gap, 10px)",
                marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 12px)"
              }}
            >
              {state.piles.slice(0, 5).map((pile) => (
                <Pile
                  key={pile.id}
                  pile={pile}
                  onCardClick={(pileId) => makeMove(pileId)}
                  cardSize={cardSize}
                  isOlderIOS={true}
                />
              ))}
            </div>

            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--horizontal-gap, 10px)",
                marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 12px)"
              }}
            >
              {state.piles.slice(5, 10).map((pile) => (
                <Pile
                  key={pile.id}
                  pile={pile}
                  onCardClick={(pileId) => makeMove(pileId)}
                  cardSize={cardSize}
                  isOlderIOS={true}
                />
              ))}
            </div>

            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--horizontal-gap, 10px)"
              }}
            >
              {state.piles.slice(10, 15).map((pile) => (
                <Pile
                  key={pile.id}
                  pile={pile}
                  onCardClick={(pileId) => makeMove(pileId)}
                  cardSize={cardSize}
                  isOlderIOS={true}
                />
              ))}
            </div>
          </>
        ) : (
          // Original layout for modern devices with fixed width
          <>
            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--horizontal-gap, 16px)",
                marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 16px)"
              }}
            >
              {state.piles.slice(0, 5).map((pile) => (
                <Pile
                  key={pile.id}
                  pile={pile}
                  onCardClick={(pileId) => makeMove(pileId)}
                  cardSize={cardSize}
                  isOlderIOS={false}
                />
              ))}
            </div>

            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--horizontal-gap, 16px)",
                marginBottom: verticalSpacing > 0 ? `${verticalSpacing}px` : "var(--vertical-gap, 16px)"
              }}
            >
              {state.piles.slice(5, 10).map((pile) => (
                <Pile
                  key={pile.id}
                  pile={pile}
                  onCardClick={(pileId) => makeMove(pileId)}
                  cardSize={cardSize}
                  isOlderIOS={false}
                />
              ))}
            </div>

            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--horizontal-gap, 16px)"
              }}
            >
              {state.piles.slice(10, 15).map((pile) => (
                <Pile
                  key={pile.id}
                  pile={pile}
                  onCardClick={(pileId) => makeMove(pileId)}
                  cardSize={cardSize}
                  isOlderIOS={false}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}