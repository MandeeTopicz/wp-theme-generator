import { useState, useEffect } from 'react'

const STEPS = [
  { label: 'Designing color system...', icon: '🎨' },
  { label: 'Generating templates...', icon: '📄' },
  { label: 'Building patterns...', icon: '🧩' },
  { label: 'Packaging theme...', icon: '📦' },
]

export default function GenerationPanel() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-md mx-auto py-20">
      <h3 className="text-white text-xl font-semibold text-center mb-8">
        Generating your theme...
      </h3>
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const status =
            i < activeStep ? 'complete' : i === activeStep ? 'active' : 'pending'
          return (
            <div
              key={step.label}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                status === 'active'
                  ? 'bg-[#e94560]/10 border border-[#e94560]/30'
                  : status === 'complete'
                    ? 'bg-green-500/5 border border-green-500/20'
                    : 'bg-[#16213e] border border-transparent'
              }`}
            >
              <span className="text-xl w-8 text-center">
                {status === 'complete' ? '✓' : step.icon}
              </span>
              <span
                className={`text-sm flex-1 ${
                  status === 'active'
                    ? 'text-white'
                    : status === 'complete'
                      ? 'text-green-400/70'
                      : 'text-white/30'
                }`}
              >
                {step.label}
              </span>
              {status === 'active' && (
                <svg
                  className="animate-spin h-4 w-4 text-[#e94560]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
