import { notification as antdNotification } from 'antd'
import type { ArgsProps } from 'antd/es/notification'

/** 通知提示配置 */
export interface NotificationOptions {
  /** 描述 */
  description: string
  /** 持续时间（秒），0 表示不自动关闭 */
  duration?: number
  /** 标题 */
  title: string
}

/** 统一的通知提示工具 */
export const notification = {
  /** 关闭通知 */
  destroy: (key?: string) => {
    if (key) {
      antdNotification.destroy(key)
    } else {
      antdNotification.destroy()
    }
  },

  /** 错误通知 */
  error: (options: NotificationOptions) => {
    return antdNotification.error({
      description: options.description,
      duration: options.duration ?? 4.5,
      message: options.title,
      placement: 'topRight'
    })
  },

  /** 信息通知 */
  info: (options: NotificationOptions) => {
    return antdNotification.info({
      description: options.description,
      duration: options.duration ?? 4.5,
      message: options.title,
      placement: 'topRight'
    })
  },

  /** 打开自定义配置通知 */
  open: (config: ArgsProps) => {
    return antdNotification.open(config)
  },

  /** 成功通知 */
  success: (options: NotificationOptions) => {
    return antdNotification.success({
      description: options.description,
      duration: options.duration ?? 4.5,
      message: options.title,
      placement: 'topRight'
    })
  },

  /** 警告通知 */
  warning: (options: NotificationOptions) => {
    return antdNotification.warning({
      description: options.description,
      duration: options.duration ?? 4.5,
      message: options.title,
      placement: 'topRight'
    })
  }
}
