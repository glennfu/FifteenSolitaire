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
      
      // Calculate gap sizes
      const gapSize = Math.min(16, Math.min(boardWidth, adjustedBoardHeight) * (isOlderIOS ? 0.015 : 0.02));
      
      // Calculate maximum card dimensions that would fit in the grid
      const maxCardWidth = (boardWidth - (gapSize * 4)) / 5;
      
      // For height: account for 3 rows with stacking
      // Adjust stacking factor based on device
      const stackingFactor = isOlderIOS ? 2.0 : 1.75;
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
      
      // Apply safety factor based on device
      const safetyFactor = isOlderIOS ? 0.88 : 0.92;
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
      className={`game-board w-full mx-auto grid grid-cols-5 gap-[${isOlderIOS ? '1.5vmin' : '2vmin'}] p-[${isOlderIOS ? '1.5vmin' : '2vmin'}]`}
      style={{ 
        userSelect: "none",
        height: isOlderIOS ? "calc(100vh - 7.5rem)" : "calc(100vh - 6rem)",
        maxHeight: isOlderIOS ? "calc(100vh - 120px)" : "calc(100vh - 96px)",
        overflow: "hidden" // Prevent any overflow
      }}
    >
      <div className={`col-span-5 grid grid-cols-5 gap-[${isOlderIOS ? '1.5vmin' : '2vmin'}]`}>
        {state.piles.slice(0, 5).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
            cardSize={cardSize}
            isOlderIOS={isOlderIOS}
          />
        ))}
      </div>

      <div className={`col-span-5 grid grid-cols-5 gap-[${isOlderIOS ? '1.5vmin' : '2vmin'}]`}>
        {state.piles.slice(5, 10).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
            cardSize={cardSize}
            isOlderIOS={isOlderIOS}
          />
        ))}
      </div>

      <div className={`col-span-5 grid grid-cols-5 gap-[${isOlderIOS ? '1.5vmin' : '2vmin'}]`}>
        {state.piles.slice(10, 15).map((pile) => (
          <Pile
            key={pile.id}
            pile={pile}
            onCardClick={(pileId) => makeMove(pileId)}
            cardSize={cardSize}
            isOlderIOS={isOlderIOS}
          />
        ))}
      </div>
    </div>
  );
}