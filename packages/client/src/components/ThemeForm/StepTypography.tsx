import type { FormState } from './ThemeForm'

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
