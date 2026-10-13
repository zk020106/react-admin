import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CDrawer, CModal } from '@/components/c-ui/popup'
import { DrawerApi, ModalApi } from '@/utils/popup-api'

describe('c modal', () => {
  afterEach(() => {
    cleanup()
  })

  it('opens with title and payload content', async () => {
    const api = new ModalApi({ title: '新增用户' })

    render(<CModal api={api}>表单内容</CModal>)
    act(() => {
      api.setData({ id: 'user-root' }).open()
    })

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('新增用户')).toBeInTheDocument()
    expect(screen.getByText('表单内容')).toBeInTheDocument()
    expect(api.getData<{ id: string }>().id).toBe('user-root')
  })

  it('renders content before opening when forceRender is set', () => {
    const api = new ModalApi({ title: '预渲染弹窗' })

    render(
      <CModal api={api} forceRender>
        预渲染内容
      </CModal>
    )

    expect(screen.getByText('预渲染内容')).toBeInTheDocument()
    expect(api.getState().isOpen).toBe(false)
  })

  it('blocks closing when onBeforeClose returns false', async () => {
    const api = new ModalApi({ onBeforeClose: () => false, title: '受守卫弹窗' })

    render(<CModal api={api} />)
    act(() => {
      api.open()
    })

    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: '取消' }))

    expect(api.getState().isOpen).toBe(true)
  })

  it('closes through the cancel button', async () => {
    const api = new ModalApi({ title: '可关闭弹窗' })

    render(<CModal api={api}>弹窗内容</CModal>)
    act(() => {
      api.open()
    })

    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: '取消' }))

    await waitFor(() => {
      expect(api.getState().isOpen).toBe(false)
    })
  })

  it('disables the confirm button while submitting', async () => {
    const api = new ModalApi({ title: '提交中弹窗' })

    render(<CModal api={api} />)
    act(() => {
      api.open()
      api.lock()
    })

    await screen.findByRole('dialog')

    const confirmButton = screen.getByRole('button', { name: '确认' })
    expect(confirmButton).toBeDisabled()
    // submitting 映射为确认按钮内的旋转图标。
    expect(confirmButton.querySelector('.animate-spin')).not.toBeNull()
  })

  it('invokes the custom confirm handler from the confirm button', async () => {
    const onConfirm = vi.fn()
    const api = new ModalApi({ title: '确认弹窗' })

    render(<CModal api={api} onConfirm={onConfirm} />)
    act(() => {
      api.open()
    })

    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: '确认' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

describe('c drawer', () => {
  afterEach(() => {
    cleanup()
  })

  it('opens with footer confirm and cancel actions', async () => {
    const onConfirm = vi.fn()
    const api = new DrawerApi({ title: '抽屉表单' })

    render(
      <CDrawer api={api} onConfirm={onConfirm}>
        抽屉内容
      </CDrawer>
    )
    act(() => {
      api.open()
    })

    expect(await screen.findByText('抽屉内容')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '确认' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: '取消' }))

    await waitFor(() => {
      expect(api.getState().isOpen).toBe(false)
    })
  })

  it('closes through the drawer api', async () => {
    const api = new DrawerApi({ title: '可关闭抽屉' })

    render(<CDrawer api={api}>抽屉内容</CDrawer>)
    act(() => {
      api.open()
    })

    await screen.findByRole('dialog')

    act(() => {
      void api.close()
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
