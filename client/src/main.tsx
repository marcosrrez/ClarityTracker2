import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Firebase and analytics
import "./lib/firebase";

createRoot(document.getElementById("root")!).render(<App />);
