import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set up any global styles or themes
import "@/lib/utils";

createRoot(document.getElementById("root")!).render(<App />);
