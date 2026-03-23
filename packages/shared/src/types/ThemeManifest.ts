export interface ThemeFile {
  name: string
  content: string
}

export interface ThemeManifest {
  name: string
  slug: string
  themeJson: unknown
  templates: ThemeFile[]
  templateParts: ThemeFile[]
  patterns: ThemeFile[]
  files: string[]
}
