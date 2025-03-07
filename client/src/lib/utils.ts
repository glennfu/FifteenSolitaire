import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shared texture utilities
export const textures = {
  // Felt texture for the game background
  felt: {
    background: '#1a6c3d',
    backgroundImage: `radial-gradient(circle at center, #1a6c3d 0%, #0d5c2e 100%)`,
    boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 0.3)'
  },
  
  // Noise overlay for adding texture - using a much smaller, optimized base64 PNG
  noise: {
    backgroundImage: `url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlMAGovxNEIAAAAiSURBVBjTY2AEAgYGRkYGJgYmBmYGFgZWEI+VgZ2Bg4ETAAdcADFO6juFAAAAAElFTkSuQmCC)`,
    backgroundSize: '20px 20px',
    opacity: 1.0,
    mixBlendMode: 'overlay',
    pointerEvents: 'none'
  },
  
  // Wooden texture for UI elements
  wooden: {
    backgroundColor: '#8B4513',
    backgroundImage: `linear-gradient(90deg, rgba(139,69,19,1) 0%, rgba(160,82,45,1) 50%, rgba(139,69,19,1) 100%)`,
    boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -2px 3px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#f8e0c5',
    textShadow: '0 -1px 1px rgba(0, 0, 0, 0.5)',
    border: '1px solid #6b3610'
  },
  
  // Paper texture for cards
  paper: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  }
}; 
