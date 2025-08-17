import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import AppSimple from './AppSimple.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  // Try the full app
  root.render(<App />);
} else {
  console.error('Root element not found!');
}
