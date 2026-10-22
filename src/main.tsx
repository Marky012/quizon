import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { captureInstallPrompt } from './lib/install'
import { startSync } from './sync/manager'
import './index.css'

/* The <div id="root"> this looks for is declared in index.html. If it is
   renamed there, it must be renamed here too. */
const host = document.getElementById('root')
if (!host) throw new Error('index.html is missing <div id="root">')

/* The sync manager listens for the learner's progress and for the network
   coming back, and sends the record to the teacher's dashboard. It is started
   once, here, and it never blocks anything: if there is no teacher dashboard
   attached to this build, it does nothing at all. See src/sync/manager.ts. */
startSync()

/* Listen for the browser's offer to install QuizOn! as an app.
   The event fires ONCE per page load and only while the page is running, so
   nothing may be listening at that moment or the offer is lost for good. This
   is therefore the very first thing the app does. See src/lib/install.ts. */
captureInstallPrompt()

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)