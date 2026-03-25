export interface ColorSlotMap {
  bg: string
  text: string
  surface: string
  accent: string
  muted: string
  third: string
}

export interface TemplateSkeleton {
  templates: { name: string; content: string }[]
  templateParts: { name: string; content: string }[]
  patterns: { name: string; content: string }[]
}
