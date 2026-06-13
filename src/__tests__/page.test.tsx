import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Page } from '@/components/page'
import { PageSurface } from '@/layouts/page-surface'

describe('Page', () => {
  afterEach(() => {
    cleanup()
  })

  it('lets chrome-less pages fill the available content height', () => {
    render(
      <Page>
        <div>content</div>
      </Page>
    )

    const pageContent = document.querySelector("[data-slot='page-content']")

    expect(pageContent).toHaveClass('flex-1')
    expect(pageContent).toHaveClass('min-h-0')
    expect(pageContent).toHaveClass('grid-rows-[minmax(0,1fr)]')
  })

  it('keeps regular titled pages content-sized', () => {
    render(
      <Page title="Dashboard">
        <div>content</div>
      </Page>
    )

    const pageContent = document.querySelector("[data-slot='page-content']")

    expect(pageContent).not.toHaveClass('flex-1')
  })

  it('lets the route surface receive flex height from the content area', () => {
    render(
      <main className="flex min-h-0 flex-1 flex-col" data-slot="admin-content">
        <PageSurface activePath="/system/users">
          <div>content</div>
        </PageSurface>
      </main>
    )

    const adminContent = document.querySelector("[data-slot='admin-content']")
    const pageSurface = document.querySelector("[data-slot='page-surface']")

    expect(adminContent).toHaveClass('flex')
    expect(adminContent).toHaveClass('flex-col')
    expect(pageSurface).toHaveClass('flex-1')
    expect(pageSurface).toHaveClass('min-h-0')
  })
})
