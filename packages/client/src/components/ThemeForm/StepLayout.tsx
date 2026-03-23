import type { FormState } from './ThemeForm'

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

const HERO_STYLES: { value: FormState['heroStyle']; label: string; icon: string }[] = [
  { value: 'full-width', label: 'Full Width', icon: '▬' },
  { value: 'split', label: 'Split', icon: '◧' },
  { value: 'minimal', label: 'Minimal', icon: '▭' },
  { value: 'none', label: 'None', icon: '○' },
]

export default function StepLayout({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white text-sm font-medium mb-3">
          Hero style
        </label>
        <div className="grid grid-cols-4 gap-3">
          {HERO_STYLES.map((hero) => (
            <button
              key={hero.value}
              onClick={() => update({ heroStyle: hero.value })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                form.heroStyle === hero.value
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#0f0f23] text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <span className="text-2xl">{hero.icon}</span>
              <span className="text-xs">{hero.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Navigation
        </label>
        <div className="flex gap-2">
          {(['sticky', 'static', 'hamburger'] as const).map((nav) => (
            <button
              key={nav}
              onClick={() => update({ navigation: nav })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                form.navigation === nav
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#0f0f23] text-white/60 hover:text-white border border-white/10'
              }`}
            >
              {nav}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8">
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Sidebar
          </label>
          <button
            onClick={() => update({ sidebar: !form.sidebar })}
            className={`w-14 h-7 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
              form.sidebar ? 'bg-[#e94560]' : 'bg-[#0f0f23] border border-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                form.sidebar ? 'left-7' : 'left-0.5'
              }`}
            />
          </button>
        </div>
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Footer
          </label>
          <div className="flex gap-2">
            {(['simple', 'rich'] as const).map((f) => (
              <button
                key={f}
                onClick={() => update({ footer: f })}
                className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 ${
                  form.footer === f
                    ? 'bg-[#e94560] text-white'
                    : 'bg-[#0f0f23] text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
