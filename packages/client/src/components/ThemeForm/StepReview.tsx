import type { FormState } from './ThemeForm'

interface Props {
  form: FormState
  isLoading: boolean
  onSubmit: () => void
}

export default function StepReview({ form, isLoading, onSubmit }: Props) {
  const rows: [string, string][] = [
    ['Theme name', form.themeName || '(not set)'],
    ['Theme slug', form.themeSlug || '(not set)'],
    ['Site type', form.siteType],
    ['Color mode', form.colorMode],
    ['Accent color', form.accentColor],
    ['Heading font', form.headingFont || '(default)'],
    ['Body font', form.bodyFont || '(default)'],
    ['Type scale', form.typeScale],
    ['Hero style', form.heroStyle],
    ['Navigation', form.navigation],
    ['Sidebar', form.sidebar ? 'Yes' : 'No'],
    ['Footer', form.footer],
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold text-lg">Review your choices</h3>

      <div className="bg-[#0f0f23] rounded-lg overflow-hidden">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={`flex justify-between px-4 py-3 text-sm ${
              i % 2 === 0 ? 'bg-white/[0.02]' : ''
            }`}
          >
            <span className="text-white/50">{label}</span>
            <span className="text-white font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#0f0f23] rounded-lg p-4">
        <p className="text-white/40 text-sm">
          <strong className="text-white/60">Description:</strong>{' '}
          {form.description.slice(0, 200)}
          {form.description.length > 200 ? '...' : ''}
        </p>
      </div>

      <p className="text-white/30 text-sm text-center">
        Estimated generation time: ~30-60 seconds
      </p>

      <button
        onClick={onSubmit}
        disabled={isLoading || !form.themeName || !form.themeSlug || form.description.length < 20}
        className="w-full py-4 bg-[#e94560] text-white font-semibold text-lg rounded-xl hover:bg-[#d63a54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 flex items-center justify-center gap-3"
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5"
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
        {isLoading ? 'Generating...' : 'Generate Theme'}
      </button>
    </div>
  )
}
