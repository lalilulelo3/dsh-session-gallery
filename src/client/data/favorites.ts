/**
 * 收藏（两个视图共用）。
 *
 * 为什么单独抽出来：收藏最早只做在「会话图片」里，图片库拆出去后没接上，
 * 结果同一个 localStorage 键只有一处会用。现在统一成一份数据，两个视图都能读写。
 *
 * 记录方式（`dshsg:favorites:v2`，字符串数组）：
 *   - `hash:<内容哈希12位>`  —— 图片库的图（有 sidecar hash）。换目录/重命名都不丢
 *   - `att:<attachmentId>`   —— 还没归档的会话附件（没有 hash）
 *
 * 旧键 `dshsg:favorites:v1`（纯 attachmentId 数组）首次读取时自动迁移。
 */
const KEY = 'dshsg:favorites:v2'
const LEGACY_KEY = 'dshsg:favorites:v1'
const EVENT = 'dshsg:favorites-changed'

/** 一张图的收藏键优先级：hash 优先（更稳），否则用附件 id。 */
export function favoriteKeyOf(item: {
  hash?: string
  attachmentId?: string
}): string | undefined {
  if (typeof item.hash === 'string' && item.hash !== '') return `hash:${item.hash}`
  if (typeof item.attachmentId === 'string' && item.attachmentId !== '') return `att:${item.attachmentId}`
  return undefined
}

/** 读取收藏集合（含旧版迁移）。 */
export function loadFavorites(): Set<string> {
  const set = new Set<string>()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        for (const value of parsed) {
          if (typeof value === 'string') set.add(value)
        }
      }
      return set
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy !== null) {
      const parsed: unknown = JSON.parse(legacy)
      if (Array.isArray(parsed)) {
        for (const value of parsed) {
          if (typeof value === 'string' && value !== '') set.add(`att:${value}`)
        }
      }
      localStorage.setItem(KEY, JSON.stringify([...set]))
    }
  } catch {
    // 存储不可用时返回空集合
  }
  return set
}

/** 写入并广播变化（另一个视图据此刷新）。 */
export function saveFavorites(set: ReadonlySet<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {
    // 忽略
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch {
    // 忽略
  }
}

/** 切换一张图的收藏状态，返回新集合。 */
export function toggleFavorite(set: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  saveFavorites(next)
  return next
}

/** 订阅收藏变化（返回取消订阅函数）。 */
export function subscribeFavorites(handler: () => void): () => void {
  const listener = (): void => handler()
  window.addEventListener(EVENT, listener)
  // 其他窗口/标签页改动时 localStorage 会触发 storage 事件
  const storageListener = (event: StorageEvent): void => {
    if (event.key === KEY) handler()
  }
  window.addEventListener('storage', storageListener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', storageListener)
  }
}
