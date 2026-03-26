import { Router, type Router as RouterType } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { z } from 'zod'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import { validateThemeSlug, validateTheme } from '@wp-theme-gen/shared'
import { createAIProvider } from '../ai/provider'
import { assembleTheme, createZip } from '../theme/packager'
import { runGenerationPipeline, pipelineResultToManifestInput, ParseError } from '../theme/pipeline'

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

    const {
      description,
      siteType,
      targetAudience,
      colorMode,
      accentColor,
      themeName,
      themeSlug,
      colorPalette,
    } = parsed.data

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

    // SSE setup
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    const provider = createAIProvider()

    const request = {
      prompt: description,
      description,
      siteType,
      targetAudience,
      colorMode,
      accentColor,
      colorPalette,
    }

    // Run 4-step pipeline
    const pipelineResult = await runGenerationPipeline(
      request,
      provider,
      (progress) => send('progress', { step: progress.step, message: progress.message }),
    )

    // Assemble manifest
    send('progress', { step: 'assembling', message: 'Assembling theme files...' })

    const manifestInput = pipelineResultToManifestInput(pipelineResult, themeName, themeSlug)

    const manifest: ThemeManifest = {
      name: manifestInput.name,
      slug: manifestInput.slug,
      themeJson: { version: 3 },
      templates: manifestInput.templates,
      templateParts: manifestInput.templateParts,
      patterns: manifestInput.patterns,
      files: [],
      colors: manifestInput.colors,
      typography: manifestInput.typography,
      layout: manifestInput.layout,
    }

    // Validate
    send('progress', { step: 'validating', message: 'Validating theme...' })

    manifest.files = [
      'style.css',
      'theme.json',
      ...manifest.templates.map((t) => `templates/${t.name}`),
      ...manifest.templateParts.map((p) => `parts/${p.name}`),
      ...manifest.patterns.map((p) => `patterns/${p.name}`),
    ]

    const validationResult = validateTheme(manifest)
    console.log('[generate] Validation: %s (%d errors, %d warnings)',
      validationResult.isValid ? 'PASS' : 'FAIL',
      validationResult.errors.length,
      validationResult.warnings.length,
    )

    // Package
    send('progress', { step: 'packaging', message: 'Packaging theme zip...' })

    const fileSet = assembleTheme(manifest)
    const zipBuffer = await createZip(manifest, fileSet)

    const sessionId = crypto.randomUUID()
    const tmpDir = os.tmpdir()
    await fs.writeFile(path.join(tmpDir, `${sessionId}.zip`), zipBuffer)
    await fs.writeFile(path.join(tmpDir, `${sessionId}.json`), JSON.stringify(manifest))

    console.log('[generate] Complete. sessionId=%s, ZIP=%d bytes', sessionId, zipBuffer.length)
    send('complete', { sessionId, manifest, validationResult })
    res.end()

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const code = err instanceof ParseError ? 'PARSE_ERROR' : 'GENERATION_ERROR'

    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: true, code, message })}\n\n`)
      res.end()
    } else {
      next(err)
    }
  }
})