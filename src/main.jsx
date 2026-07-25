import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { storage } from './utils/storage'
import { applyMotion } from './utils/motion'
import { registerServiceWorker } from './utils/pwa'
import './index.css'

// Antes do primeiro render, para não haver um flash com todas as animações
// ligadas em quem escolheu o modo leve.
applyMotion(storage.get('motion_mode') || 'auto')

registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
