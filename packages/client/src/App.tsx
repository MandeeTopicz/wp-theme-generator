import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GeneratePage from './pages/GeneratePage'
import ResultPage from './pages/ResultPage'

function Nav() {
  return (
    <nav className="bg-[#1a1a2e] border-b border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e94560] flex items-center justify-center text-white font-bold text-sm">
            WP
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">
              WP Theme Generator
            </h1>
            <p className="text-white/40 text-xs">
              AI-powered WordPress block themes
            </p>
          </div>
        </Link>
        <Link
          to="/generate"
          className="px-4 py-2 bg-[#e94560] text-white text-sm font-medium rounded-lg hover:bg-[#d63a54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50"
        >
          Generate Theme
        </Link>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
      </Routes>
    </div>
  )
}
