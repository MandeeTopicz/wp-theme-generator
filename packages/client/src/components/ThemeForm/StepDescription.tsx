import { useRef } from 'react'
import type { FormState } from './ThemeForm'

const SITE_TYPES = ['blog', 'portfolio', 'business', 'store', 'docs']

const PROMPT_SUGGESTIONS = [
  {
    label: 'Photography',
    siteType: 'blog',
    targetAudience: 'Professional photographers and visual artists',
    description:
      'A dark, editorial photography blog for professional photographers. Large hero images, minimal text, focus on visual storytelling with a grid-based portfolio layout.',
  },
  {
    label: 'Boutique Store',
    siteType: 'store',
    targetAudience: 'Fashion-conscious shoppers seeking luxury and exclusivity',
    description:
      'A clean, minimal e-commerce theme for a luxury fashion boutique. Elegant serif typography, generous whitespace, full-width product imagery, and a sophisticated neutral palette with gold accents.',
  },
  {
    label: 'Writer',
    siteType: 'blog',
    targetAudience: 'Readers who enjoy long-form essays, journalism, and literary non-fiction',
    description:
      'A warm, literary blog theme for long-form writers and essayists. Classic serif body text, comfortable reading width, drop caps on posts, subtle paper-like texture, and a muted earthy color palette.',
  },
  {
    label: 'Agency',
    siteType: 'business',
    targetAudience: 'Businesses and startups looking for a creative digital partner',
    description:
      'A bold, modern agency website with a dark hero section, animated section transitions, case study grid layout, team section, and a high-contrast color scheme with a single vibrant accent color.',
  },
  {
    label: 'Music',
    siteType: 'portfolio',
    targetAudience: 'Music fans, concert-goers, and industry professionals',
    description:
      'A moody, atmospheric theme for an independent musician or band. Dark background with vibrant accent colors, large album artwork, tour dates section, embedded audio player area, and editorial typography.',
  },
  {
    label: 'Documentation',
    siteType: 'docs',
    targetAudience: 'Developers and technical users seeking clear, structured reference material',
    description:
      'A clean, highly readable documentation theme with a fixed sidebar navigation, breadcrumb trail, code block styling, search bar, light and dark mode support, and a professional sans-serif type system.',
  },
  {
    label: 'Recipe Blog',
    siteType: 'blog',
    targetAudience: 'Home cooks, food enthusiasts, and anyone looking for meal inspiration',
    description:
      'A warm, inviting recipe blog with a cozy aesthetic. Full-width food photography, ingredient lists styled as cards, step-by-step cooking instructions, category filtering by meal type, and a color palette inspired by natural ingredients — terracotta, cream, sage green, and warm browns.',
  },
]

interface Props {
  form: FormState
  update: (partial: Partial<FormState>) => void
}

export default function StepDescription({ form, update }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function applySuggestion(suggestion: (typeof PROMPT_SUGGESTIONS)[number]) {
    update({ description: suggestion.description, siteType: suggestion.siteType, targetAudience: suggestion.targetAudience })
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="description"
          className="block text-text1 text-sm font-medium mb-2"
        >
          Describe your ideal theme
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="description"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="A modern photography portfolio with a dark aesthetic, large hero images, and a minimal navigation..."
            rows={5}
            maxLength={1000}
            className="w-full bg-bg3 border border-border rounded-lg px-4 py-3 pb-12 text-text1 placeholder-text3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
          />
          <div
            className="absolute bottom-2.5 left-2.5 right-2.5 flex gap-1.5 overflow-x-auto"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => applySuggestion(s)}
                className="shrink-0 px-2.5 py-1 text-[11px] text-text2 rounded-full border border-white/[0.09] cursor-pointer transition-colors duration-100 hover:border-accent hover:text-text1 active:bg-accent active:text-white focus:outline-none"
                style={{ backgroundColor: '#12121c' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text3">Min 20 characters</span>
          <span
            className={`text-xs ${
              form.description.length > 950
                ? 'text-accent2'
                : 'text-text3'
            }`}
          >
            {form.description.length}/1000
          </span>
        </div>
      </div>

      <div>
        <label className="block text-text1 text-sm font-medium mb-2">
          Site type
        </label>
        <div className="flex flex-wrap gap-2">
          {SITE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => update({ siteType: type })}
              className={`px-4 py-2 text-sm rounded-lg capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                form.siteType === type
                  ? 'bg-accent text-white'
                  : 'bg-bg3 text-text2 hover:text-text1 border border-border hover:border-border2'
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
          className="block text-text1 text-sm font-medium mb-2"
        >
          Target audience{' '}
          <span className="text-text3 font-normal">(optional)</span>
        </label>
        <input
          id="targetAudience"
          type="text"
          value={form.targetAudience}
          onChange={(e) => update({ targetAudience: e.target.value })}
          placeholder="e.g. Creative professionals, tech startups"
          className="w-full bg-bg3 border border-border rounded-lg px-4 py-3 text-text1 placeholder-text3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/30 transition-colors"
        />
      </div>
    </div>
  )
}
