import { Router, type Router as RouterType } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { z } from 'zod'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import { validateTheme } from '@wp-theme-gen/shared'
import { createAIProvider, type AIProvider } from '../ai/provider'
import { assembleTheme, createZip } from '../theme/packager'

const iterateSchema = z.object({
  sessionId: z.string().min(1),
  instruction: z.string().min(1).max(1000),
})

export const iterateRouter: RouterType = Router()

iterateRouter.post('/', async (req, res, next) => {
  try {
    const parsed = iterateSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid request' })
      return
    }

    const { sessionId, instruction } = parsed.data
    const tmpDir = os.tmpdir()
    const manifestPath = path.join(tmpDir, `${sessionId}.json`)

    let manifestRaw: string
    try {
      manifestRaw = await fs.readFile(manifestPath, 'utf-8')
    } catch {
      res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Session not found' })
      return
    }

    const manifest: ThemeManifest = JSON.parse(manifestRaw)
    console.log('[iterate] Session %s, instruction: %s', sessionId, instruction.slice(0, 80))

    let provider: AIProvider
    try {
      provider = createAIProvider()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI provider not configured'
      res.status(503).json({ error: true, code: 'AI_UNAVAILABLE', message })
      return
    }

    // Call AI for iteration
    const result = await provider.iterateTheme(
      {
        templates: manifest.templates,
        templateParts: manifest.templateParts,
        patterns: manifest.patterns,
      },
      instruction,
    )

    console.log('[iterate] AI returned: %d templates, %d parts, %d patterns',
      result.templates?.length ?? 0,
      result.templateParts?.length ?? 0,
      result.patterns?.length ?? 0,
    )

    // Merge changes into manifest
    const changedFiles: string[] = []

    if (result.templates) {
      for (const updated of result.templates) {
        const name = updated.name.replace(/^templates\//, '')
        const idx = manifest.templates.findIndex((t) => t.name === name)
        if (idx >= 0) {
          manifest.templates[idx] = { name, content: updated.content }
        } else {
          manifest.templates.push({ name, content: updated.content })
        }
        changedFiles.push(`templates/${name}`)
      }
    }

    if (result.templateParts) {
      for (const updated of result.templateParts) {
        const name = updated.name.replace(/^parts\//, '')
        const idx = manifest.templateParts.findIndex((t) => t.name === name)
        if (idx >= 0) {
          manifest.templateParts[idx] = { name, content: updated.content }
        } else {
          manifest.templateParts.push({ name, content: updated.content })
        }
        changedFiles.push(`parts/${name}`)
      }
    }

    if (result.patterns) {
      for (const updated of result.patterns) {
        const name = updated.name.replace(/^patterns\//, '')
        const idx = manifest.patterns.findIndex((p) => p.name === name)
        if (idx >= 0) {
          manifest.patterns[idx] = { name, content: updated.content }
        } else {
          manifest.patterns.push({ name, content: updated.content })
        }
        changedFiles.push(`patterns/${name}`)
      }
    }

    // Update file list
    manifest.files = [
      'style.css',
      'theme.json',
      ...manifest.templates.map((t) => `templates/${t.name}`),
      ...manifest.templateParts.map((p) => `parts/${p.name}`),
      ...manifest.patterns.map((p) => `patterns/${p.name}`),
    ]

    // Validate
    const validationResult = validateTheme(manifest)

    // Re-package
    const fileSet = assembleTheme(manifest)
    const zipBuffer = await createZip(manifest, fileSet)

    // Save updated files
    await fs.writeFile(path.join(tmpDir, `${sessionId}.zip`), zipBuffer)
    await fs.writeFile(manifestPath, JSON.stringify(manifest))

    console.log('[iterate] Complete. %d files changed, ZIP=%d bytes', changedFiles.length, zipBuffer.length)

    res.json({
      updatedManifest: manifest,
      changedFiles,
      validationResult,
    })
  } catch (err) {
    console.error('[iterate] Error:', err instanceof Error ? err.message : err)
    next(err)
  }
})
