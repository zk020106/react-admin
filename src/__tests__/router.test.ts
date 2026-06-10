import { describe, expect, it } from 'vitest'

import { resolveRouterBasepath } from '@/router'

describe('router basepath', () => {
  it('uses root for local builds', () => {
    expect(resolveRouterBasepath('/')).toBe('/')
  })

  it('normalizes GitHub Pages project paths', () => {
    expect(resolveRouterBasepath('/react-admin/')).toBe('/react-admin')
  })
})
