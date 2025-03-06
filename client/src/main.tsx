import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Prevent pull-to-refresh and other touch gestures
document.addEventListener('touchmove', (e) => {
  if (!e.target || !(e.target as HTMLElement).classList.contains('scrollable')) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent overscroll/bounce effect
  document.addEventListener('touchstart', (e) => {
    if (!e.target || !(e.target as HTMLElement).classList.contains('scrollable')) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent double-tap zoom
  document.addEventListener('touchend', (e) => {
    if (!e.target || !(e.target as HTMLElement).classList.contains('scrollable')) {
      e.preventDefault();
    }
  }, { passive: false });