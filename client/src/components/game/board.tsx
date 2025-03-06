import { useGameState } from "@/lib/game-state";
import { Pile } from "./pile";
import { useEffect, useState, useRef } from "react";

export function Board() {
  const { state, makeMove } = useGameState();
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  // Calculate optimal card size based on viewport
  useEffect(() => {
    // Detect if we're on an older iOS device
    const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                      !(/OS 1[3-9]/.test(navigator.userAgent)); // iOS 12 or lower
    
    const calculateCardSize = () => {
      // Get the actual board element height instead of relying on vh units
      const boardElement = boardRef.current;
      if (!boardElement) return;
      
      const boardRect = boardElement.getBoundingClientRect();
      const boardWidth = boardRect.width;
      
      // Adjust footer height based on device
      const footerHeight = isOlderIOS ? 120 : 96; // 7.5rem for older iOS, 6rem for others
      const boardHeight = Math.min(
        boardRect.height, 
        window.innerHeight - footerHeight
      );
      
      // Add safety margin based on device
      const safetyMargin = isOlderIOS ? 30 : 10;
      const adjustedBoardHeight = boardHeight - safetyMargin;
      
      // Calculate gap sizes - different for older iOS vs modern devices
      let gapSize;
      if (isOlderIOS) {
        // For older iOS: use smaller horizontal gaps and slightly larger vertical gaps
        const horizontalGapSize = Math.min(10, boardWidth * 0.012);
        document.documentElement.style.setProperty('--horizontal-gap', `${horizontalGapSize}px`);
        
        const verticalGapSize = Math.min(12, boardHeight * 0.015);
        document.documentElement.style.setProperty('--vertical-gap', `${verticalGapSize}px`);
        
        gapSize = horizontalGapSize; // Use horizontal gap size for card width calculation
      } else {
        // For modern devices: keep the original gap calculation
        gapSize = Math.min(16, Math.min(boardWidth, adjustedBoardHeight) * 0.02);
        // Use the same gap for both horizontal and vertical on modern devices
        document.documentElement.style.setProperty('--horizontal-gap', `${gapSize}px`);
        document.documentElement.style.setProperty('--vertical-gap', `${gapSize}px`);
      }
      
      // Calculate maximum card dimensions that would fit in the grid
      const maxCardWidth = (boardWidth - (gapSize * 4)) / 5;
      
      // For height: account for 3 rows with stacking
      // Adjust stacking factor based on device
      const stackingFactor = isOlderIOS ? 1.85 : 1.75; // Slightly reduced for older iOS
      const maxCardHeight = (adjustedBoardHeight - (gapSize * 2)) / (3 * stackingFactor);
      
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
      setCardSize({
        width: finalWidth * safetyFactor,
        height: finalHeight * safetyFactor
      });
    };

    // Initial calculation
    calculateCardSize();
    
    // Recalculate on resize
    window.addEventListener('resize', calculateCardSize);
    
    // Recalculate after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateCardSize, 500);
    
    // Also recalculate on orientation change which is important for mobile
    window.addEventListener('orientationchange', () => {
      // Wait a moment for the orientation change to complete
      setTimeout(calculateCardSize, 300);
    });
    
    return () => {
      window.removeEventListener('resize', calculateCardSize);
      window.removeEventListener('orientationchange', calculateCardSize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Detect if we're on an older iOS device for CSS classes
  const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                    !(/OS 1[3-9]/.test(navigator.userAgent)); // iOS 12 or lower

  return (
    <div 
      ref={boardRef}
      className={isOlderIOS ? "game-board w-full mx-auto" : "game-board w-full mx-auto grid grid-cols-5 gap-[2vmin] p-[2vmin]"}
      style={isOlderIOS ? { 
        userSelect: "none",
        height: "calc(100vh - 7.5rem)",
        maxHeight: "calc(100vh - 120px)",
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "repeat(3, auto)",
        gap: "var(--vertical-gap, 12px)",
        padding: "var(--vertical-gap, 12px) var(--horizontal-gap, 10px)"
      } : {
        userSelect: "none",
        height: "calc(100vh - 6rem)",
        overflow: "hidden"
      }}
    >
      {isOlderIOS ? (
        <>
          <div 
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "var(--horizontal-gap, 10px)"
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
              gap: "var(--horizontal-gap, 10px)"
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
        // Original layout for modern devices
        <>
          <div className="col-span-5 grid grid-cols-5 gap-[2vmin]">
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

          <div className="col-span-5 grid grid-cols-5 gap-[2vmin]">
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

          <div className="col-span-5 grid grid-cols-5 gap-[2vmin]">
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
  );
}