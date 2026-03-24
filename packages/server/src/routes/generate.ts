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
  description: z.string().min(1).max(1000),
  siteType: z.enum(['blog', 'portfolio', 'business', 'store', 'docs']),
  targetAudience: z.string().optional(),
  colorMode: z.enum(['light', 'dark', 'auto']).optional(),
  accentColor: z.string().optional(),
  themeName: z.string().min(1),
  themeSlug: z.string().min(1),
  colorPalette: z.object({
    name: z.string(),
    colors: z.array(z.string()),
  }).optional(),
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

    // Set up SSE headers to keep connection alive during long generation
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const provider = createAIProvider()
    const { colorPalette } = parsed.data
    const request = { prompt: description, description, siteType, targetAudience, colorMode, accentColor, colorPalette }

    send('progress', { step: 'design', message: 'Designing color system...' })
    console.log('[generate] Starting Pass 1: design spec...')
    const designSpec = await provider.generateDesignSpec(request)
    console.log('[generate] Pass 1 complete.')

    send('progress', { step: 'templates', message: 'Generating templates...' })
    console.log('[generate] Starting Pass 2: theme manifest...')
    const manifest = await provider.generateThemeManifest(request, designSpec)
    console.log('[generate] Pass 2 complete.')

    send('progress', { step: 'validating', message: 'Validating theme...' })

    // Patch manifest with user-supplied identity
    manifest.name = themeName
    manifest.slug = themeSlug

    if (!manifest.themeJson || typeof manifest.themeJson !== 'object') {
      manifest.themeJson = { version: 3 }
    } else if ((manifest.themeJson as Record<string, unknown>).version !== 3) {
      (manifest.themeJson as Record<string, unknown>).version = 3
    }

    const hasIndex = manifest.templates.some(
      (t) => t.name === 'index' || t.name === 'index.html',
    )
    if (!hasIndex) {
      manifest.templates.unshift({
        name: 'index.html',
        content: '<!-- wp:paragraph --><p>Welcome</p><!-- /wp:paragraph -->',
      })
    }

    manifest.files = [
      'style.css',
      'theme.json',
      ...manifest.templates.map((t) => `templates/${t.name}`),
      ...manifest.templateParts.map((p) => `parts/${p.name}`),
      ...manifest.patterns.map((p) => `patterns/${p.name}`),
    ]

    const validationResult = validateTheme(manifest)
    console.log('[generate] Validation: %s (%d errors, %d warnings)', validationResult.isValid ? 'PASS' : 'FAIL', validationResult.errors.length, validationResult.warnings.length)

    send('progress', { step: 'packaging', message: 'Packaging theme...' })
    console.log('[generate] Assembling and packaging...')

    const fileSet = assembleTheme(manifest)
    const zipBuffer = await createZip(manifest, fileSet)

    const sessionId = crypto.randomUUID()
    const tmpDir = os.tmpdir()
    await fs.writeFile(path.join(tmpDir, `${sessionId}.zip`), zipBuffer)
    await fs.writeFile(
      path.join(tmpDir, `${sessionId}.json`),
      JSON.stringify(manifest),
    )

    console.log('[generate] Complete. sessionId=%s, ZIP=%d bytes', sessionId, zipBuffer.length)
    send('complete', { sessionId, manifest, validationResult })
    res.end()
  } catch (err) {
    // If headers already sent (SSE mode), send error event then end
    if (res.headersSent) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      res.write(`event: error\ndata: ${JSON.stringify({ error: true, code: 'GENERATION_ERROR', message })}\n\n`)
      res.end()
    } else {
      next(err)
    }
  }
})
