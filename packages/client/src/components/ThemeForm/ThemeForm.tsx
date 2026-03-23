import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeGenerator } from '../../hooks/useThemeGenerator'
import StepDescription from './StepDescription'
import StepIdentity from './StepIdentity'
import StepTypography from './StepTypography'
import StepLayout from './StepLayout'
import StepReview from './StepReview'

export interface FormState {
  description: string
  siteType: string
  targetAudience: string
  themeName: string
  themeSlug: string
  colorMode: 'light' | 'dark' | 'auto'
  accentColor: string
  headingFont: string
  bodyFont: string
  typeScale: 'compact' | 'balanced' | 'generous'
  heroStyle: 'full-width' | 'split' | 'minimal' | 'none'
  navigation: 'sticky' | 'static' | 'hamburger'
  sidebar: boolean
  footer: 'simple' | 'rich'
}

const STEPS = ['Description', 'Identity', 'Typography', 'Layout', 'Review']

const initialState: FormState = {
  description: '',
  siteType: 'blog',
  targetAudience: '',
  themeName: '',
  themeSlug: '',
  colorMode: 'light',
  accentColor: '#e94560',
  headingFont: '',
  bodyFont: '',
  typeScale: 'balanced',
  heroStyle: 'full-width',
  navigation: 'sticky',
  sidebar: false,
  footer: 'simple',
}

export default function ThemeForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const { generate, isLoading, error } = useThemeGenerator()
  const navigate = useNavigate()

  function update(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  async function handleSubmit() {
    const result = await generate({
      description: form.description,
      siteType: form.siteType,
      targetAudience: form.targetAudience || undefined,
      colorMode: form.colorMode,
      accentColor: form.accentColor,
      themeName: form.themeName,
      themeSlug: form.themeSlug,
    })
    if (result) {
      sessionStorage.setItem(
        `result-${result.sessionId}`,
        JSON.stringify(result),
      )
      navigate(`/result/${result.sessionId}`, { state: result })
    }
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setStep(i)}
              className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                i <= step
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#16213e] text-white/40'
              }`}
            >
              {i + 1}
            </button>
            <span
              className={`text-xs hidden sm:inline ${
                i <= step ? 'text-white' : 'text-white/30'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  i < step ? 'bg-[#e94560]' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-[#16213e] rounded-xl p-6">
        {step === 0 && <StepDescription form={form} update={update} />}
        {step === 1 && <StepIdentity form={form} update={update} />}
        {step === 2 && <StepTypography form={form} update={update} />}
        {step === 3 && <StepLayout form={form} update={update} />}
        {step === 4 && (
          <StepReview
            form={form}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm font-medium">
              {error.message || 'An error occurred'}
            </p>
            {error.suggestion && (
              <p className="text-red-300/60 text-xs mt-1">
                Suggestion: {error.suggestion}
              </p>
            )}
            {error.errors?.map((e, i) => (
              <p key={i} className="text-red-300/60 text-xs mt-1">
                {e.field}: {e.message}
              </p>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none"
          >
            Back
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 bg-[#e94560] text-white text-sm font-medium rounded-lg hover:bg-[#d63a54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
