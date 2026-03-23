import { Router, type Router as RouterType } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { z } from 'zod'
import { validateThemeSlug, validateTheme } from '@wp-theme-gen/shared'
import { createAIProvider } from '../ai/provider'
import { assembleTheme, createZip } from '../theme/packager'

const generateSchema = z.object({
  description: z.string().min(1),
  siteType: z.enum(['blog', 'portfolio', 'business', 'store', 'docs']),
  targetAudience: z.string().optional(),
  colorMode: z.enum(['light', 'dark', 'auto']).optional(),
  accentColor: z.string().optional(),
  themeName: z.string().min(1),
  themeSlug: z.string().min(1),
})

export const generateRouter: RouterType = Router()

generateRouter.post('/', async (req, res, next) => {
  try {
    const parsed = generateSchema.safeParse(req.body)
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }))
      res.status(400).json({ error: true, code: 'VALIDATION_ERROR', errors: fields })
      return
    }

    const { description, siteType, targetAudience, colorMode, accentColor, themeName, themeSlug } = parsed.data

    const slugResult = validateThemeSlug(themeSlug)
    if (!slugResult.valid) {
      res.status(400).json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: `Invalid theme slug "${themeSlug}"`,
        suggestion: slugResult.suggestion,
      })
      return
    }

    const provider = createAIProvider()
    const request = { prompt: description, description, siteType, targetAudience, colorMode, accentColor }

    console.log('[generate] Starting Pass 1: design spec...')
    const designSpec = await provider.generateDesignSpec(request)
    console.log('[generate] Pass 1 complete. Starting Pass 2: theme manifest...')
    const manifest = await provider.generateThemeManifest(request, designSpec)
    console.log('[generate] Pass 2 complete. Assembling theme...')

    // Patch manifest with user-supplied identity
    manifest.name = themeName
    manifest.slug = themeSlug

    // Ensure themeJson is valid
    if (!manifest.themeJson || typeof manifest.themeJson !== 'object') {
      manifest.themeJson = { version: 3 }
    } else if ((manifest.themeJson as Record<string, unknown>).version !== 3) {
      (manifest.themeJson as Record<string, unknown>).version = 3
    }

    // Ensure templates array has at least index.html
    if (!manifest.templates.some((t) => t.name === 'index.html')) {
      manifest.templates.unshift({
        name: 'index.html',
        content: '<!-- wp:paragraph --><p>Welcome</p><!-- /wp:paragraph -->',
      })
    }

    // Build the files array from actual content
    manifest.files = [
      'style.css',
      'theme.json',
      ...manifest.templates.map((t) => `templates/${t.name}`),
      ...manifest.templateParts.map((p) => `parts/${p.name}`),
      ...manifest.patterns.map((p) => `patterns/${p.name}`),
    ]

    // Validate — return result but don't block on warnings-only failures
    const validationResult = validateTheme(manifest)

    const fileSet = assembleTheme(manifest)
    const zipBuffer = await createZip(manifest, fileSet)

    const sessionId = crypto.randomUUID()
    const tmpDir = os.tmpdir()
    await fs.writeFile(path.join(tmpDir, `${sessionId}.zip`), zipBuffer)
    await fs.writeFile(
      path.join(tmpDir, `${sessionId}.json`),
      JSON.stringify(manifest),
    )

    res.json({ sessionId, manifest, validationResult })
  } catch (err) {
    next(err)
  }
})
