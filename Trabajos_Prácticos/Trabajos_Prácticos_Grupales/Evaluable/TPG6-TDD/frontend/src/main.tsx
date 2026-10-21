import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import './index.css';
import { CheckoutPage } from './pages/checkout-page';
import { EmailPage } from './pages/email-page';
import { PurchasePage } from './pages/purchase-page';
import { ResultPage } from './pages/result-page';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PurchasePage />} />
        <Route path="/mercado-pago/:purchaseId" element={<CheckoutPage />} />
        <Route path="/compras/:purchaseId" element={<ResultPage />} />
        <Route path="/compras/:purchaseId/correo" element={<EmailPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
