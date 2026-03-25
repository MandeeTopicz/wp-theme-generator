import { Routes, Route, Link } from 'react-router-dom'
import { GenerationProvider } from './context/GenerationContext'
import HomePage from './pages/HomePage'
import GeneratePage from './pages/GeneratePage'
import ResultPage from './pages/ResultPage'

function Nav() {
  return (
    <nav className="bg-bg1 border-b border-border px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-white font-bold text-[10px]"
            style={{
              background: 'linear-gradient(135deg, #7c6fff, #ff6b9d)',
            }}
          >
            WP
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text1 font-semibold text-sm tracking-[-0.01em]">
              Theme Generator
            </span>
            <span className="text-text3 text-[10px] font-medium bg-bg2 border border-border px-1.5 py-0.5 rounded-full">
              v1.0
            </span>
          </div>
        </Link>
        <Link
          to="/generate"
          className="px-4 py-1.5 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent/90 transition-colors"
        >
          Generate New Theme
        </Link>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <GenerationProvider>
      <div className="min-h-screen bg-bg0 text-text1">
        <Nav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/result/:sessionId" element={<ResultPage />} />
        </Routes>
      </div>
    </GenerationProvider>
  )
}
