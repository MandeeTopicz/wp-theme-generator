import type { CopyStrings } from '@wp-theme-gen/shared'
import type { TemplateSkeleton } from './types'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function interpolateCopy(
  skeleton: TemplateSkeleton,
  copy: CopyStrings,
): TemplateSkeleton {
  const heroSub = escapeHtml(copy.heroSubheading)
  const ctaBtn = escapeHtml(copy.ctaButtonText)
  const ctaDesc = escapeHtml(copy.ctaDescription)
  const sectionH = escapeHtml(copy.sectionHeading)

  const replacements: Record<string, string> = {
    // Hero
    '{{HERO_HEADING}}': escapeHtml(copy.heroHeading),
    '{{HERO_SUBHEADING}}': heroSub,
    '{{HERO_SUBTITLE}}': heroSub,
    // Hero buttons/CTA (some templates put a button in hero)
    '{{HERO_BUTTON}}': ctaBtn,
    '{{HERO_CTA}}': ctaBtn,
    // Hero image placeholders
    '{{HERO_IMAGE_ALT}}': 'Hero image',
    '{{HERO_IMAGE}}': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&amp;h=600&amp;fit=crop',
    // CTA section
    '{{CTA_HEADING}}': escapeHtml(copy.ctaHeading),
    '{{CTA_DESCRIPTION}}': ctaDesc,
    '{{CTA_SUBHEADING}}': ctaDesc,
    '{{CTA_SUBTITLE}}': ctaDesc,
    '{{CTA_BUTTON_TEXT}}': ctaBtn,
    '{{CTA_BUTTON}}': ctaBtn,
    // Section headings
    '{{SECTION_HEADING}}': sectionH,
    '{{POSTS_HEADING}}': sectionH,
    '{{FEATURES_HEADING}}': sectionH,
    // About
    '{{ABOUT_HEADING}}': escapeHtml(copy.aboutHeading),
    '{{ABOUT_DESCRIPTION}}': escapeHtml(copy.aboutDescription),
    // 404
    '{{404_MESSAGE}}': escapeHtml(copy.notFoundMessage),
    // Footer
    '{{COPYRIGHT}}': escapeHtml(copy.copyright),
  }

  for (let i = 0; i < (copy.featureItems?.length ?? 0); i++) {
    const item = copy.featureItems[i]!
    replacements[`{{FEATURE_${i + 1}_TITLE}}`] = escapeHtml(item.title)
    replacements[`{{FEATURE_${i + 1}_DESC}}`] = escapeHtml(item.description)
  }

  function replaceAll(content: string): string {
    let result = content
    for (const [key, value] of Object.entries(replacements)) {
      result = result.split(key).join(value)
    }
    return result
  }

  return {
    templates: skeleton.templates.map((t) => ({
      name: t.name,
      content: replaceAll(t.content),
    })),
    templateParts: skeleton.templateParts.map((t) => ({
      name: t.name,
      content: replaceAll(t.content),
    })),
    patterns: skeleton.patterns.map((p) => ({
      name: p.name,
      content: replaceAll(p.content),
    })),
  }
}
