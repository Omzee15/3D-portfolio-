import './App.css'
import SplineScene from './components/SplineScene'
import OrientationPrompt from './components/OrientationPrompt'

function App() {
  return (
    <OrientationPrompt>
      <div className="app">
        <SplineScene />
      </div>
    </OrientationPrompt>
  )
}

export default App
