/**
 * 会话图片数据层。
 *
 * 数据来源（M1 只开第 ① 条，最稳、零猜测）：
 *   ① 会话事件窗口里的图片附件 —— user/message 与 tool/result 的 content 块
 *   ② 工具参数里出现的图片路径（M2）
 *   ③ 工作区目录扫描（M3，需要宿主侧 mtime）
 *
 * 事件形状实测（DSH 0.2.1-rc.3）：
 *   user/message   → data.content[i].attachment
 *   tool/result    → data.message.content[i].attachment
 *   tool/ptc-dispatch → data.content[i].attachment
 * 附件对象不含路径或 URL，显示必须走 uiConversation.imageUrl。
 */
import type { ImageAttachmentRef, SessionEventEntry } from '../contract'

/** 列表里的一张图。 */
export interface SessionImage {
  /** 去重身份：attachmentId。 */
  id: string
  attachment: ImageAttachmentRef
  /** 事件时间戳（ms），用于倒序。 */
  time: number
  /** 来源：用户消息 / 工具结果。 */
  origin: 'user' | 'tool'
  /** 用于详情展示的少量上下文（不含用户正文）。 */
  mediaType: string
}

/**
 * 后台看图工具：结果只交给模型看，界面上不出图，**用户看不到**。
 * 这类图不进「未归档」（2026-10-31 用户明确：我在会话里没看到的，就不该出现在插件里）。
 */
const INTERNAL_IMAGE_TOOLS = new Set(['read_image', 'view_image', 'read'])

/**
 * 出图脚本的产物目录。AI 读**这里的**图，是在"把刚出的图给你看"，不能算后台读图。
 * 判断依据是读取路径，不是工具名 —— 同一个 `read_image`，读网页截图和读刚出的图，意图不同。
 */
const GEN_OUTPUT_RE = /session-gallery[\\/]gen[\\/]/i

/** 从工具参数里取读取路径（`read_image` 的参数是 `{"file_path":"..."}`）。 */
function pathOfArguments(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return ''
  try {
    const parsed = JSON.parse(raw) as { file_path?: unknown, path?: unknown }
    if (typeof parsed.file_path === 'string') return parsed.file_path
    if (typeof parsed.path === 'string') return parsed.path
  } catch {
    // 参数不是 JSON 就当作没有路径
  }
  return ''
}

/** 递归提取图片附件：`tool-result` 会把 image 嵌在自己的 `content` 里。 */
function pushImages(blocks: unknown, out: ImageAttachmentRef[]): void {
  if (!Array.isArray(blocks)) return
  for (const block of blocks) {
    if (block === null || typeof block !== 'object') continue
    const b = block as { type?: unknown, attachment?: unknown, content?: unknown }
    if (b.type === 'image') {
      const a = b.attachment as ImageAttachmentRef | undefined
      if (a !== undefined && typeof a.attachmentId === 'string') out.push(a)
      continue
    }
    if (b.type === 'tool-result') pushImages(b.content, out)
  }
}

/**
 * 从事件窗口提取图片，按 attachmentId 去重，按时间倒序。
 *
 * 一条铁律（2026-10-31 用户明确）：**用户在会话里看不到的图，不进「未归档」**。
 * AI 用 `read_image` 之类工具在后台看图，结果只在模型侧可见 —— 这里直接跳过；
 * 而截图、出图这类「会出现在对话里给你看」的工具，照收。
 *
 * @param entries - `eventSource.getSnapshot().entries`
 */
export function collectSessionImages(entries: readonly SessionEventEntry[]): SessionImage[] {
  // 先建 callId → 工具名 / 读取路径，否则分不清"后台读图"和"读刚出的图给你看"
  const toolNames = new Map<string, string>()
  const toolPaths = new Map<string, string>()
  for (const entry of entries) {
    const event = entry?.event
    if (event?.type !== 'tool/call') continue
    const data = event.data as { callId?: unknown, name?: unknown, arguments?: unknown } | undefined
    if (typeof data?.callId !== 'string' || typeof data?.name !== 'string') continue
    toolNames.set(data.callId, data.name)
    const path = pathOfArguments(data.arguments)
    if (path !== '') toolPaths.set(data.callId, path)
  }

  /** 这条工具结果的图该不该收：后台读图不收，但出图脚本产物的例外。 */
  const shouldSkip = (callId: string): boolean => {
    if (!INTERNAL_IMAGE_TOOLS.has(toolNames.get(callId) ?? '')) return false
    return !GEN_OUTPUT_RE.test(toolPaths.get(callId) ?? '')
  }

  const map = new Map<string, SessionImage>()
  const add = (attachment: ImageAttachmentRef, origin: 'user' | 'tool', time: number): void => {
    const id = attachment.attachmentId
    const prev = map.get(id)
    if (prev === undefined || prev.time > time) {
      map.set(id, { id, attachment, time, origin, mediaType: attachment.mediaType })
    }
  }

  for (const entry of entries) {
    const event = entry?.event
    const data = event?.data as Record<string, unknown> | undefined
    if (event === undefined || data === undefined) continue
    const time = typeof event.time === 'number' ? event.time : 0

    if (event.type === 'user/message' || event.type === 'assistant/message') {
      const out: ImageAttachmentRef[] = []
      pushImages(data.content, out)
      for (const attachment of out) add(attachment, 'user', time)
      continue
    }

    if (event.type === 'tool/result') {
      const message = data.message as {
        content?: unknown
        toolCallId?: unknown
        source?: { callId?: unknown }
      } | undefined
      /**
       * 事件形状有两代，两种都要认，否则按工具名过滤会在某一代上失效：
       *   v4：`message.toolCallId` + `message.content` 里直接是 image 块
       *   v3：`message.content` 里是 tool-result 块，`toolCallId` 挂在该块上
       */
      const messageCallId = typeof message?.toolCallId === 'string'
        ? message.toolCallId
        : (typeof message?.source?.callId === 'string' ? message.source.callId : '')
      const results = Array.isArray(message?.content) ? message.content : []
      for (const raw of results) {
        if (raw === null || typeof raw !== 'object') continue
        const block = raw as { type?: unknown, toolCallId?: unknown, content?: unknown }
        const out: ImageAttachmentRef[] = []
        if (block.type === 'tool-result') {
          const callId = typeof block.toolCallId === 'string' ? block.toolCallId : messageCallId
          if (shouldSkip(callId)) continue
          pushImages(block.content, out)
        } else {
          if (shouldSkip(messageCallId)) continue
          pushImages([block], out)
        }
        for (const attachment of out) add(attachment, 'tool', time)
      }
      continue
    }

    if (event.type === 'tool/ptc-dispatch') {
      const out: ImageAttachmentRef[] = []
      pushImages(data.content, out)
      for (const attachment of out) add(attachment, 'tool', time)
    }
  }
  return [...map.values()].sort((a, b) => b.time - a.time)
}

/** 人工格式化字节数。 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 相对时间。 */
export function formatRelative(time: number): string {
  if (!Number.isFinite(time) || time <= 0) return ''
  const diff = Date.now() - time
  const min = Math.round(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.round(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.round(hour / 24)
  if (day < 30) return `${day} 天前`
  return new Date(time).toLocaleDateString('zh-CN')
}
