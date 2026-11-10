import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '@/utils/markdown'

describe('renderMarkdown', () => {
  it('escapes raw HTML instead of rendering it', () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">')

    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('adds safe rel and target to external links', () => {
    const html = renderMarkdown('[docs](https://example.com/docs)')

    expect(html).toContain('href="https://example.com/docs"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })

  it('highlights fenced code with a registered language', () => {
    const html = renderMarkdown('```ts\nconst answer = 42\n```')

    expect(html).toContain('class="hljs language-ts"')
    expect(html).toContain('code-block-head')
  })

  it('escapes code in unknown languages', () => {
    const html = renderMarkdown('```unknown\n<script>alert(1)</script>\n```')

    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
