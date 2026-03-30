/**
 * @fileoverview Entry point for gcpkce_auth_poc.
 * Mounts the root React component into the DOM.
 * @module main
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App2.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
