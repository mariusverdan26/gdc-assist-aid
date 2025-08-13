import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import AppSimple from './AppSimple.tsx'
import './index.css'

console.log('main.tsx loading...');

const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  // Try the full app
  root.render(<App />);
  console.log('App rendered successfully');
} else {
  console.error('Root element not found!');
}
