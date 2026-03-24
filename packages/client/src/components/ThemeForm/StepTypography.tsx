import type { FormState } from './ThemeForm'

const HEADING_FONT_SUGGESTIONS = [
  { label: 'Playfair Display', value: 'Playfair Display, serif' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville, serif' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond, serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif' },
  { label: 'DM Serif Display', value: 'DM Serif Display, serif' },
]

const BODY_FONT_SUGGESTIONS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'IBM Plex Sans', value: 'IBM Plex Sans, sans-serif' },
  { label: 'DM Sans', value: 'DM Sans, sans-serif' },
]

const pillRowStyle = {
  scrollbarWidth: 'none' as const,
  msOverflowStyle: 'none' as const,
  WebkitOverflowScrolling: 'touch' as const,
}

const pillClassName =
  'shrink-0 px-2.5 py-1 text-[11px] text-text2 rounded-full border border-white/[0.09] cursor-pointer transition-colors duration-100 hover:border-accent hover:text-text1 active:bg-accent active:text-white focus:outline-none'

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

export default function StepTypography({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="headingFont"
          className="block text-text1 text-sm font-medium mb-2"
        >
          Heading font preference
        </label>
        <input
          id="headingFont"
          type="text"
          value={form.headingFont}
          onChange={(e) => update({ headingFont: e.target.value })}
          placeholder="e.g. Playfair Display, serif"
          className="w-full bg-bg3 border border-border rounded-lg px-4 py-3 text-text1 placeholder-text3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
        />
        <div
          className="flex gap-1.5 overflow-x-auto mt-2"
          style={pillRowStyle}
        >
          {HEADING_FONT_SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => update({ headingFont: s.value })}
              className={pillClassName}
              style={{ backgroundColor: '#12121c' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="bodyFont"
          className="block text-text1 text-sm font-medium mb-2"
        >
          Body font preference
        </label>
        <input
          id="bodyFont"
          type="text"
          value={form.bodyFont}
          onChange={(e) => update({ bodyFont: e.target.value })}
          placeholder="e.g. Inter, sans-serif"
          className="w-full bg-bg3 border border-border rounded-lg px-4 py-3 text-text1 placeholder-text3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
        />
        <div
          className="flex gap-1.5 overflow-x-auto mt-2"
          style={pillRowStyle}
        >
          {BODY_FONT_SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => update({ bodyFont: s.value })}
              className={pillClassName}
              style={{ backgroundColor: '#12121c' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-text1 text-sm font-medium mb-2">
          Type scale
        </label>
        <div className="flex gap-2">
          {(['compact', 'balanced', 'generous'] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => update({ typeScale: scale })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                form.typeScale === scale
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border hover:border-border2'
              }`}
            >
              {scale}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
