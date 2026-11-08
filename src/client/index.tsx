/**
 * 浏览器半侧入口：注册右栏 tab 类型与正文。
 *
 * 落座说明（DSH 0.2.x 右栏是两阶段注册）：
 *   1. 类型：`ctx.sidebarRightTabs.register({ id, kind, title, guide })`
 *      —— `title` 决定 tab chip 文字，`guide` 决定开始页有没有我这个入口。
 *   2. 正文：`ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id }, Component)`
 *      —— key 必须与类型的 id 逐字相同。
 *
 * 两步都放在 `ctx.inject([...])` 里惰性等待：服务没就绪时插件不失败，就绪后自动补齐。
 */
import type { ReactNode } from 'react'
import type { ClientContext } from './contract'
import { PANEL_CSS } from './ui/styles'
import { PanelErrorBoundary } from './ui/ErrorBoundary'
import { SessionGalleryPanel } from './ui/Panel'

/** 本实现的身份；同时是正文/标题插槽的 key。 */
const TAB_ID = 'dsh-session-gallery/gallery'
/** tab 类别。独立 kind，避免与已装的 dsh-image-gen 抢。 */
const TAB_KIND = 'dsh-session-gallery'

/**
 * 注册进插槽的组件：外面套一层错误边界。
 *
 * 没有这层的话，面板里任何一处渲染抛错都会把整棵组件树卸掉，
 * 用户看到的是右侧栏一片空白（连标签都没了），且没有任何线索。
 */
function GuardedPanel(props: Parameters<typeof SessionGalleryPanel>[0]): ReactNode {
  return (
    <PanelErrorBoundary>
      <SessionGalleryPanel {...props} />
    </PanelErrorBoundary>
  )
}

/** 静态依赖：插槽注册表。 */
export const inject = ['slots']

/** 注入一份样式（幂等；带 data-plugin-css 标记便于 HMR 按包回收）。 */
function injectStyle(tagId: string, css: string): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css="${tagId}"]`) !== null) return
  const el = document.createElement('style')
  el.setAttribute('data-plugin-css', tagId)
  el.textContent = css
  document.head.appendChild(el)
}

/**
 * 客户端插件体。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: ClientContext): void {
  injectStyle('dsh-session-gallery/panel.css', PANEL_CSS)

  const tabTitle = (): string => '会话图片'

  // 右栏 tab 系统、会话事件源、官方取图通道：三者都就绪后再注册
  ;(ctx as unknown as {
    inject(
      services: string[],
      callback: (owner: unknown) => void,
    ): void
  }).inject(['sidebarRightTabs', 'sessions', 'uiConversation'], (rawOwner) => {
    const owner = rawOwner as {
      get(name: string): unknown
      effect(fn: () => unknown, label?: string): void
      slots: ClientContext['slots']
    }

    const tabs = owner.get('sidebarRightTabs') as {
      register(definition: {
        id: string
        kind: string
        priority?: 'extension' | 'builtin' | 'fallback'
        title: string | (() => string)
        guide?: readonly { id?: string; order?: number; title: string | (() => string) }[]
        keepMounted?: boolean
      }): () => void
    }
    const sessions = owner.get('sessions')
    const uiConversation = owner.get('uiConversation')

    // 阶段一：类型 + 开始页入口
    owner.effect(() => tabs.register({
      id: TAB_ID,
      kind: TAB_KIND,
      priority: 'extension',
      keepMounted: true,
      title: tabTitle,
      guide: [{ id: 'open', order: 60, title: tabTitle }],
    }), 'session-gallery: sidebar tab type')

    // 阶段二：正文
    const register = owner.slots.register.bind(owner.slots)
    owner.slots.inject('sidebar.right.pane.tab', () => register({
      name: 'sidebar.right.pane.tab',
      key: TAB_ID,
      inject: () => ({ sessions, uiConversation }),
    }, GuardedPanel as never))
  })
}
