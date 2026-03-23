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

    const designSpec = await provider.generateDesignSpec(request)
    const manifest = await provider.generateThemeManifest(request, designSpec)

    manifest.name = themeName
    manifest.slug = themeSlug

    const validationResult = validateTheme(manifest)
    if (!validationResult.isValid) {
      res.status(422).json({
        error: true,
        code: 'VALIDATION_ERROR',
        errors: validationResult.errors,
        validationResult,
      })
      return
    }

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
