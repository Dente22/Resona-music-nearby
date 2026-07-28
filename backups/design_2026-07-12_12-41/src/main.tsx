import { createRoot } from "react-dom/client"
import App from "./app/App.tsx"
import { installBrowserApiFallback } from "./lib/electronApi"
import "./styles/index.css"

installBrowserApiFallback()

createRoot(document.getElementById("root")!).render(<App />)
