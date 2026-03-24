import { describe, it, expect } from 'vitest'
import { validateQueryLoop } from '../validation/blockMarkup'

describe('validateQueryLoop', () => {
  it('query block without wp:post-template returns warning', () => {
    const markup = `<!-- wp:query -->
<!-- wp:paragraph --><p>No template</p><!-- /wp:paragraph -->
<!-- /wp:query -->`
    const warnings = validateQueryLoop(markup, 'test.html')
    expect(warnings.some((w) => w.message.includes('wp:post-template'))).toBe(true)
  })

  it('query block with wp:post-template and wp:post-title returns no warning', () => {
    const markup = `<!-- wp:query -->
<!-- wp:post-template -->
<!-- wp:post-title /-->
<!-- /wp:post-template -->
<!-- /wp:query -->`
    const warnings = validateQueryLoop(markup, 'test.html')
    expect(warnings).toHaveLength(0)
  })
})
