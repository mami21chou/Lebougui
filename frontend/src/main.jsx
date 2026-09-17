import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/designSystem.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { PublicationProvider } from './context/PublicationContext'
import { CommandeProvider } from './context/CommandeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PublicationProvider>
        <CommandeProvider>
          <App />
        </CommandeProvider>
      </PublicationProvider>
    </AuthProvider>
  </StrictMode>,
)
