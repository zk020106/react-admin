import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { PageLayout } from '@/components/page-layout'

function resizeViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width
  })
  window.dispatchEvent(new Event('resize'))
}

describe('PageLayout', () => {
  afterEach(() => {
    cleanup()
    resizeViewport(1024)
  })

  it('keeps manual collapse when autoCollapse is enabled on desktop', async () => {
    resizeViewport(1280)

    render(
      <PageLayout
        autoCollapse
        collapseBreakpoint={1024}
        left={<div>Left panel</div>}
        leftWidth={280}
      >
        <div>Main content</div>
      </PageLayout>
    )

    const collapseButton = screen.getByRole('button', { name: '收起侧边栏' })
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(collapseButton)

    const expandButton = screen.getByRole('button', { name: '展开侧边栏' })
    expect(expandButton).toHaveAttribute('aria-expanded', 'false')

    resizeViewport(1280)
    expect(screen.getByRole('button', { name: '展开侧边栏' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })
})
