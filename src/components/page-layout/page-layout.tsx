import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { PageLayoutProps } from './types'

const COLLAPSE_TRANSITION_MS = 300
const MIN_WIDTH = 200
const MAX_WIDTH = 600

export function PageLayout({
  autoCollapse = false,
  bodyStyle,
  bordered = false,
  children,
  collapseBreakpoint = 850,
  collapsible = true,
  header,
  headerStyle,
  left,
  leftStyle,
  leftWidth = 270,
  resizable = true,
  toolbar,
  toolbarStyle
}: PageLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidth] = useState(leftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const hasLeft = !!left
  const hasHeader = !!header
  const hasToolbar = !!toolbar

  // 平滑折叠/展开
  const toggleCollapse = useCallback(() => {
    setIsTransitioning(true)
    setCollapsed(prev => !prev)
    setTimeout(() => {
      setIsTransitioning(false)
    }, COLLAPSE_TRANSITION_MS)
  }, [])

  // 拖动调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable) return
      e.preventDefault()
      setIsResizing(true)
    },
    [resizable]
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = Math.min(Math.max(e.clientX - rect.left, MIN_WIDTH), MAX_WIDTH)
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // 自动折叠（响应式）
  useEffect(() => {
    if (!autoCollapse || !collapsible || !hasLeft) return

    let wasBelowBreakpoint = window.innerWidth < collapseBreakpoint
    setCollapsed(wasBelowBreakpoint)

    const handleResize = () => {
      const belowBreakpoint = window.innerWidth < collapseBreakpoint
      if (belowBreakpoint !== wasBelowBreakpoint) {
        wasBelowBreakpoint = belowBreakpoint
        setCollapsed(belowBreakpoint)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [autoCollapse, collapsible, hasLeft, collapseBreakpoint])

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full w-full overflow-hidden bg-background',
        bordered && 'border',
        isTransitioning && 'transition-all duration-300',
        isResizing && 'select-none'
      )}
      data-slot="page-layout"
    >
      {/* 左侧面板 */}
      {hasLeft ? (
        <>
          <div
            className={cn(
              'relative h-full min-w-0 shrink-0 overflow-hidden',
              isTransitioning && 'transition-all duration-300'
            )}
            style={{
              ...leftStyle,
              width: collapsed ? 0 : `${width}px`,
              flexBasis: collapsed ? 0 : `${width}px`,
              maxWidth: collapsed ? 0 : `${width}px`
            }}
          >
            <div
              className="h-full w-full overflow-auto"
              style={{ minWidth: collapsed ? 0 : `${width}px` }}
            >
              {left}
            </div>
          </div>

          {/* 分割线（可拖动）*/}
          {resizable && !collapsed ? (
            <div
              ref={resizeRef}
              className={cn(
                'group relative w-1 cursor-col-resize bg-border hover:bg-primary/50',
                isResizing && 'bg-primary'
              )}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
          ) : null}

          {/* 折叠按钮 */}
          {collapsible ? (
            <div className="relative z-50 w-0 shrink-0">
              <button
                className={cn(
                  'absolute left-0 top-1/2 flex h-8 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center',
                  'rounded-md border bg-background shadow-md hover:bg-accent hover:shadow-lg',
                  'transition-all'
                )}
                onClick={toggleCollapse}
                type="button"
                aria-expanded={!collapsed}
                aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              >
                {collapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronLeft className="size-4" />
                )}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {/* 右侧内容区 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        {hasHeader ? (
          <div className="border-b bg-card px-4 py-3" style={headerStyle}>
            {header}
          </div>
        ) : null}

        {/* Toolbar */}
        {hasToolbar ? (
          <div
            className={cn(
              'flex items-center justify-end gap-2 bg-card px-4',
              hasHeader ? 'py-2' : 'py-3'
            )}
            style={toolbarStyle}
          >
            {toolbar}
          </div>
        ) : null}

        {/* Body */}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden p-4',
            hasToolbar && !hasHeader && 'pt-2'
          )}
          style={bodyStyle}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
