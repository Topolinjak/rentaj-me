import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import UporabnikProvider from './auth/UporabnikProvider.jsx';
import { poti } from './poti.jsx';
import './index.css';

const router = createBrowserRouter(poti);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UporabnikProvider>
      <RouterProvider router={router} />
    </UporabnikProvider>
  </StrictMode>,
);
