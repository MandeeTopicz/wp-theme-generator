import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGeneration } from '../../context/GenerationContext'
import StepDescription from './StepDescription'
import StepIdentity from './StepIdentity'
import StepColorPalette from './StepColorPalette'
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
  colorPalette?: { name: string; colors: string[] }
  headingFont: string
  bodyFont: string
  typeScale: 'compact' | 'balanced' | 'generous'
  heroStyle: 'full-width' | 'split' | 'minimal' | 'none'
  navigation: 'sticky' | 'static' | 'hamburger'
  sidebar: boolean
  footer: 'simple' | 'rich'
}

const STEPS = ['Description', 'Identity', 'Colors', 'Typography', 'Layout', 'Review']

const initialState: FormState = {
  description: '',
  siteType: 'blog',
  targetAudience: '',
  themeName: '',
  themeSlug: '',
  colorMode: 'light',
  accentColor: '#7c6fff',
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
  const { generate, status, reset } = useGeneration()
  const navigate = useNavigate()

  useEffect(() => {
    reset()
  }, [reset])

  function update(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function handleSubmit() {
    generate({
      description: form.description,
      siteType: form.siteType,
      targetAudience: form.targetAudience || undefined,
      colorMode: form.colorMode,
      accentColor: form.accentColor,
      themeName: form.themeName,
      themeSlug: form.themeSlug,
      colorPalette: form.colorPalette,
    })
    navigate('/result/pending')
  }

  const isLoading = status === 'generating'
  const lastStep = STEPS.length - 1

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setStep(i)}
              className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                i <= step
                  ? 'bg-accent text-white'
                  : 'bg-bg2 text-text3 border border-border'
              }`}
            >
              {i + 1}
            </button>
            <span
              className={`text-xs hidden sm:inline ${
                i <= step ? 'text-text1' : 'text-text3'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  i < step ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-bg2 border border-border rounded-xl p-6">
        {step === 0 && <StepDescription form={form} update={update} />}
        {step === 1 && <StepIdentity form={form} update={update} />}
        {step === 2 && <StepColorPalette form={form} update={update} />}
        {step === 3 && <StepTypography form={form} update={update} />}
        {step === 4 && <StepLayout form={form} update={update} />}
        {step === 5 && (
          <StepReview
            form={form}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-text2 hover:text-text1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none"
          >
            Back
          </button>
          {step < lastStep && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
