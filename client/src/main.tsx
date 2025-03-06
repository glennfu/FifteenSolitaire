import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Helper function to check if an element is interactive
const isInteractiveElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  // Check if it's a button, card, or has a click handler
  const isButton = element.tagName.toLowerCase() === 'button';
  const isCard = element.classList.contains('card') || 
                element.closest('button') !== null;
  
  return isButton || isCard || element.onclick !== null;
};

// Prevent pull-to-refresh and other touch gestures, but allow card interactions
document.addEventListener('touchmove', (e) => {
  const target = e.target as HTMLElement;
  
  // Allow scrolling for elements with scrollable class
  if (target.classList.contains('scrollable')) {
    return;
  }
  
  // Don't prevent default for interactive elements
  if (!isInteractiveElement(target)) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent overscroll/bounce effect, but allow card interactions
document.addEventListener('touchstart', (e) => {
  const target = e.target as HTMLElement;
  
  // Allow scrolling for elements with scrollable class
  if (target.classList.contains('scrollable')) {
    return;
  }
  
  // Don't prevent default for interactive elements
  if (!isInteractiveElement(target)) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent double-tap zoom, but allow card interactions
document.addEventListener('touchend', (e) => {
  const target = e.target as HTMLElement;
  
  // Allow scrolling for elements with scrollable class
  if (target.classList.contains('scrollable')) {
    return;
  }
  
  // Don't prevent default for interactive elements
  if (!isInteractiveElement(target)) {
    e.preventDefault();
  }
}, { passive: false });