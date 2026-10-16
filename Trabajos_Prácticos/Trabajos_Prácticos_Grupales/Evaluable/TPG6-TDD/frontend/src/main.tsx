import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PurchasePage } from './pages/purchase-page';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PurchasePage />
  </StrictMode>,
);
