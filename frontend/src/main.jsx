import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { PublicationProvider } from './context/PublicationContext';
import { CommandeProvider } from './context/CommandeContext';
import { AudioProvider } from './context/AudioContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PublicationProvider>
        <CommandeProvider>
          <AudioProvider>
            <App />
          </AudioProvider>
        </CommandeProvider>
      </PublicationProvider>
    </AuthProvider>
  </StrictMode>
);