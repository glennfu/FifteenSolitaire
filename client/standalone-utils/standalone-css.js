// Minimal CSS for standalone mode
export const minimalCss = `
<style>
  /* Set basic variables */
  :root {
    --radius: 0.5rem;
  }
  
  /* iOS specific styles for PWA */
  .ios-standalone {
    position: fixed;
    width: 100%;
    height: 100%;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Hide Safari UI components when in standalone mode */
  .ios-standalone .safari-ui {
    display: none;
  }
  
  /* Adjust for iOS safe areas */
  @supports (padding: max(0px)) {
    body {
      padding-top: max(0px, env(safe-area-inset-top));
      padding-bottom: max(0px, env(safe-area-inset-bottom));
      padding-left: max(0px, env(safe-area-inset-left));
      padding-right: max(0px, env(safe-area-inset-right));
    }
  }
  
  /* Ensure background color is set for html and body */
  html, body {
    background-color: #0d5c2e !important;
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }
  
  /* Ensure cards are not translucent */
  .card {
    background-color: #fff !important;
    opacity: 1 !important;
  }
  
  /* Fix card noise texture */
  .card-noise {
    opacity: 0.8 !important;
    mix-blend-mode: multiply !important;
    background-color: #e6e6e6 !important;
  }
  
  /* Ensure the felt background is properly styled */
  .felt-background {
    background-color: #0d5c2e !important;
    background-image: radial-gradient(circle at center, #1a6c3d 0%, #0d5c2e 100%) !important;
    box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* Ensure content is positioned above the background */
  #root {
    position: relative !important;
    z-index: 2 !important;
  }
</style>
`;

// Fallback CSS if extraction fails
export const fallbackCss = `
  :root {
    --radius: 1rem;
  }
  
  @media (prefers-color-scheme: dark) {
    :root {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
    }
  }
  
  .rounded-lg {
    border-radius: var(--radius);
  }
  
  /* Ensure cards are not translucent */
  .card {
    background-color: #fff !important;
    opacity: 1 !important;
  }
  
  /* Fix card noise texture */
  .card-noise {
    opacity: 0.8 !important;
    mix-blend-mode: multiply !important;
    background-color: #e6e6e6 !important;
  }
`; 