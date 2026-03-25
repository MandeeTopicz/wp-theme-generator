import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGeneration } from '../../context/GenerationContext'
import StepTemplate from './StepTemplate'
import StepDescription from './StepDescription'
import StepIdentity from './StepIdentity'
import StepColorPalette from './StepColorPalette'
import StepTypography from './StepTypography'
import StepReview from './StepReview'

export interface FormState {
  templateId: string
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
}

const STEPS = ['Template', 'Description', 'Identity', 'Colors', 'Typography', 'Review']

const initialState: FormState = {
  templateId: 'starter',
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
    console.log('[ThemeForm] Submit triggered, template:', form.templateId, 'themeName:', form.themeName)
    generate({
      description: form.description,
      siteType: form.siteType,
      targetAudience: form.targetAudience || undefined,
      colorMode: form.colorMode,
      accentColor: form.accentColor,
      themeName: form.themeName,
      themeSlug: form.themeSlug,
      colorPalette: form.colorPalette,
      templateId: form.templateId,
    })
    navigate('/result/pending')
  }

  const isLoading = status === 'generating'
  const lastStep = STEPS.length - 1

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent/50 hover-scale ${
                  i <= step
                    ? 'bg-accent text-white'
                    : 'bg-bg2 text-text3 border border-border'
                }`}
              >
                {i + 1}
              </button>
              <span
                className={`text-[11px] ${
                  i <= step ? 'text-text1' : 'text-text3'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 mt-[-1.25rem] ${
                  i < step ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        {step === 0 && <StepTemplate form={form} update={update} />}
        {step === 1 && <StepDescription form={form} update={update} />}
        {step === 2 && <StepIdentity form={form} update={update} />}
        {step === 3 && <StepColorPalette form={form} update={update} />}
        {step === 4 && <StepTypography form={form} update={update} />}
        {step === 5 && (
          <StepReview
            form={form}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-5 pt-4 border-t border-border">
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
              className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/50 hover-lift"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
