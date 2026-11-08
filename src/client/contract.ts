/**
 * 本插件用到的 DSH 客户端契约切片。
 *
 * 为什么不 import 官方类型：`@deepseek-ai/dsh-client-ui-slots`、
 * `@deepseek-ai/dsh-client-ui-sidebar-right` 等没有单独发到 npm，
 * 构建期拿不到 `.d.ts`。第三方客户端插件的通行做法是只声明自己用到的那一小块，
 * 形状对照运行宿主（0.2.1-rc.3）的产物实测。
 */
import type { Context } from '@deepseek-ai/cordis'

// ------------------------------------------------------------------ 会话事件

/** 一张图片附件在会话事件里的形状（实测：不透明 id + 媒体元数据，无路径或 URL）。 */
export interface ImageAttachmentRef {
  attachmentId: string
  mediaType: string
  width: number
  height: number
  bytes: number
  name?: string
}

/** 会话事件窗口里的一条条目。 */
export interface SessionEventEntry {
  type: 'event' | 'transient'
  event: {
    type: string
    seq: number
    time: number
    data?: unknown
  }
}

/** `binding.eventSource.getSnapshot()` 的返回。 */
export interface SessionEventSnapshot {
  entries: readonly SessionEventEntry[]
  hasMore: boolean
  revision: number
  change?: unknown
}

/** 一个 Session 的绑定（实测：`ctx.sessions.binding(sessionId)`）。 */
export interface SessionBinding {
  eventSource: {
    getSnapshot(): SessionEventSnapshot
    subscribe(listener: () => void): () => void
  }
  loadOlder?(): Promise<void> | void
}

/** 本插件用到的 `sessions` 服务面。 */
export interface SessionsFace {
  binding(sessionId: string): SessionBinding
}

/** 本插件用到的 `uiConversation` 服务面（官方取图通道）。 */
export interface UiConversationFace {
  /** 会话授权 + 按 Session 缓存，返回可直接放进 <img src> 的 URL。 */
  imageUrl(sessionId: string, attachment: ImageAttachmentRef): Promise<string>
  /** 同步命中缓存（未命中返回 undefined）。 */
  peekImageUrl?(sessionId: string, attachment: ImageAttachmentRef): string | undefined
}

// ------------------------------------------------------------------ 插槽

/** 本插件占用的插槽 key（运行期真值）。 */
export const SLOT = {
  paneTab: 'sidebar.right.pane.tab',
  paneTabTitle: 'sidebar.right.pane.tab.title',
} as const

export type SlotKey = (typeof SLOT)[keyof typeof SLOT]

/** 注册句柄：幂等 disposer。 */
export type Disposer = () => void

/** keyed 插槽（右栏 tab 正文/标题都按类型 id 派发）的注册选项。 */
export interface KeyedSlotRegisterOptions {
  name: SlotKey
  key: string
  /** 注入面：返回值会成为组件的 props。 */
  inject?: () => Record<string, unknown>
}

/** 本插件用到的 `ctx.slots` 面。 */
export interface SlotRegistryFace {
  inject(key: SlotKey, callback: () => Disposer | Iterable<Disposer>): Disposer
  register(options: KeyedSlotRegisterOptions, component: (props: never) => unknown): Disposer
}

// ------------------------------------------------------------------ 右栏 tab 类型

/** 开始页（引导页）里的一个入口框。 */
export interface SidebarRightGuideEntry {
  /** provider 内唯一；缺省时宿主自造（建议显式给）。 */
  id?: string
  order?: number
  title: string | (() => string)
  description?: string
}

/** `ctx.sidebarRightTabs.register(...)` 的入参。 */
export interface SidebarRightTabDefinition {
  /** 本实现的身份，全局唯一；同时是正文/标题插槽的 key。 */
  id: string
  /** tab 类别；一个 kind 最多一份 builtin + 一份 extension。 */
  kind: string
  priority?: 'extension' | 'builtin' | 'fallback'
  title: string | ((address?: unknown) => string)
  /** 开始页入口；不给的话开始页没有我这个入口。 */
  guide?: readonly SidebarRightGuideEntry[]
  /** 切 tab / 切会话 / 收起时保留正文。 */
  keepMounted?: boolean
}

/** `ctx.sidebarRightTabs` 服务面。 */
export interface SidebarRightTabsFace {
  register(definition: SidebarRightTabDefinition): Disposer
}

// ------------------------------------------------------------------ 组件 props

/** 右栏 tab 正文座位注入给组件的运行期信息。 */
export interface SidebarRightTabInfo {
  sidebar?: { expanded?: boolean; fullscreen?: boolean }
  panel?: { id?: string }
  tab?: {
    id: string
    visible?: boolean
    navigation?: { params?: unknown; revision?: number; address?: string }
    actions?: Record<string, unknown>
  }
}

/** 输入框公开动作（session 作用域标准 prop `inputActions`，实测含这些方法）。 */
export interface InputActionsLike {
  /** 捕获当前光标位置，供 insertText 做修订校验。 */
  captureInsertion(): unknown
  /** 在捕获的位置插入文本；返回是否成功。 */
  insertText(text: string, span: unknown): boolean
  /** 整段替换草稿。 */
  setDraft(text: string): void
  /** 提交当前草稿。 */
  submit(): void
}

/** 本插件正文组件收到的 props（session 作用域标准 props 的子集 + 注入面）。 */
export interface SessionGalleryProps {
  /** 当前会话 id（session 作用域标准 prop）。 */
  sessionId?: string
  /** 输入框动作（session 作用域标准 prop）。 */
  inputActions?: InputActionsLike
  /** 会话列表快照选择器（各作用域都提供的标准 prop），用于取会话 cwd。 */
  useSessions?: <T>(selector: (snapshot: unknown) => T) => T
  /** 右栏座位注入的 hook。 */
  useTabInfo?: () => SidebarRightTabInfo
  /** 本插件 inject face 注入的服务与回调。 */
  sessions?: SessionsFace
  uiConversation?: UiConversationFace
}

// ------------------------------------------------------------------ Cordis 扩展

declare module '@deepseek-ai/cordis' {
  interface Context {
    slots: SlotRegistryFace
    sessions?: SessionsFace
    uiConversation?: UiConversationFace
    sidebarRightTabs?: SidebarRightTabsFace
  }
}

/** 客户端插件半侧的 ctx。 */
export type ClientContext = Context
