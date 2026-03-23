import { Router, type Router as RouterType } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { validateTheme } from '@wp-theme-gen/shared'
import type { ThemeManifest } from '@wp-theme-gen/shared'
import { createAIProvider } from '../ai/provider'
import { assembleTheme, createZip } from '../theme/packager'

export const iterateRouter: RouterType = Router()

iterateRouter.post('/', async (req, res, next) => {
  try {
    const { sessionId, instruction } = req.body as {
      sessionId: string
      instruction: string
    }

    if (!sessionId || !instruction) {
      res.status(400).json({
        error: true,
        code: 'VALIDATION_ERROR',
        message: 'sessionId and instruction are required',
      })
      return
    }

    const tmpDir = os.tmpdir()
    const manifestPath = path.join(tmpDir, `${sessionId}.json`)

    let manifestData: string
    try {
      manifestData = await fs.readFile(manifestPath, 'utf-8')
    } catch {
      res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: 'Theme not found or expired',
      })
      return
    }

    const manifest = JSON.parse(manifestData) as ThemeManifest

    const provider = createAIProvider()
    const partial = await provider.iterateTheme(manifest, instruction)

    const changedFiles = Object.keys(partial)
    const updatedManifest = { ...manifest, ...partial } as ThemeManifest

    const validationResult = validateTheme(updatedManifest)
    const fileSet = assembleTheme(updatedManifest)
    const zipBuffer = await createZip(updatedManifest, fileSet)

    await fs.writeFile(path.join(tmpDir, `${sessionId}.zip`), zipBuffer)
    await fs.writeFile(manifestPath, JSON.stringify(updatedManifest))

    res.json({ sessionId, updatedManifest, changedFiles, validationResult })
  } catch (err) {
    next(err)
  }
})
