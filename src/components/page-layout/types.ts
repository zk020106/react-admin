import type { CSSProperties, ReactNode } from 'react'

export interface PageLayoutProps {
  /** 左侧面板内容 */
  left?: ReactNode
  /** 右侧头部内容 */
  header?: ReactNode
  /** 右侧工具栏内容 */
  toolbar?: ReactNode
  /** 主内容区 */
  children: ReactNode
  /** 左侧面板默认宽度 */
  leftWidth?: number
  /** 是否启用折叠功能 */
  collapsible?: boolean
  /** 是否启用自动折叠（响应式）*/
  autoCollapse?: boolean
  /** 自动折叠断点（px）*/
  collapseBreakpoint?: number
  /** 是否显示边框 */
  bordered?: boolean
  /** 左侧面板自定义样式 */
  leftStyle?: CSSProperties
  /** 头部自定义样式 */
  headerStyle?: CSSProperties
  /** 工具栏自定义样式 */
  toolbarStyle?: CSSProperties
  /** 主内容区自定义样式 */
  bodyStyle?: CSSProperties
  /** 是否启用拖动调整宽度 */
  resizable?: boolean
}
