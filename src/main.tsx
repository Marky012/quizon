import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

/* The <div id="root"> this looks for is declared in index.html. If it is
   renamed there, it must be renamed here too. */
const host = document.getElementById('root')
if (!host) throw new Error('index.html is missing <div id="root">')

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)