import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Firebase and analytics
import "./lib/firebase";

// Initialize performance monitoring
import { performanceMonitor } from "./lib/performance-monitor";

// Register service worker for offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Start performance monitoring
if (import.meta.env.PROD) {
  performanceMonitor.recordMetric('app_init', Date.now());
}

createRoot(document.getElementById("root")!).render(<App />);
