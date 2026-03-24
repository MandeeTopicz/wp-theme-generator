import type { FormState } from './ThemeForm'

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

const HERO_STYLES: { value: FormState['heroStyle']; label: string; icon: string }[] = [
  { value: 'full-width', label: 'Full Width', icon: '\u25AC' },
  { value: 'split', label: 'Split', icon: '\u25E7' },
  { value: 'minimal', label: 'Minimal', icon: '\u25AD' },
  { value: 'none', label: 'None', icon: '\u25CB' },
]

export default function StepLayout({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text1 text-sm font-medium mb-3">
          Hero style
        </label>
        <div className="grid grid-cols-4 gap-3">
          {HERO_STYLES.map((hero) => (
            <button
              key={hero.value}
              onClick={() => update({ heroStyle: hero.value })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                form.heroStyle === hero.value
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border hover:border-border2'
              }`}
            >
              <span className="text-2xl">{hero.icon}</span>
              <span className="text-xs">{hero.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-text1 text-sm font-medium mb-2">
          Navigation
        </label>
        <div className="flex gap-2">
          {(['sticky', 'static', 'hamburger'] as const).map((nav) => (
            <button
              key={nav}
              onClick={() => update({ navigation: nav })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                form.navigation === nav
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border hover:border-border2'
              }`}
            >
              {nav}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8">
        <div>
          <label className="block text-text1 text-sm font-medium mb-2">
            Sidebar
          </label>
          <button
            onClick={() => update({ sidebar: !form.sidebar })}
            className={`w-14 h-7 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              form.sidebar ? 'bg-accent' : 'bg-bg3 border border-border'
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
          <label className="block text-text1 text-sm font-medium mb-2">
            Footer
          </label>
          <div className="flex gap-2">
            {(['simple', 'rich'] as const).map((f) => (
              <button
                key={f}
                onClick={() => update({ footer: f })}
                className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                  form.footer === f
                    ? 'bg-accent text-white'
                    : 'bg-bg3 text-text2 hover:text-text1 border border-border hover:border-border2'
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
