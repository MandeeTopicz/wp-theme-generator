import { Router, type Router as RouterType } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export const downloadRouter: RouterType = Router()

downloadRouter.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const zipPath = path.join(os.tmpdir(), `${sessionId}.zip`)
  const manifestPath = path.join(os.tmpdir(), `${sessionId}.json`)

  if (!fs.existsSync(zipPath)) {
    res.status(404).json({
      error: true,
      code: 'NOT_FOUND',
      message: 'Theme not found or expired',
    })
    return
  }

  let slug = 'theme'
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { slug?: string }
    if (manifest.slug) slug = manifest.slug
  } catch {
    // use default slug
  }

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`)
  fs.createReadStream(zipPath).pipe(res)
})
