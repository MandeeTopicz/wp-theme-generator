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
          className="block text-white text-sm font-medium mb-2"
        >
          Heading font preference
        </label>
        <input
          id="headingFont"
          type="text"
          value={form.headingFont}
          onChange={(e) => update({ headingFont: e.target.value })}
          placeholder="e.g. Playfair Display, serif"
          className="w-full bg-[#0f0f23] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="bodyFont"
          className="block text-white text-sm font-medium mb-2"
        >
          Body font preference
        </label>
        <input
          id="bodyFont"
          type="text"
          value={form.bodyFont}
          onChange={(e) => update({ bodyFont: e.target.value })}
          placeholder="e.g. Inter, sans-serif"
          className="w-full bg-[#0f0f23] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Type scale
        </label>
        <div className="flex gap-2">
          {(['compact', 'balanced', 'generous'] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => update({ typeScale: scale })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                form.typeScale === scale
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#0f0f23] text-white/60 hover:text-white border border-white/10'
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
