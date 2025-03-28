import { useCallback, useEffect, useState, useRef } from "react";
import { Board } from "@/components/game/board";
import { Menu } from "@/components/game/menu";
import { DebugPanel } from "@/components/game/debug-panel";
import { WinAnimations } from "@/components/game/win-animations";
import { useGameState } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Enum to track tap locations for the cheat code
enum TapLocation {
  GamesWonBox = 'gamesWonBox',
  TopScreen = 'topScreen'
}

export default function Game() {
  const { state, undo, initGame, loadGame, instantWin } = useGameState();
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  
  // State for tracking the tap-based cheat code
  const [tapSequence, setTapSequence] = useState<TapLocation[]>([]);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gamesWonBoxRef = useRef<HTMLDivElement>(null);
  
  // Function to handle taps for the cheat code
  const handleTap = useCallback((location: TapLocation) => {
    // Don't activate if game is already won
    if (state.gameWon) return;
    
    setTapSequence(prev => {
      const newSequence = [...prev, location];
      
      // Check if the sequence is valid (alternating between GamesWonBox and TopScreen)
      const isValidSequence = newSequence.every((loc, index) => {
        if (index % 2 === 0) {
          return loc === TapLocation.GamesWonBox;
        } else {
          return loc === TapLocation.TopScreen;
        }
      });
      
      // If the sequence is invalid, reset it
      if (!isValidSequence) {
        return [];
      }
      
      // If we have 6 taps in the correct alternating sequence, trigger the cheat
      if (newSequence.length === 6) {
        // Add a subtle visual feedback
        const flashElement = document.createElement('div');
        flashElement.style.position = 'fixed';
        flashElement.style.top = '0';
        flashElement.style.left = '0';
        flashElement.style.width = '100%';
        flashElement.style.height = '100%';
        flashElement.style.backgroundColor = 'rgba(255, 215, 0, 0.2)'; // Gold color
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
        
        // Trigger the instant win
        instantWin();
        
        // Reset the sequence
        return [];
      }
      
      // Reset the sequence after 3 seconds of inactivity
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      
      tapTimeoutRef.current = setTimeout(() => {
        setTapSequence([]);
      }, 3000);
      
      return newSequence;
    });
  }, [state.gameWon, instantWin]);
  
  // Handle top screen area tap
  const handleTopScreenTap = useCallback((e: React.TouchEvent) => {
    // Only consider taps in the top 1/5 of the screen
    const touchY = e.touches[0].clientY;
    const screenHeight = window.innerHeight;
    
    if (touchY < screenHeight / 5) {
      handleTap(TapLocation.TopScreen);
    } else {
      // Reset sequence if tapped elsewhere
      setTapSequence([]);
    }
  }, [handleTap]);
  
  // Handle Games Won box tap
  const handleGamesWonBoxTap = useCallback((e: React.TouchEvent) => {
    e.stopPropagation(); // Prevent the tap from triggering other handlers
    handleTap(TapLocation.GamesWonBox);
  }, [handleTap]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    setIsPWA(isStandalone);
    
    // Try to load from localStorage first
    // If localStorage fails (which can happen on older iPhones overnight),
    // we'll fall back to retrieving gamesWon from cookies in the loadGame function
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      try {
        loadGame(JSON.parse(savedState));
      } catch (error) {
        console.error("Failed to load game from localStorage:", error);
        // The loadGame function will handle fallback to cookies internally
        initGame();
      }
    } else {
      // No saved state, start a new game
      // The GameStateProvider will handle loading gamesWon from cookies if available
      initGame();
    }
  }, [loadGame, initGame]);

  // Check if we're in landscape mode
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
    setIsLandscape(isLandscapeOrientation && widthRequirement);
  }, []);

  // Set up orientation detection
  useEffect(() => {
    // Check initial orientation
    checkOrientation();
    
    // Set up event listeners for orientation changes
    const handleResize = () => {
      checkOrientation();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also recalculate on orientation change which is important for mobile
    window.addEventListener('orientationchange', () => {
      // Wait a moment for the orientation change to complete
      setTimeout(() => {
        checkOrientation();
      }, 300);
    });
    
    // Add listener for screen orientation change (modern API)
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', () => {
        setTimeout(() => {
          checkOrientation();
        }, 300);
      });
    }
    
    // Add listener for media query changes
    const mediaQueryList = window.matchMedia('(orientation: landscape)');
    const handleOrientationChange = () => {
      setTimeout(() => {
        checkOrientation();
      }, 300);
    };
    
    // Use the appropriate event listener based on browser support
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleOrientationChange);
    } else if (mediaQueryList.addListener) {
      // Older browsers
      mediaQueryList.addListener(handleOrientationChange);
    }
    
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
  }, [checkOrientation]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleNewGame = useCallback(() => {
    initGame();
  }, [initGame]);

  return (
    <div 
      className="fixed inset-0 overflow-hidden felt-background"
      onTouchStart={handleTopScreenTap}
    >
      {/* Simple noise texture */}
      <div className="absolute inset-0 noise-texture" />
      
      {/* Status bar transition for iOS devices */}
      {isIOS && (
        <div 
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: '80px',
            background: 'linear-gradient(to bottom, rgba(13, 92, 46, 1) 0%, rgba(13, 92, 46, 0.8) 30%, rgba(26, 108, 61, 0.3) 70%, rgba(26, 108, 61, 0) 100%)'
          }}
        />
      )}
      
      <div className="h-full flex items-start justify-center">
        <Board />
      </div>
      
      {state.debugMode && <DebugPanel />}

      {/* Win animations */}
      <WinAnimations isWon={state.gameWon ?? false} gamesWon={state.gamesWon} />

      {/* Footer controls - hidden in landscape mode */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-4 z-50 footer-controls ${isLandscape ? 'hidden' : ''}`}
        style={{ 
          pointerEvents: "none",
          // Use a more consistent approach for bottom padding in PWA mode
          paddingBottom: 'max(30px, env(safe-area-inset-bottom, 30px))'
        }}
      >
        <div className="flex justify-between items-center">
          <div className="wooden-ui" style={{ pointerEvents: "auto" }}>
            <Menu />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={(state.gameWon ?? false) ? "win" : "normal"}
              className="wooden-ui" 
              style={{ pointerEvents: "auto" }}
              animate={(state.gameWon ?? false) ? {
                scale: [1, 1.2, 1],
                transition: { 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              } : {}}
              ref={gamesWonBoxRef}
              onTouchStart={handleGamesWonBoxTap}
            >
              <h1 className="text-2xl font-bold text-center text-amber-100">
                {(state.gameWon ?? false) ? "YOU WON!" : "Fifteen"}
              </h1>
              <motion.p 
                className="text-sm text-amber-200 text-center"
                animate={(state.gameWon ?? false) ? {
                  scale: [1, 1.3, 1],
                  color: [
                    "rgb(253, 230, 138)", // amber-200
                    "rgb(252, 211, 77)",  // amber-300
                    "rgb(251, 191, 36)",  // amber-400
                    "rgb(245, 158, 11)",  // amber-500
                    "rgb(253, 230, 138)"  // back to amber-200
                  ],
                  transition: { 
                    duration: 1, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }
                } : {}}
              >
                Games Won: {state.gamesWon}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          
          <div className="wooden-ui" style={{ pointerEvents: "auto" }}>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleUndo}
              disabled={state.moveHistory.length === 0}
              className="text-amber-100 hover:text-amber-50 hover:bg-transparent undo-btn"
            >
              <Undo2 className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}