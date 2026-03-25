import { useState } from 'react'
import type { FormState } from './ThemeForm'

/**
 * Palettes define brand/accent colors only. The light/dark mode toggle
 * (set in StepIdentity) controls whether backgrounds are light or dark.
 * The server resolveColorSlugs() picks bg/text from the palette based on luminance.
 *
 * Each palette has 6 colors ordered darkest → lightest:
 *   [dark-base, dark-surface, brand-accent, mid-tone, light-surface, light-base]
 *
 * In LIGHT mode the server uses the lightest as bg, darkest as text.
 * In DARK mode the server uses the darkest as bg, lightest as text.
 */
const PRESET_PALETTES = [
  { name: 'Slate',    description: 'Clean neutral',    colors: ['#1e293b', '#334155', '#6366f1', '#94a3b8', '#f1f5f9', '#ffffff'] },
  { name: 'Rose',     description: 'Warm elegant',     colors: ['#1c1917', '#44403c', '#e11d48', '#a8a29e', '#faf5f2', '#ffffff'] },
  { name: 'Ocean',    description: 'Cool professional', colors: ['#0c1222', '#1e3a5f', '#0ea5e9', '#7dd3fc', '#f0f9ff', '#ffffff'] },
  { name: 'Forest',   description: 'Natural organic',   colors: ['#14231a', '#2d4a2d', '#22c55e', '#86efac', '#f0fdf4', '#ffffff'] },
  { name: 'Violet',   description: 'Creative bold',     colors: ['#13061f', '#2e1065', '#8b5cf6', '#c4b5fd', '#f5f3ff', '#ffffff'] },
  { name: 'Amber',    description: 'Warm friendly',     colors: ['#1a1207', '#422006', '#f59e0b', '#fcd34d', '#fffbeb', '#ffffff'] },
  { name: 'Coral',    description: 'Soft boutique',     colors: ['#1a0f0c', '#3b1a12', '#f97316', '#fdba74', '#fff7ed', '#ffffff'] },
  { name: 'Teal',     description: 'Fresh modern',      colors: ['#0a1a1a', '#134e4a', '#14b8a6', '#5eead4', '#f0fdfa', '#ffffff'] },
]

const COLOR_LABELS = ['Dark Base', 'Dark Surface', 'Accent', 'Mid-tone', 'Light Surface', 'Light Base']

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
    <div className="space-y-4">
      <div>
        <label className="block text-text1 text-sm font-medium mb-1">
          Choose a color palette
        </label>
        <p className="text-text3 text-xs mb-3">
          Light or dark backgrounds are controlled by color mode in the Identity step.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESET_PALETTES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => selectPreset(preset)}
              className={`text-left p-3 rounded-lg focus:outline-none hover-lift ${
                selectedPreset === preset.name
                  ? 'ring-2 ring-accent bg-accent/5'
                  : 'bg-bg3 border border-border hover:border-border2'
              }`}
            >
              <p className="text-text1 text-sm font-medium">{preset.name}</p>
              <p className="text-text3 text-[10px] mb-1.5">{preset.description}</p>
              <div className="flex gap-1">
                {preset.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-white/10"
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
                  <label className="text-text2 text-xs w-24 shrink-0">
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
