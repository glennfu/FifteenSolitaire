import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '@/lib/game-state';

interface WinAnimationsProps {
  isWon: boolean;
  gamesWon: number;
}

export function WinAnimations({ isWon, gamesWon }: WinAnimationsProps) {
  const [previousGamesWon, setPreviousGamesWon] = useState(gamesWon);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Track when the game is won to trigger animations
  useEffect(() => {
    if (isWon) {
      // Start confetti
      setShowConfetti(true);
      
      // Create confetti burst
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      
      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        // Since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
      
      // Update previous games won after animation
      setTimeout(() => {
        setPreviousGamesWon(gamesWon);
        setShowConfetti(false);
      }, 5000);
    }
  }, [isWon, gamesWon]);
  
  // Card whoosh animation
  useEffect(() => {
    if (isWon) {
      // Fade out empty tile outlines immediately
      const emptyTiles = document.querySelectorAll('.empty-tile');
      emptyTiles.forEach((tile) => {
        const element = tile as HTMLElement;
        element.style.transition = 'opacity 0.8s ease-in';
        element.style.opacity = '0';
      });
      
      // Animate cards flying off with a slight delay
      const cards = document.querySelectorAll('.card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          // Random direction for each card
          const randomX = (Math.random() - 0.5) * window.innerWidth * 2;
          const randomY = (Math.random() - 0.5) * window.innerHeight * 2;
          
          // Apply the animation
          const element = card as HTMLElement;
          element.style.transition = 'transform 1s ease-in, opacity 0.8s ease-in';
          element.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${Math.random() * 720 - 360}deg)`;
          element.style.opacity = '0';
        }, 100 + index * 50); // Add a small initial delay before starting card animations
      });
    }
  }, [isWon]);
  
  // Update the reset effect to handle all cards
  useEffect(() => {
    if (!isWon) {
      // Reset ALL cards in the DOM, not just the ones currently visible
      const resetElements = () => {
        // Reset all cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
          const element = card as HTMLElement;
          element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
          element.style.transform = '';
          element.style.opacity = '1';
        });
        
        // Reset empty tile opacity
        const emptyTiles = document.querySelectorAll('.empty-tile');
        emptyTiles.forEach(tile => {
          const element = tile as HTMLElement;
          element.style.transition = 'opacity 0.3s ease-out';
          element.style.opacity = '1';
        });
      };

      // Reset immediately and also after a short delay to catch any cards
      // that might be in the middle of being rendered
      resetElements();
      
      // Use multiple timeouts to ensure we catch all elements
      setTimeout(resetElements, 50);
      setTimeout(resetElements, 150);
      setTimeout(resetElements, 300);
    }
  }, [isWon]);
  
  return (
    <>
      {/* Sparks/stars that float up from the bottom */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: window.innerHeight + 10,
                  opacity: 0.8,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  y: -20, 
                  opacity: 0,
                  transition: { 
                    duration: Math.random() * 3 + 2,
                    ease: "easeOut",
                    delay: Math.random() * 2
                  }
                }}
                exit={{ opacity: 0 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Score change animation */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        <AnimatePresence>
          {isWon && previousGamesWon !== gamesWon && (
            <motion.div
              className="text-6xl font-bold text-yellow-300 text-center"
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