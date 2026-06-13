import { message as antdMessage } from 'antd'
import type { ArgsProps } from 'antd/es/message'

/** 消息提示配置 */
export interface MessageOptions {
  /** 内容 */
  content: string
  /** 持续时间（秒），0 表示不自动关闭 */
  duration?: number
  /** 加载中文本 */
  key?: string
}

/** 统一的消息提示工具 */
export const message = {
  /** 销毁所有消息 */
  destroy: () => antdMessage.destroy(),

  /** 错误消息 */
  error: (content: string, duration?: number) => {
    return antdMessage.error({ content, duration: duration ?? 3 })
  },

  /** 信息消息 */
  info: (content: string, duration?: number) => {
    return antdMessage.info({ content, duration: duration ?? 3 })
  },

  /** 加载中消息 */
  loading: (content: string, duration?: number) => {
    return antdMessage.loading({ content, duration: duration ?? 0 })
  },

  /** 打开自定义配置消息 */
  open: (config: ArgsProps) => {
    return antdMessage.open(config)
  },

  /** 成功消息 */
  success: (content: string, duration?: number) => {
    return antdMessage.success({ content, duration: duration ?? 3 })
  },

  /** 警告消息 */
  warning: (content: string, duration?: number) => {
    return antdMessage.warning({ content, duration: duration ?? 3 })
  }
}

/** 异步操作消息提示包装 */
export async function withMessage<T>(
  promise: Promise<T>,
  options: {
    error?: string
    loading?: string
    success?: string
  }
): Promise<T> {
  const { loading: loadingText = '处理中...', success: successText, error: errorText } = options

  const hide = message.loading(loadingText)

  try {
    const result = await promise
    hide()
    if (successText) {
      message.success(successText)
    }
    return result
  } catch (error) {
    hide()
    if (errorText) {
      message.error(errorText)
    }
    throw error
  }
}
