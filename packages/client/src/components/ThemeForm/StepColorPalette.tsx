import { useState } from 'react'
import type { FormState } from './ThemeForm'

const PRESET_PALETTES = [
  { name: 'Obsidian', description: 'Dark editorial', colors: ['#0a0a0a', '#1a1a1a', '#2d2d2d', '#a8a8a8', '#f5f5f5', '#e94560'] },
  { name: 'Atelier', description: 'Warm luxury', colors: ['#1a1209', '#2c1f0e', '#8b6914', '#d4af6e', '#f5efe6', '#c9a84c'] },
  { name: 'Nordic', description: 'Clean minimal', colors: ['#1a2332', '#2c3e55', '#4a6fa5', '#a8c0d6', '#f0f4f8', '#4a90e2'] },
  { name: 'Forest', description: 'Natural organic', colors: ['#1a2e1a', '#2d4a2d', '#4a7c59', '#8ab89a', '#f0f5f0', '#5a9e6f'] },
  { name: 'Dusk', description: 'Purple dusk', colors: ['#12091a', '#1e0f2e', '#4a1e6e', '#9b6bb5', '#f0e8f8', '#7c3aed'] },
  { name: 'Ember', description: 'Warm terracotta', colors: ['#1a0f0a', '#2e1a12', '#8b3a1e', '#d4785a', '#f5ede8', '#c0542e'] },
  { name: 'Linen', description: 'Soft boutique', colors: ['#1a1814', '#2e2b24', '#6b5c3e', '#c4a882', '#f5f0e8', '#8b6914'] },
  { name: 'Midnight', description: 'Deep ocean', colors: ['#060d1a', '#0d1f3c', '#1a3a6e', '#4a7ab5', '#e8f0f8', '#2563eb'] },
]

const COLOR_LABELS = ['Background', 'Surface', 'Accent', 'Muted', 'Light', 'Highlight']

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

export default function StepColorPalette({ form, update }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    form.colorPalette?.name ?? null,
  )
  const [customColors, setCustomColors] = useState<string[]>(
    form.colorPalette?.colors ?? PRESET_PALETTES[0]!.colors,
  )
  const [showCustomize, setShowCustomize] = useState(false)

  function selectPreset(preset: (typeof PRESET_PALETTES)[number]) {
    setSelectedPreset(preset.name)
    setCustomColors([...preset.colors])
    setShowCustomize(false)
    update({ colorPalette: { name: preset.name, colors: [...preset.colors] } })
  }

  function updateColor(index: number, color: string) {
    const updated = [...customColors]
    updated[index] = color
    setCustomColors(updated)
    update({ colorPalette: { name: selectedPreset ?? 'Custom', colors: updated } })
  }

  function resetToPreset() {
    const preset = PRESET_PALETTES.find((p) => p.name === selectedPreset)
    if (preset) {
      setCustomColors([...preset.colors])
      update({ colorPalette: { name: preset.name, colors: [...preset.colors] } })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text1 text-sm font-medium mb-3">
          Choose a color palette
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_PALETTES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => selectPreset(preset)}
              className={`text-left p-3 rounded-xl transition-all focus:outline-none ${
                selectedPreset === preset.name
                  ? 'ring-2 ring-accent bg-accent/5'
                  : 'bg-bg3 border border-border hover:border-border2'
              }`}
            >
              <p className="text-text1 text-sm font-medium">{preset.name}</p>
              <p className="text-text3 text-[11px] mb-2">{preset.description}</p>
              <div className="flex gap-1.5">
                {preset.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPreset && (
        <div>
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className="text-accent text-sm hover:text-accent/80 transition-colors focus:outline-none"
          >
            {showCustomize ? 'Hide customization' : 'Customize colors'}
          </button>

          {showCustomize && (
            <div className="mt-3 space-y-3 bg-bg3 border border-border rounded-xl p-4">
              {customColors.map((color, i) => (
                <div key={i} className="flex items-center gap-3">
                  <label className="text-text2 text-xs w-20 shrink-0">
                    {COLOR_LABELS[i] ?? `Color ${i + 1}`}
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="w-24 bg-bg2 border border-border rounded px-2 py-1 text-text1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
              ))}
              <button
                onClick={resetToPreset}
                className="text-text3 text-xs hover:text-text2 transition-colors focus:outline-none"
              >
                Reset to preset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
