import type { FormState } from './ThemeForm'

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

const VALID_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export default function StepIdentity({ form, update }: Props) {
  const slugValid = form.themeSlug.length === 0 || VALID_SLUG.test(form.themeSlug)

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="themeName"
          className="block text-text1 text-sm font-medium mb-2"
        >
          Theme name
        </label>
        <input
          id="themeName"
          type="text"
          value={form.themeName}
          onChange={(e) => {
            const name = e.target.value
            update({ themeName: name, themeSlug: toSlug(name) })
          }}
          placeholder="My Awesome Theme"
          className="w-full bg-bg3 border border-border rounded-lg px-4 py-3 text-text1 placeholder-text3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="themeSlug"
          className="block text-text1 text-sm font-medium mb-2"
        >
          Theme slug
        </label>
        <input
          id="themeSlug"
          type="text"
          value={form.themeSlug}
          onChange={(e) => update({ themeSlug: e.target.value })}
          placeholder="my-awesome-theme"
          className={`w-full bg-bg3 border rounded-lg px-4 py-3 text-text1 placeholder-text3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors ${
            slugValid ? 'border-border' : 'border-red-500/50'
          }`}
        />
        {!slugValid && (
          <p className="text-red-400 text-xs mt-1">
            Slug must be lowercase letters, numbers, and single hyphens only
          </p>
        )}
      </div>

      <div>
        <label className="block text-text1 text-sm font-medium mb-2">
          Color mode
        </label>
        <div className="flex gap-2">
          {(['light', 'dark', 'auto'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => update({ colorMode: mode })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                form.colorMode === mode
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border hover:border-border2'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="accentColor"
          className="block text-text1 text-sm font-medium mb-2"
        >
          Accent color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.accentColor}
            onChange={(e) => update({ accentColor: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
          />
          <input
            id="accentColor"
            type="text"
            value={form.accentColor}
            onChange={(e) => update({ accentColor: e.target.value })}
            className="w-32 bg-bg3 border border-border rounded-lg px-4 py-2 text-text1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
