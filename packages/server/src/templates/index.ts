import type { TemplateSkeleton, ColorSlotMap } from './types'
import { buildSkeleton as buildStarter } from './starter'
import { buildSkeleton as buildEditorial } from './editorial'
import { buildSkeleton as buildPortfolio } from './portfolio'
import { buildSkeleton as buildBold } from './bold'
import { buildSkeleton as buildMinimal } from './minimal'
import { buildSkeleton as buildMagazine } from './magazine'
import { buildSkeleton as buildStarterPlus } from './starter-plus'
import { buildSkeleton as buildCreative } from './creative'

export type { TemplateSkeleton, ColorSlotMap }
export { resolveColorSlugs } from './resolveColors'
export { interpolateCopy } from './interpolate'

const SKELETON_BUILDERS: Record<string, (slots: ColorSlotMap) => TemplateSkeleton> = {
  'starter': buildStarter,
  'editorial': buildEditorial,
  'portfolio': buildPortfolio,
  'bold': buildBold,
  'minimal': buildMinimal,
  'magazine': buildMagazine,
  'starter-plus': buildStarterPlus,
  'creative': buildCreative,
}

export function getTemplateSkeleton(templateId: string, slots: ColorSlotMap): TemplateSkeleton {
  const builder = SKELETON_BUILDERS[templateId]
  if (!builder) {
    throw new Error(`Unknown template: "${templateId}". Available: ${Object.keys(SKELETON_BUILDERS).join(', ')}`)
  }
  return builder(slots)
}
