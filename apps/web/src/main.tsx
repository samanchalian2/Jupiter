import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'shabnam-font/dist/font-face.css';
import { App } from './App.js';
import { initializeThemeMode } from './AppearanceTokens.js';
import './styles.css';
import './design-system.css';

initializeThemeMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
