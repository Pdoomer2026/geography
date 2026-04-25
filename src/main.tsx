import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './ui/App'
import OutputPage from './ui/OutputPage'

const isOutput = window.location.pathname === '/output'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isOutput ? <OutputPage /> : <App />}
  </StrictMode>,
)
