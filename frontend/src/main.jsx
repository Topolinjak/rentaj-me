import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import UporabnikProvider from './auth/UporabnikProvider.jsx';
import ObvestilaProvider from './obvestila/ObvestilaProvider.jsx';
import { poti } from './poti.jsx';
import './index.css';

const router = createBrowserRouter(poti);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UporabnikProvider>
      <ObvestilaProvider>
        <RouterProvider router={router} />
      </ObvestilaProvider>
    </UporabnikProvider>
  </StrictMode>,
);
