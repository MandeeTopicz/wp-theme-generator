import { Router, type Router as RouterType } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { z } from 'zod'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import { validateThemeSlug, validateTheme, TEMPLATE_CATALOG } from '@wp-theme-gen/shared'
import { createAIProvider } from '../ai/provider'
import { assembleTheme, createZip } from '../theme/packager'
import { getTemplateSkeleton, resolveColorSlugs, interpolateCopy } from '../templates'

const validTemplateIds = TEMPLATE_CATALOG.map((t) => t.id)

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
  templateId: z.string().min(1).default('starter'),
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

    const { description, siteType, targetAudience, colorMode, accentColor, themeName, themeSlug, templateId } = parsed.data

    if (!validTemplateIds.includes(templateId)) {
      res.status(400).json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: `Invalid templateId "${templateId}". Available: ${validTemplateIds.join(', ')}`,
      })
      return
    }

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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    // Step 1: AI generates design spec + copy strings (single call)
    const provider = createAIProvider()
    const { colorPalette } = parsed.data
    const request = { prompt: description, description, siteType, targetAudience, colorMode, accentColor, colorPalette, templateId }

    send('progress', { step: 'design', message: 'Designing color system...' })
    console.log('[generate] Starting design spec generation...')
    const designSpec = await provider.generateDesignSpec(request)
    console.log('[generate] Design spec complete: %s (%d colors)', designSpec.name, designSpec.colors.length)

    // Step 2: Deterministic template assembly (no AI)
    send('progress', { step: 'building', message: 'Building templates...' })
    console.log('[generate] Building templates from skeleton: %s', templateId)

    const colorSlots = resolveColorSlugs(designSpec.colors, colorMode)
    const skeleton = getTemplateSkeleton(templateId, colorSlots)
    const filled = interpolateCopy(skeleton, designSpec.copyStrings)

    const manifest: ThemeManifest = {
      name: themeName,
      slug: themeSlug,
      themeJson: { version: 3 },
      templates: filled.templates,
      templateParts: filled.templateParts,
      patterns: filled.patterns,
      files: [],
      colors: designSpec.colors,
      typography: designSpec.typography,
      layout: designSpec.layout,
    }

    console.log('[generate] Template assembly complete: %d templates, %d parts, %d patterns',
      manifest.templates.length, manifest.templateParts.length, manifest.patterns.length)

    // Step 3: Validate
    send('progress', { step: 'validating', message: 'Validating theme...' })

    manifest.files = [
      'style.css',
      'theme.json',
      ...manifest.templates.map((t) => `templates/${t.name}`),
      ...manifest.templateParts.map((p) => `parts/${p.name}`),
      ...manifest.patterns.map((p) => `patterns/${p.name}`),
    ]

    const validationResult = validateTheme(manifest)
    console.log('[generate] Validation: %s (%d errors, %d warnings)', validationResult.isValid ? 'PASS' : 'FAIL', validationResult.errors.length, validationResult.warnings.length)

    // Step 4: Package
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
    if (res.headersSent) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      res.write(`event: error\ndata: ${JSON.stringify({ error: true, code: 'GENERATION_ERROR', message })}\n\n`)
      res.end()
    } else {
      next(err)
    }
  }
})
