export interface GenerateRequest {
  prompt: string
  description?: string
  siteType?: string
  targetAudience?: string
  colorMode?: 'light' | 'dark' | 'auto'
  accentColor?: string
  colorPalette?: { name: string; colors: string[] }
}
