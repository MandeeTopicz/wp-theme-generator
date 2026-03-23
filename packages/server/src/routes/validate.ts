import { Router, type Router as RouterType } from 'express'
import { validateTheme } from '@wp-theme-gen/shared'
import type { ThemeManifest } from '@wp-theme-gen/shared'

export const validateRouter: RouterType = Router()

validateRouter.post('/', (req, res) => {
  const manifest = req.body as ThemeManifest
  const result = validateTheme(manifest)
  res.json(result)
})
