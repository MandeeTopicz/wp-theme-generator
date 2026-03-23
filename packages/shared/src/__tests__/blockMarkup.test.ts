import { describe, it, expect } from 'vitest'
import { validateBlockMarkup } from '../validation/blockMarkup'

describe('validateBlockMarkup', () => {
  it('returns empty array for clean valid markup', () => {
    const markup = `<!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph -->`
    expect(validateBlockMarkup(markup, 'test.html')).toEqual([])
  })

  it('returns fatal when wp:html is present', () => {
    const markup = '<!-- wp:html --><div>bad</div><!-- /wp:html -->'
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(errors.some((e) => e.severity === 'fatal' && e.block === 'wp:html'))
      .toBe(true)
  })

  it('reports correct line number for wp:html on line 3', () => {
    const markup = `<!-- wp:paragraph -->
<p>Hello</p>
<!-- wp:html --><div>bad</div><!-- /wp:html -->
<!-- /wp:paragraph -->`
    const errors = validateBlockMarkup(markup, 'test.html')
    const htmlError = errors.find((e) => e.block === 'wp:html')
    expect(htmlError?.line).toBe(3)
  })

  it('reports fatal for unclosed wp:group', () => {
    const markup = '<!-- wp:group -->\n<div>content</div>'
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(
      errors.some((e) => e.severity === 'fatal' && e.block === 'wp:group'),
    ).toBe(true)
  })

  it('returns no error for properly closed group', () => {
    const markup = `<!-- wp:group -->
<div>content</div>
<!-- /wp:group -->`
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(errors.filter((e) => e.severity === 'fatal')).toEqual([])
  })

  it('returns no error for self-closing image', () => {
    const markup = '<!-- wp:image /-->'
    expect(validateBlockMarkup(markup, 'test.html')).toEqual([])
  })

  it('reports fatal for mismatched close tag', () => {
    const markup = `<!-- wp:group -->
<div>content</div>
<!-- /wp:columns -->`
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(errors.some((e) => e.severity === 'fatal')).toBe(true)
  })

  it('returns warning for unknown block', () => {
    const markup = `<!-- wp:custom/thing -->
<div>custom</div>
<!-- /wp:custom/thing -->`
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(
      errors.some(
        (e) => e.severity === 'warning' && e.block === 'custom/thing',
      ),
    ).toBe(true)
  })

  it('returns no errors for all known core blocks', () => {
    const markup = `<!-- wp:paragraph -->
<p>text</p>
<!-- /wp:paragraph -->
<!-- wp:image /-->
<!-- wp:separator /-->`
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(errors).toEqual([])
  })

  it('returns multiple fatals for multiple wp:html instances', () => {
    const markup = `<!-- wp:html --><div>a</div><!-- /wp:html -->
<!-- wp:html --><div>b</div><!-- /wp:html -->`
    const errors = validateBlockMarkup(markup, 'test.html')
    const htmlFatals = errors.filter(
      (e) => e.severity === 'fatal' && e.block === 'wp:html',
    )
    expect(htmlFatals.length).toBe(2)
  })

  it('returns no errors for deeply nested valid markup', () => {
    const markup = `<!-- wp:group -->
<!-- wp:columns -->
<!-- wp:column -->
<!-- wp:paragraph -->
<p>deep</p>
<!-- /wp:paragraph -->
<!-- /wp:column -->
<!-- /wp:columns -->
<!-- /wp:group -->`
    expect(validateBlockMarkup(markup, 'test.html')).toEqual([])
  })

  it('still reports fatal for wp:html inside a group', () => {
    const markup = `<!-- wp:group -->
<!-- wp:html --><div>bad</div><!-- /wp:html -->
<!-- /wp:group -->`
    const errors = validateBlockMarkup(markup, 'test.html')
    expect(errors.some((e) => e.severity === 'fatal' && e.block === 'wp:html'))
      .toBe(true)
  })

  it('returns no errors for valid query loop pattern', () => {
    const markup = `<!-- wp:query -->
<!-- wp:post-template -->
<!-- wp:post-title /-->
<!-- wp:post-excerpt /-->
<!-- /wp:post-template -->
<!-- wp:query-pagination -->
<!-- wp:query-pagination-previous /-->
<!-- wp:query-pagination-numbers /-->
<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination -->
<!-- /wp:query -->`
    expect(validateBlockMarkup(markup, 'test.html')).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(validateBlockMarkup('', 'test.html')).toEqual([])
  })

  it('returns empty array for markup with only HTML comments', () => {
    const markup = '<!-- This is a comment -->\n<!-- Another comment -->'
    expect(validateBlockMarkup(markup, 'test.html')).toEqual([])
  })
})
