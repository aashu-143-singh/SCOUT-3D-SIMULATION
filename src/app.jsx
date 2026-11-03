import { useState } from 'react'
import Intro from './components/Intro.jsx'
import Dashboard from './components/Dashboard.jsx'
import './App.css'

export default function App() {
  // Starts with 'intro' per user requirement ("first starts with the intro and then the dasgboard comes")
  const [currentView, setCurrentView] = useState('intro')

  return (
    <div className="app-root">
      {currentView === 'intro' ? (
        <Intro
          onLaunchDashboard={() => setCurrentView('dashboard')}
          onStartAutopilot={() => setCurrentView('dashboard')}
        />
      ) : (
        <Dashboard
          onReturnToIntro={() => setCurrentView('intro')}
        />
      )}
    </div>
  )
}
