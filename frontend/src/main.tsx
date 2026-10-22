import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applySavedPrintPaperSize } from '@/lib/paperSize'
import { resetExampleDocuments } from '@/lib/resetExampleDocuments'
import { remapRenumberedSetupCodes } from '@/lib/remapRenumberedSetupCodes'

resetExampleDocuments()
remapRenumberedSetupCodes()
applySavedPrintPaperSize()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
