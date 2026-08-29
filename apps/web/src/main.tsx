import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'shabnam-font/dist/font-face.css';
import { App } from './App.js';
import './styles.css';
import './design-system.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
