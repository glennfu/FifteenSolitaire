import { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '@/lib/game-state';

interface WinAnimationsProps {
  isWon: boolean;
  gamesWon: number;
}

// Helper function outside of component to avoid strict mode issues
function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Pre-calculate random values for better performance
const preCalculatedRandoms = {
  // Pre-calculate 20 random positions for sparks
  sparkPositions: Array.from({ length: 20 }).map(() => ({
    x: Math.random(),
    y: Math.random() * 0.5 + 0.5,
    scale: Math.random() * 0.5 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2
  })),
  // Pre-calculate 52 random directions for cards (max number of cards in a deck)
  cardDirections: Array.from({ length: 52 }).map(() => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    rotation: Math.random() * 720 - 360
  }))
};

export function WinAnimations({ isWon, gamesWon }: WinAnimationsProps) {
  const [previousGamesWon, setPreviousGamesWon] = useState(gamesWon);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameIdsRef = useRef<number[]>([]);
  const animationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isFirstRender = useRef(true);
  
  // Memoize the cleanup function to avoid recreating it on each render
  const cleanupAnimations = useCallback(() => {
    // Clear the confetti interval if it exists
    if (confettiIntervalRef.current !== null) {
      clearInterval(confettiIntervalRef.current);
      confettiIntervalRef.current = null;
    }
    
    // Cancel all animation frames
    animationFrameIdsRef.current.forEach(id => {
      cancelAnimationFrame(id);
    });
    animationFrameIdsRef.current = [];
    
    // Clear all stored timeouts
    animationTimeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    animationTimeoutsRef.current = [];
  }, []);
  
  // Track when the game is won to trigger animations
  useEffect(() => {
    if (isWon) {
      // Clean up any existing animations first
      cleanupAnimations();
      
      // Start confetti
      setShowConfetti(true);
      
      // Create confetti burst with optimized interval
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      
      // Use setInterval for consistent confetti bursts (more fun!)
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        // Launch confetti from multiple positions for a more exciting effect
        // Left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
        
        // Center (occasionally)
        if (Math.random() > 0.7) {
          confetti({
            ...defaults,
            particleCount: particleCount * 1.5,
            origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 }
          });
        }
      }, 250);
      
      // Store the interval ID for cleanup
      confettiIntervalRef.current = interval;
      
      // Fire an initial big burst of confetti for immediate satisfaction
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { x: 0.5, y: 0.5 }
      });
      
      // Update previous games won after animation
      const timeoutId = setTimeout(() => {
        setPreviousGamesWon(gamesWon);
        setShowConfetti(false);
      }, 5000);
      
      // Store the timeout ID for cleanup
      animationTimeoutsRef.current.push(timeoutId);
    } else {
      // If the game is no longer in a won state, clean up animations
      cleanupAnimations();
    }
    
    // Clean up on component unmount
    return () => {
      cleanupAnimations();
    };
  }, [isWon, gamesWon, cleanupAnimations]);
  
  // Card whoosh animation - optimized with requestAnimationFrame and batched DOM operations
  useEffect(() => {
    if (isWon) {
      // Use a single animation frame to batch all DOM operations
      const animateCards = () => {
        // Fade out empty tile outlines immediately - batch operation
        const emptyTiles = document.querySelectorAll('.empty-tile');
        const emptyTilesArray = Array.from(emptyTiles);
        
        // Apply will-change to optimize rendering
        emptyTilesArray.forEach((tile) => {
          const element = tile as HTMLElement;
          element.style.willChange = 'opacity';
          element.style.transition = 'opacity 0.8s ease-in';
          element.style.opacity = '0';
        });
        
        // Get all cards once to avoid repeated DOM queries
        const cards = document.querySelectorAll('.card');
        const cardsArray = Array.from(cards);
        
        // Apply will-change to all cards immediately to hint the browser
        cardsArray.forEach((card) => {
          const element = card as HTMLElement;
          element.style.willChange = 'transform, opacity';
          // Set initial state for smooth transition
          element.style.transition = 'none';
          element.style.opacity = '1';
        });
        
        // Force reflow to ensure the initial state is applied before animations start
        document.body.offsetHeight;
        
        // Animate cards flying off with a slight delay
        cardsArray.forEach((card, index) => {
          const timeoutId = setTimeout(() => {
            // Use pre-calculated random values for better performance
            const randomDirection = preCalculatedRandoms.cardDirections[index % preCalculatedRandoms.cardDirections.length];
            const randomX = randomDirection.x * window.innerWidth * 2;
            const randomY = randomDirection.y * window.innerHeight * 2;
            const randomRotation = randomDirection.rotation;
            
            // Apply the animation with hardware acceleration
            const element = card as HTMLElement;
            
            // Set a shorter opacity transition to ensure cards fade out before they stop moving
            element.style.transition = 'transform 1s ease-in, opacity 0.6s ease-in';
            
            // Start the animation
            element.style.transform = `translate3d(${randomX}px, ${randomY}px, 0) rotate3d(0, 0, 1, ${randomRotation}deg)`;
            element.style.opacity = '0';
            
            // Add a mid-flight check to ensure opacity is set to 0
            const midFlightCheckId = setTimeout(() => {
              // Force opacity to 0 halfway through the animation
              if (element.style.opacity !== '0') {
                element.style.opacity = '0';
              }
            }, 500);
            animationTimeoutsRef.current.push(midFlightCheckId);
            
            // Ensure cards are fully removed from view after animation
            const cleanupId = setTimeout(() => {
              // Set display: none to ensure cards are completely hidden
              element.style.display = 'none';
              element.style.willChange = 'auto';
            }, 1000);
            animationTimeoutsRef.current.push(cleanupId);
          }, 100 + index * 50); // Add a small initial delay before starting card animations
          
          // Store the timeout ID for cleanup
          animationTimeoutsRef.current.push(timeoutId);
        });
      };
      
      // Use requestAnimationFrame to ensure animations run in the next frame
      const frameId = requestAnimationFrame(animateCards);
      animationFrameIdsRef.current.push(frameId);
    }
  }, [isWon]);
  
  // Update the reset effect to handle all cards - optimized with requestAnimationFrame
  useEffect(() => {
    // Skip on first render to avoid unnecessary resets
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (!isWon) {
      // Reset ALL cards in the DOM, not just the ones currently visible
      const resetElements = () => {
        // Reset all cards - batch operation
        const cards = document.querySelectorAll('.card');
        const cardsArray = Array.from(cards);
        
        // Apply will-change to optimize rendering
        cardsArray.forEach(card => {
          const element = card as HTMLElement;
          // Make sure cards are visible again
          element.style.display = '';
          element.style.willChange = 'transform, opacity';
          element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
          element.style.transform = 'translate3d(0, 0, 0)';
          element.style.opacity = '1';
        });
        
        // Reset empty tile opacity - batch operation
        const emptyTiles = document.querySelectorAll('.empty-tile');
        const emptyTilesArray = Array.from(emptyTiles);
        
        emptyTilesArray.forEach(tile => {
          const element = tile as HTMLElement;
          element.style.willChange = 'opacity';
          element.style.transition = 'opacity 0.3s ease-out';
          element.style.opacity = '1';
        });
        
        // Clean up will-change after animation completes
        const cleanupId = setTimeout(() => {
          [...cardsArray, ...emptyTilesArray].forEach(el => {
            (el as HTMLElement).style.willChange = 'auto';
          });
        }, 300);
        animationTimeoutsRef.current.push(cleanupId);
      };

      // Use requestAnimationFrame for the initial reset
      const frameId = requestAnimationFrame(resetElements);
      animationFrameIdsRef.current.push(frameId);
      
      // Use multiple timeouts to ensure we catch all elements
      // This is important to ensure all cards are properly reset
      const timeoutIds = [
        setTimeout(() => {
          const frameId = requestAnimationFrame(resetElements);
          animationFrameIdsRef.current.push(frameId);
        }, 100),
        setTimeout(() => {
          const frameId = requestAnimationFrame(resetElements);
          animationFrameIdsRef.current.push(frameId);
        }, 300)
      ];
      
      // Store the timeout IDs for cleanup
      animationTimeoutsRef.current.push(...timeoutIds);
    }
  }, [isWon]);
  
  return (
    <>
      {/* Sparks/stars that float up from the bottom - optimized with pre-calculated values */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-10">
            {preCalculatedRandoms.sparkPositions.map((spark, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                style={{ 
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden'
                }}
                initial={{ 
                  x: spark.x * window.innerWidth, 
                  y: window.innerHeight + 10,
                  opacity: 0.8,
                  scale: spark.scale
                }}
                animate={{ 
                  y: -20, 
                  opacity: 0,
                  transition: { 
                    duration: spark.duration,
                    ease: "easeOut",
                    delay: spark.delay
                  }
                }}
                exit={{ opacity: 0 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Score change animation - optimized with hardware acceleration */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        <AnimatePresence>
          {isWon && previousGamesWon !== gamesWon && (
            <motion.div
              className="text-6xl font-bold text-yellow-300 text-center"
              style={{ 
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden'
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.5, 1],
                opacity: [0, 1, 0],
                transition: { duration: 2, times: [0, 0.3, 1] }
              }}
              exit={{ opacity: 0 }}
            >
              +1
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
} 