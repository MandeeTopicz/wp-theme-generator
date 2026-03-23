import type { FormState } from './ThemeForm'

const SITE_TYPES = ['blog', 'portfolio', 'business', 'store', 'docs']

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

export default function StepDescription({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="description"
          className="block text-white text-sm font-medium mb-2"
        >
          Describe your ideal theme
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="A modern photography portfolio with a dark aesthetic, large hero images, and a minimal navigation..."
          rows={5}
          maxLength={1000}
          className="w-full bg-[#0f0f23] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-transparent"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/30">Min 20 characters</span>
          <span
            className={`text-xs ${
              form.description.length > 950
                ? 'text-[#e94560]'
                : 'text-white/30'
            }`}
          >
            {form.description.length}/1000
          </span>
        </div>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Site type
        </label>
        <div className="flex flex-wrap gap-2">
          {SITE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => update({ siteType: type })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                form.siteType === type
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#0f0f23] text-white/60 hover:text-white border border-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="targetAudience"
          className="block text-white text-sm font-medium mb-2"
        >
          Target audience{' '}
          <span className="text-white/30 font-normal">(optional)</span>
        </label>
        <input
          id="targetAudience"
          type="text"
          value={form.targetAudience}
          onChange={(e) => update({ targetAudience: e.target.value })}
          placeholder="e.g. Creative professionals, tech startups"
          className="w-full bg-[#0f0f23] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-transparent"
        />
      </div>
    </div>
  )
}
