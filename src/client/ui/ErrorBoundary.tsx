/**
 * 面板级错误边界。
 *
 * 为什么必须有这个：React 渲染中任何一处抛错，如果没有 error boundary，
 * 整棵组件树会被卸载——用户看到的是右侧栏一片空白，连标签都没了，
 * 而且一个字线索都没有。2026-11-02 设置页那三处 `e.currentTarget`
 * 就是这么白屏的，因为没边界，错误只落在渲染进程控制台里，没人看得见。
 *
 * 这里兜住错误：把消息和组件栈画在面板上，同时 POST 给宿主写进
 * `~/.dsh/cache/session-gallery/boot-diag.log`，下次不装 DevTools 也能查。
 */
import { Component } from 'react'
import type { ReactNode } from 'react'

/** 客户端错误上报路由（宿主侧只写日志，不落业务数据）。 */
const CLIENT_LOG_ROUTE = '/plugins/dsh-session-gallery/client-log'

interface Props {
  children: ReactNode
}

interface State {
  message: string
  stack: string
}

/** 把任意抛出物压成可读字符串。 */
function describe(cause: unknown): { message: string, stack: string } {
  const err = cause as { message?: unknown, stack?: unknown } | null
  return {
    message: typeof err?.message === 'string' ? err.message : String(cause),
    stack: typeof err?.stack === 'string' ? err.stack : '',
  }
}

export class PanelErrorBoundary extends Component<Props, State> {
  override state: State = { message: '', stack: '' }

  static getDerivedStateFromError(cause: unknown): State {
    return describe(cause)
  }

  override componentDidCatch(cause: unknown, info: { componentStack?: string }): void {
    const { message, stack } = describe(cause)
    try {
      void fetch(CLIENT_LOG_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, stack, componentStack: info?.componentStack ?? '' }),
      }).catch(() => {
        // 上报失败就算了，别在错误边界里再抛错
      })
    } catch {
      // 同上
    }
  }

  override render(): ReactNode {
    if (this.state.message !== '') {
      const stackLines = this.state.stack.split('\n').slice(0, 10).join('\n')
      return (
        <div className="dshsg-crash">
          <div className="dshsg-crash-title">面板渲染出错</div>
          <div className="dshsg-crash-msg">{this.state.message}</div>
          {stackLines !== '' && <pre className="dshsg-crash-stack">{stackLines}</pre>}
          <div className="dshsg-crash-hint">
            这行信息也写进了 <code>~/.dsh/cache/session-gallery/boot-diag.log</code>。
            点「重试」可以重新挂载面板。
          </div>
          <button
            className="dshsg-chip"
            onClick={() => this.setState({ message: '', stack: '' })}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
