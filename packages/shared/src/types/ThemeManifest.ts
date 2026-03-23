export interface ThemeFile {
  name: string
  content: string
}

export interface ColorPaletteEntry {
  name: string
  slug: string
  color: string
}

export interface FontFamilyEntry {
  name: string
  slug: string
  fontFamily: string
}

export interface ThemeTypography {
  fontFamilies: FontFamilyEntry[]
}

export interface ThemeLayout {
  contentSize: string
  wideSize: string
}

export interface ThemeManifest {
  name: string
  slug: string
  themeJson: unknown
  templates: ThemeFile[]
  templateParts: ThemeFile[]
  patterns: ThemeFile[]
  files: string[]
  colors?: ColorPaletteEntry[]
  typography?: ThemeTypography
  layout?: ThemeLayout
}
