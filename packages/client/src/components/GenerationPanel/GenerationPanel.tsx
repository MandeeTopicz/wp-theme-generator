import { useState, useEffect } from 'react'

const STEPS = [
  { label: 'Designing color system...', sublabel: 'Pass 1' },
  { label: 'Generating templates...', sublabel: 'Pass 2' },
  { label: 'Building patterns...', sublabel: 'Pass 3' },
  { label: 'Packaging theme...', sublabel: 'Pass 4' },
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
      <h3 className="text-text1 text-xl font-semibold text-center mb-2">
        Generating your theme
      </h3>
      <p className="text-text3 text-sm text-center mb-10">
        This may take 30-60 seconds
      </p>
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const status =
            i < activeStep ? 'complete' : i === activeStep ? 'active' : 'pending'
          return (
            <div
              key={step.label}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 200}ms`, opacity: 0 }}
            >
              <div
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all ${
                  status === 'active'
                    ? 'bg-accent/5 border-accent/30'
                    : status === 'complete'
                      ? 'bg-green/5 border-green/20'
                      : 'bg-bg2 border-border'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    status === 'complete'
                      ? 'bg-green text-bg0'
                      : status === 'active'
                        ? 'bg-accent text-white'
                        : 'bg-bg3 text-text3'
                  }`}
                >
                  {status === 'complete' ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      status === 'active'
                        ? 'text-text1'
                        : status === 'complete'
                          ? 'text-green/70'
                          : 'text-text3'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-text3 text-[10px] ml-2">
                    {step.sublabel}
                  </span>
                </div>
                {status === 'active' && (
                  <svg
                    className="animate-spin h-4 w-4 text-accent"
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
