import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { queryClient } from '@/lib/query-client'
import { createAppRouter, resolveRouterBasepath } from '@/router'
import { preferenceStore } from '@/store/preferences'
import { tabsStore } from '@/store/tabs'

function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )

  return router
}

describe('router basepath', () => {
  it('uses root for local builds', () => {
    expect(resolveRouterBasepath('/')).toBe('/')
  })

  it('normalizes GitHub Pages project paths', () => {
    expect(resolveRouterBasepath('/react-admin/')).toBe('/react-admin')
  })
})

describe('admin route tree', () => {
  afterEach(() => {
    cleanup()
    preferenceStore.getState().resetPreferences()
    tabsStore.setState({
      activeKey: '/overview',
      tabs: [
        { affix: true, icon: 'LayoutDashboard', key: '/overview', path: '/overview', title: '概览' }
      ]
    })
    tabsStore.getState().clearPersistedTabs()
    window.localStorage.clear()
  })

  it('redirects the index route to the default admin path', async () => {
    const router = renderAt('/')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/overview')
    })
  })

  it('renders the in-shell 404 page for unknown paths', async () => {
    renderAt('/definitely-missing')

    expect(await screen.findByText('404')).toBeInTheDocument()
    // 壳仍然可用：侧栏导航保持渲染。
    expect(await screen.findByRole('navigation', { name: '侧栏导航' })).toBeInTheDocument()
  })

  it('does not open a workspace tab for unknown paths', async () => {
    renderAt('/definitely-missing')

    await screen.findByText('404')

    expect(tabsStore.getState().tabs.some(tab => tab.path === '/definitely-missing')).toBe(false)
  })
})
