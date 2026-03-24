import type { FormState } from './ThemeForm'

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

function HeroFullWidth() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      <rect x="0" y="0" width="120" height="80" rx="4" fill="#1a1a2e" />
      <rect x="0" y="0" width="120" height="55" fill="#2d2d44" />
      <rect x="35" y="20" width="50" height="6" rx="2" fill="#f5f5f5" />
      <rect x="42" y="30" width="36" height="4" rx="1" fill="#a8a8a8" />
      <rect x="45" y="38" width="30" height="6" rx="3" fill="#7c6fff" />
      <rect x="10" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="45" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="80" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
    </svg>
  )
}

function HeroSplit() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      <rect x="0" y="0" width="120" height="80" rx="4" fill="#1a1a2e" />
      <rect x="0" y="0" width="55" height="55" fill="#2d2d44" />
      <rect x="62" y="15" width="48" height="5" rx="2" fill="#f5f5f5" />
      <rect x="62" y="24" width="40" height="3" rx="1" fill="#a8a8a8" />
      <rect x="62" y="30" width="44" height="3" rx="1" fill="#a8a8a8" />
      <rect x="62" y="38" width="28" height="5" rx="2" fill="#7c6fff" />
      <rect x="10" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="45" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="80" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
    </svg>
  )
}

function HeroMinimal() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      <rect x="0" y="0" width="120" height="80" rx="4" fill="#1a1a2e" />
      <rect x="30" y="18" width="60" height="5" rx="2" fill="#f5f5f5" />
      <rect x="35" y="27" width="50" height="3" rx="1" fill="#a8a8a8" />
      <rect x="38" y="33" width="44" height="3" rx="1" fill="#a8a8a8" />
      <rect x="10" y="50" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="45" y="50" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="80" y="50" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="10" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="45" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
      <rect x="80" y="62" width="30" height="4" rx="1" fill="#3d3d55" />
    </svg>
  )
}

function HeroNone() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      <rect x="0" y="0" width="120" height="80" rx="4" fill="#1a1a2e" />
      <rect x="10" y="12" width="100" height="4" rx="1" fill="#3d3d55" />
      <rect x="10" y="22" width="80" height="3" rx="1" fill="#2d2d44" />
      <rect x="10" y="28" width="90" height="3" rx="1" fill="#2d2d44" />
      <rect x="10" y="38" width="100" height="4" rx="1" fill="#3d3d55" />
      <rect x="10" y="48" width="85" height="3" rx="1" fill="#2d2d44" />
      <rect x="10" y="54" width="95" height="3" rx="1" fill="#2d2d44" />
      <rect x="10" y="64" width="100" height="4" rx="1" fill="#3d3d55" />
      <rect x="10" y="72" width="70" height="3" rx="1" fill="#2d2d44" />
    </svg>
  )
}

const HERO_STYLES: {
  value: FormState['heroStyle']
  label: string
  Preview: () => JSX.Element
}[] = [
  { value: 'full-width', label: 'Full Width', Preview: HeroFullWidth },
  { value: 'split', label: 'Split', Preview: HeroSplit },
  { value: 'minimal', label: 'Minimal', Preview: HeroMinimal },
  { value: 'none', label: 'None', Preview: HeroNone },
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
              className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all focus:outline-none ${
                form.heroStyle === hero.value
                  ? 'ring-2 ring-accent bg-accent/5'
                  : 'bg-bg3 border border-border hover:border-border2'
              }`}
            >
              <div className="w-full aspect-[3/2] rounded-lg overflow-hidden">
                <hero.Preview />
              </div>
              <span className="text-xs text-text2">{hero.label}</span>
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
