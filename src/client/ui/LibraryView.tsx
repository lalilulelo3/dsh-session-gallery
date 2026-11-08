/**
 * 图片库视图（M3）：扫描「图片库根目录 + 旧图目录」，读 sidecar 元数据。
 *
 * 数据来自宿主侧 `/plugins/dsh-session-gallery/scan`（只读，不修改任何文件）。
 * 与「会话图片」的区别：这里的图是磁盘文件，有真实路径，所以「放入对话」零复制。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { InputActionsLike } from '../contract'
import { GalleryLightbox, originLabel, type ViewerItem } from './Lightbox'
import { CompareView } from './CompareView'
import { ConfirmDelete } from './ConfirmDelete'
import { ImageContextMenu } from './ImageContextMenu'
import { pickAndImport } from './import-images'
import { GenLogPanel } from './GenLogPanel'
import {
  favoriteKeyOf,
  loadFavorites,
  subscribeFavorites,
  toggleFavorite as toggleFavoriteKey,
} from '../data/favorites'

const SCAN_ROUTE = '/plugins/dsh-session-gallery/scan'
const IMAGE_ROUTE = '/plugins/dsh-session-gallery/image'
const DELETE_ROUTE = '/plugins/dsh-session-gallery/delete'
const REVEAL_ROUTE = '/plugins/dsh-session-gallery/reveal'

interface LibraryItem {
  path: string
  name: string
  dir: string
  rel: string
  root: string
  source: 'library' | 'legacy'
  mtime: number
  bytes: number
  /** 内容哈希前 12 位（宿主侧提供，用于跨路径去重）。 */
  hash?: string
  meta?: Record<string, unknown>
}

/**
 * 来源筛选档位（界面用）。
 *
 * `library`（素材库）= json 里的 `site`（站点上传）与 `folder`（文件夹直塞）两档合并。
 * 只在界面合并，**写入侧不要动**：站点靠 `origin` 的值决定发不发 `U-` 号。
 */
type OriginFilter = 'user' | 'tool' | 'script' | 'manual' | 'library' | 'unknown'

/** 来源筛选的档位与中文标签（顺序即界面顺序）。 */
const ORIGIN_OPTIONS: { value: OriginFilter, label: string }[] = [
  { value: 'user', label: '用户发的' },
  { value: 'tool', label: '工具产物' },
  { value: 'script', label: '脚本产物' },
  { value: 'manual', label: '手动导入' },
  { value: 'library', label: '素材库' },
  { value: 'unknown', label: '未知（旧图）' },
]

/** 取一条图的来源档（没有 sidecar 的是 unknown）。 */
function originOf(item: LibraryItem): OriginFilter {
  const origin = item.meta?.origin
  if (origin === 'site' || origin === 'folder') return 'library'
  if (origin === 'user' || origin === 'tool' || origin === 'script' || origin === 'manual') return origin
  return 'unknown'
}

/**
 * 日期筛选值。`all` / 相对档，或 `month:YYYY-MM` 指定某个月。
 * 加 `month:` 前缀是为了跟相对档区分（月份字符串里也带 `-`）。
 */
type DateFilter = 'all' | 'today' | '7d' | '30d' | `month:${string}`

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 一张图的时间：**优先 sidecar 的生成时间 `createdAt`，没有才退回文件修改时间**。
 * 跟宿主侧排序用的口径一致，否则筛出来的顺序和可见的日期会对不上。
 */
function timeOf(item: LibraryItem): number {
  const created = item.meta?.createdAt
  if (typeof created === 'string') {
    const parsed = Date.parse(created)
    if (!Number.isNaN(parsed)) return parsed
  }
  return item.mtime
}

/** 本地时区当天 0 点。 */
function startOfDay(time: number): number {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** `YYYY-MM`（本地时区）。 */
function monthOf(time: number): string {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** 日期筛选是否命中。 */
function matchesDate(item: LibraryItem, filter: DateFilter): boolean {
  if (filter === 'all') return true
  const time = timeOf(item)
  if (!Number.isFinite(time) || time <= 0) return false
  const today = startOfDay(Date.now())
  if (filter === 'today') return time >= today
  if (filter === '7d') return time >= today - 6 * DAY_MS
  if (filter === '30d') return time >= today - 29 * DAY_MS
  const wanted = filter.slice('month:'.length)
  return monthOf(time) === wanted
}

export interface LibraryViewProps {
  inputActions?: InputActionsLike
  onFlash(message: string): void
  onPutToWorkbench(paths: string[]): void
  /** 缩略图大小档位（1 最小 … 6 最大），与「会话图片」共用。 */
  sizeLevel: number
  onSizeLevelChange(level: number): void
  /** 当前会话 id（手动导入时写入 sidecar）。 */
  sessionId?: string
}

/** 一个库项的浏览 URL。 */
function imageUrlOf(item: LibraryItem): string {
  return `${IMAGE_ROUTE}?path=${encodeURIComponent(item.path)}`
}

/** 一级分组名（子目录）。 */
function groupOf(item: LibraryItem): string {
  const parts = item.rel.split(/[\\/]/)
  if (parts.length <= 1) return '（根目录）'
  return parts[0] ?? '（根目录）'
}

/** 从 sidecar 里取数字字段。 */
function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** 从 sidecar 里取字符串字段。 */
function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

export function LibraryView(props: LibraryViewProps): JSX.Element {
  const { inputActions, onFlash, onPutToWorkbench, sizeLevel, onSizeLevelChange, sessionId } = props
  const cols = 7 - sizeLevel
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [root, setRoot] = useState<string>('')
  const [truncated, setTruncated] = useState(false)
  const [group, setGroup] = useState<string>('全部')
  const [query, setQuery] = useState('')
  /** 来源筛选：可多选，空集合 = 全部。 */
  const [originFilter, setOriginFilter] = useState<Set<OriginFilter>>(() => new Set())
  /** 日期筛选：全部 / 今天 / 近 7 天 / 近 30 天 / 某个月。 */
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  /** 只看收藏。 */
  const [onlyFavorite, setOnlyFavorite] = useState(false)
  /** 收藏集合（与「会话图片」共用同一份）。 */
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites())
  useEffect(() => subscribeFavorites(() => setFavorites(loadFavorites())), [])

  /** 一张库图的收藏键：按内容 hash（换目录不丢；老图没有 hash 时不支持收藏）。 */
  const isFavoriteOf = useCallback((item: LibraryItem): boolean => {
    const key = favoriteKeyOf({ hash: typeof item.hash === 'string' ? item.hash : undefined })
    return key !== undefined && favorites.has(key)
  }, [favorites])

  const toggleFavoriteOf = useCallback((item: LibraryItem) => {
    const key = favoriteKeyOf({ hash: typeof item.hash === 'string' ? item.hash : undefined })
    if (key === undefined) {
      onFlash('这张图没有内容哈希，暂不支持收藏（旧图）')
      return
    }
    setFavorites(toggleFavoriteKey(favorites, key))
  }, [favorites, onFlash])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  /** 并排对比的一组图（null = 没打开）。 */
  const [compareItems, setCompareItems] = useState<ViewerItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  /** 删除确认层。 */
  const [deleteOpen, setDeleteOpen] = useState(false)
  /** 出图日志面板（替换图片库视图）。 */
  const [logsOpen, setLogsOpen] = useState(false)
  /** 缩略图右键菜单的目标（null = 不显示）。 */
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: LibraryItem } | null>(null)
  /** 侧边栏内嵌大图（鼠标中键开关）。 */
  const [paneIndex, setPaneIndex] = useState<number | null>(null)
  const [paneUrl, setPaneUrl] = useState<string | undefined>(undefined)
  /** 内嵌大图的缩放与拖动。 */
  const [paneZoom, setPaneZoom] = useState(1)
  const [paneOffset, setPaneOffset] = useState({ x: 0, y: 0 })
  const paneDragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [paneDragging, setPaneDragging] = useState(false)
  /** 给滚轮用：连续滚动时 state 闭包会滞后，读 ref 才准。 */
  const paneViewRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } })
  paneViewRef.current = { zoom: paneZoom, offset: paneOffset }

  /** 扫描图片库；`silent` 为真时不显示"正在扫描"（用于自动刷新）。 */
  const scan = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch(SCAN_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
      const payload = (await response.json()) as {
        items?: LibraryItem[]
        settings?: { root?: unknown }
        truncated?: unknown
        error?: unknown
      }
      if (!response.ok) {
        setError(String(payload.error ?? response.status))
        return
      }
      setItems(Array.isArray(payload.items) ? payload.items : [])
      setRoot(typeof payload.settings?.root === 'string' ? payload.settings.root : '')
      setTruncated(payload.truncated === true)
      setError(null)
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void scan()
  }, [scan])

  /** 自动刷新：视图可见时每 5 秒静默重扫（实现"图库跟着图片库变"）。 */
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return
      void scan(true)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [scan])

  /** 内容哈希去重：同一张图出现在多处（会话导入 / 生成图 / 归档目录）只显示一条，优先「会话导入」。 */
  const deduped = useMemo(() => {
    const byHash = new Map<string, LibraryItem>()
    const noHash: LibraryItem[] = []
    for (const item of items) {
      const hash = typeof item.hash === 'string' ? item.hash : ''
      if (hash === '') {
        noHash.push(item)
        continue
      }
      const prev = byHash.get(hash)
      if (prev === undefined) {
        byHash.set(hash, item)
        continue
      }
      const prevPreferred = prev.path.includes('会话导入')
      const nowPreferred = item.path.includes('会话导入')
      if (!prevPreferred && nowPreferred) byHash.set(hash, item)
    }
    return [...noHash, ...byHash.values()]
  }, [items])

  const groups = useMemo(() => {
    const set = new Set<string>()
    for (const item of deduped) set.add(groupOf(item))
    return ['全部', ...[...set].sort((a, b) => a.localeCompare(b, 'zh-CN'))]
  }, [deduped])

  /** 有图的月份（倒序），每项带张数 —— 只列真的存在数据的月份，不制造空档。 */
  const months = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of deduped) {
      const time = timeOf(item)
      if (!Number.isFinite(time) || time <= 0) continue
      const key = monthOf(time)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [deduped])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return deduped.filter((item) => {
      if (group !== '全部' && groupOf(item) !== group) return false
      if (originFilter.size > 0 && !originFilter.has(originOf(item))) return false
      if (!matchesDate(item, dateFilter)) return false
      if (onlyFavorite && !isFavoriteOf(item)) return false
      if (keyword === '') return true
      const prompt = stringOf(item.meta?.prompt) ?? ''
      const model = stringOf(item.meta?.model) ?? ''
      return (
        item.name.toLowerCase().includes(keyword) ||
        prompt.toLowerCase().includes(keyword) ||
        model.toLowerCase().includes(keyword)
      )
    })
  }, [deduped, group, originFilter, dateFilter, onlyFavorite, isFavoriteOf, query])

  /**
   * 图片库里**实际能被收藏匹配到**的张数，用于工具栏按钮的数字。
   *
   * 不能用 `favorites.size`：那份集合是两个视图共用的，还包含「会话图片」里
   * 收藏的未归档图（`att:` 键），图片库只认 `hash:` 键匹配不到它们 ——
   * 结果就是「按钮显示收藏 2，点开筛选却一张都没有」（2026-11-03 用户报的）。
   */
  const favoriteCount = useMemo(
    () => deduped.filter((item) => isFavoriteOf(item)).length,
    [deduped, isFavoriteOf],
  )

  const viewerItems: ViewerItem[] = useMemo(
    () => filtered.map((item) => ({
      id: item.path,
      path: item.path,
      name: item.name,
      width: numberOf(item.meta?.width),
      height: numberOf(item.meta?.height),
      bytes: item.bytes,
      time: item.mtime,
      prompt: stringOf(item.meta?.prompt),
      mediaType: stringOf(item.meta?.mediaType),
      meta: item.meta,
    })),
    [filtered],
  )

  const resolveViewerUrl = useCallback(
    (item: ViewerItem): Promise<string> => {
      const found = filtered.find((x) => x.path === item.id) ?? filtered[0]
      return Promise.resolve(found === undefined ? '' : imageUrlOf(found))
    },
    [filtered],
  )

  /** 内嵌大图取 URL：只在换图时重取（列表刷新不该让画面闪）。 */
  const viewerItemsRef = useRef(viewerItems)
  viewerItemsRef.current = viewerItems
  const resolveViewerRef = useRef(resolveViewerUrl)
  resolveViewerRef.current = resolveViewerUrl

  useEffect(() => {
    if (paneIndex === null) {
      setPaneUrl(undefined)
      return
    }
    const target = viewerItemsRef.current[paneIndex]
    if (target === undefined) {
      setPaneUrl(undefined)
      return
    }
    // 换图时复位缩放/位移
    setPaneZoom(1)
    setPaneOffset({ x: 0, y: 0 })
    let alive = true
    resolveViewerRef.current(target)
      .then((value) => { if (alive) setPaneUrl(value) })
      .catch(() => { if (alive) setPaneUrl(undefined) })
    return () => { alive = false }
  }, [paneIndex])

  const toggleSelect = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  /** 放入对话：库图已有磁盘路径，直接写路径（零复制）。 */
  const putIntoDialog = useCallback(() => {
    if (selected.size === 0 || busy) return
    const actions = inputActions
    if (actions === undefined) {
      onFlash('输入框不可用（没有 inputActions）')
      return
    }
    const paths = [...selected]
    const text = paths.join('\n')
    let wrote = false
    try {
      wrote = actions.insertText(text, actions.captureInsertion())
    } catch {
      wrote = false
    }
    if (!wrote) {
      try {
        actions.setDraft(text)
        wrote = true
      } catch {
        wrote = false
      }
    }
    onFlash(wrote ? `已把 ${paths.length} 条路径写入输入框` : '写入输入框失败')
    setSelected(new Set())
  }, [busy, inputActions, onFlash, selected])

  const selectedCount = selected.size
  const libraryItems = filtered.filter((item) => selected.has(item.path))

  /** 大图里的「放入对话」：把这一张的磁盘路径写进输入框。返回是否写入成功。 */
  const putPathToDialog = useCallback((item: ViewerItem): boolean => {
    const actions = inputActions
    if (actions === undefined) {
      onFlash('输入框不可用（没有 inputActions）')
      return false
    }
    const path = item.path
    if (path === undefined || path === '') {
      onFlash('这张图没有磁盘路径')
      return false
    }
    let wrote = false
    try {
      wrote = actions.insertText(path, actions.captureInsertion())
    } catch {
      wrote = false
    }
    if (!wrote) {
      try {
        actions.setDraft(path)
        wrote = true
      } catch {
        wrote = false
      }
    }
    onFlash(wrote ? '已把图片路径写入输入框' : '写入输入框失败')
    return wrote
  }, [inputActions, onFlash])

  /** 大图里的「打开文件夹」：让宿主在资源管理器里定位这张图。 */
  const revealItem = useCallback((item: ViewerItem) => {
    const path = item.path
    if (path === undefined || path === '') {
      onFlash('这张图没有磁盘路径')
      return
    }
    void (async () => {
      try {
        const response = await fetch(REVEAL_ROUTE, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path }),
        })
        if (!response.ok) {
          const text = await response.text().catch(() => '')
          let detail = ''
          try {
            detail = String((JSON.parse(text) as { error?: unknown }).error ?? '')
          } catch {
            detail = text.slice(0, 80)
          }
          onFlash(`打开文件夹失败：${detail || `HTTP ${response.status}`}`)
          return
        }
        const payload = (await response.json()) as { ok?: unknown, detail?: unknown }
        if (payload.ok === false) {
          onFlash(`打开文件夹失败：${String(payload.detail ?? '资源管理器没有启动')}`)
          return
        }
        onFlash(typeof payload.detail === 'string' && payload.detail !== ''
          ? `已请求资源管理器（${payload.detail}）`
          : '已在资源管理器中定位')
      } catch (cause) {
        onFlash(`打开文件夹失败：${cause instanceof Error ? cause.message : String(cause)}`)
      }
    })()
  }, [onFlash])

  /** 执行删除（默认进回收站，可勾选永久删除）。 */
  const runDelete = useCallback(async (permanent: boolean): Promise<void> => {
    if (selected.size === 0 || busy) return
    setBusy(true)
    try {
      const response = await fetch(DELETE_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paths: [...selected], permanent }),
      })
      // 响应可能为空（路由未注册/宿主异常），先取文本再尝试 JSON，避免只报"Unexpected end of JSON"
      const text = await response.text()
      let payload: {
        deleted?: unknown
        failed?: { path?: string, error?: string }[]
        mode?: unknown
        error?: unknown
      }
      try {
        payload = JSON.parse(text) as typeof payload
      } catch {
        onFlash(`删除失败：HTTP ${response.status}，响应为空（多半是宿主侧没有这条路由，请重启 DSH）`)
        return
      }
      if (!response.ok) {
        onFlash(`删除失败：${String(payload.error ?? response.status)}`)
        return
      }
      const ok = typeof payload.deleted === 'number' ? payload.deleted : 0
      const failed = payload.failed?.length ?? 0
      const suffix = failed > 0 ? `，${failed} 张失败` : ''
      onFlash(payload.mode === 'permanent'
        ? `已永久删除 ${ok} 张${suffix}`
        : payload.mode === 'recycle-bin'
          ? `已移入 Windows 回收站 ${ok} 张${suffix}`
          : `已移到插件回收站 ${ok} 张${suffix}`)
      setSelected(new Set())
      setDeleteOpen(false)
      void scan()
    } catch (cause) {
      onFlash(`删除失败：${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setBusy(false)
    }
  }, [busy, onFlash, scan, selected])

  /** 删除单张（查看器右浮条里的「删除」），默认进回收站，删完关掉查看器。 */
  const deleteOne = useCallback(async (path: string, permanent = false): Promise<void> => {
    try {
      const response = await fetch(DELETE_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paths: [path], permanent }),
      })
      const text = await response.text()
      let payload: { deleted?: unknown, mode?: unknown, error?: unknown } = {}
      try {
        payload = JSON.parse(text) as typeof payload
      } catch {
        onFlash(`删除失败：HTTP ${response.status}，响应为空`)
        return
      }
      if (!response.ok) {
        onFlash(`删除失败：${String(payload.error ?? response.status)}`)
        return
      }
      const ok = typeof payload.deleted === 'number' ? payload.deleted : 0
      if (ok > 0) {
        onFlash(payload.mode === 'recycle-bin' ? '已移入 Windows 回收站' : '已移到插件回收站')
        setViewerIndex(null)
        void scan()
      } else {
        onFlash('删除失败：文件不存在或不在图片库内')
      }
    } catch (cause) {
      onFlash(`删除失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }, [onFlash, scan])

  return (
    <div className="dshsg-lib">
      {logsOpen ? (
        <GenLogPanel onClose={() => setLogsOpen(false)} onFlash={onFlash} />
      ) : (
        <>
      <div className="dshsg-toolbar">
        <select
          className="dshsg-select"
          value={group}
          onChange={(e) => setGroup(e.currentTarget.value)}
        >
          {groups.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select
          className="dshsg-select"
          title="按时间筛选"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.currentTarget.value as DateFilter)}
        >
          <option value="all">全部时间</option>
          <option value="today">今天</option>
          <option value="7d">近 7 天</option>
          <option value="30d">近 30 天</option>
          {months.map(([key, count]) => (
            <option key={key} value={`month:${key}`}>
              {key.replace('-', ' 年 ')} 月（{count}）
            </option>
          ))}
        </select>
        <input
          className="dshsg-search"
          type="search"
          placeholder="搜索文件名 / Prompt / 模型"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <button className="dshsg-chip" onClick={() => { void scan() }} title="重新扫描">刷新</button>
        <button
          className="dshsg-chip"
          data-on={onlyFavorite ? 'true' : 'false'}
          title="只看收藏（♥）"
          onClick={() => setOnlyFavorite((value) => !value)}
        >♥ 收藏{favoriteCount > 0 ? ` ${favoriteCount}` : ''}</button>
        <button
          className="dshsg-chip"
          title="查看每次出图任务的完整日志（成功失败都记）"
          onClick={() => setLogsOpen(true)}
        >出图日志</button>
        <button
          className="dshsg-chip"
          title="导入本地图片到图片库（归到当前会话）"
          onClick={() => {
            void (async () => {
              try {
                const result = await pickAndImport(sessionId ?? '')
                if (result === null) return
                onFlash(result.message)
                if (result.saved > 0) void scan()
              } catch (cause) {
                onFlash(`导入失败：${cause instanceof Error ? cause.message : String(cause)}`)
              }
            })()
          }}
        >导入</button>
        <label className="dshsg-zoom" title="缩略图大小（向右拖 = 更大）">
          <span>小</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={sizeLevel}
            onChange={(e) => onSizeLevelChange(Number(e.currentTarget.value))}
          />
          <span>大</span>
        </label>
      </div>

      {/* 来源筛选：可多选；一个都不选 = 全部 */}
      <div className="dshsg-origin-bar">
        <span className="dshsg-origin-bar-label">来源</span>
        <button
          className="dshsg-chip"
          data-on={originFilter.size === 0 ? 'true' : 'false'}
          title="不按来源筛选"
          onClick={() => setOriginFilter(new Set())}
        >全部</button>
        {ORIGIN_OPTIONS.map((option) => (
          <button
            key={option.value}
            className="dshsg-chip"
            data-on={originFilter.has(option.value) ? 'true' : 'false'}
            title={`只看「${option.label}」，可与其它档一起选`}
            onClick={() => {
              setOriginFilter((prev) => {
                const next = new Set(prev)
                if (next.has(option.value)) next.delete(option.value)
                else next.add(option.value)
                return next
              })
            }}
          >{option.label}</button>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="dshsg-actionbar">
          <span className="dshsg-actionbar-count">已选 {selectedCount} 张</span>
          <button className="dshsg-action" disabled={busy} onClick={putIntoDialog}>放入对话</button>
          <button
            className="dshsg-action"
            onClick={() => {
              onPutToWorkbench(libraryItems.map((item) => item.path))
              setSelected(new Set())
            }}
          >放入工作台</button>
          <button
            className="dshsg-action"
            disabled={selectedCount < 2}
            title={selectedCount < 2
              ? '至少选 2 张才能对比'
              : (selectedCount > 4 ? '最多对比 4 张，会取前 4 张' : '把选中的图并排对比（能看参数对照）')}
            onClick={() => {
              // 按列表顺序取前 4 张：勾选顺序不保留，但列表顺序和你看到的一致
              const picked = viewerItems.filter((item) => selected.has(item.id)).slice(0, 4)
              if (picked.length < 2) {
                onFlash('至少选 2 张才能对比')
                return
              }
              if (selectedCount > 4) onFlash(`最多对比 4 张，已取前 ${picked.length} 张`)
              setCompareItems(picked)
            }}
          >并排对比</button>
          <button
            className="dshsg-action dshsg-action-danger"
            disabled={busy}
            onClick={() => setDeleteOpen(true)}
            title="删除选中的图片（默认移到回收站）"
          >删除</button>
          <button className="dshsg-action dshsg-action-ghost" onClick={() => setSelected(new Set())}>清空</button>
        </div>
      )}

      <div className="dshsg-scroll">
        {loading && <div className="dshsg-empty">正在扫描图片库…</div>}
        {!loading && error !== null && (
          <div className="dshsg-empty">
            <strong>扫描失败</strong>
            <span>{error}</span>
          </div>
        )}
        {!loading && error === null && (
          <>
            <div className="dshsg-lib-meta">
              <span>{root === '' ? '未配置图片库' : root}</span>
              <span>
                {filtered.length === items.length
                  ? `共 ${items.length} 张`
                  : `筛选后 ${filtered.length} / 共 ${items.length} 张`}
                {truncated ? '（已达上限）' : ''}
              </span>
            </div>
            {filtered.length === 0
              ? (
                <div className="dshsg-empty">
                  <strong>{items.length === 0 ? '图片库还是空的' : '没有匹配的图'}</strong>
                  <span>{items.length === 0
                    ? '在设置里指定图片库目录，或让出图脚本把图写到这里。'
                    : '换个分组或关键词试试。'}</span>
                </div>
              )
              : (
                <div
                  className="dshsg-grid"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {filtered.map((item, i) => (
                    <button
                      key={item.path}
                      className="dshsg-card"
                      data-selected={selected.has(item.path) ? 'true' : 'false'}
                      title={`${item.name}\n${item.path}\n右键更多操作；可直接拖进输入框`}
                      onClick={() => setViewerIndex(i)}
                      onMouseDown={(event) => {
                        if (event.button === 1) event.preventDefault()
                      }}
                      onAuxClick={(event) => {
                        if (event.button === 1) {
                          event.preventDefault()
                          setPaneIndex(i)
                        }
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        setCtxMenu({ x: event.clientX, y: event.clientY, item })
                      }}
                    >
                      <img
                        src={imageUrlOf(item)}
                        alt=""
                        loading="lazy"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', item.path)
                          event.dataTransfer.effectAllowed = 'copy'
                        }}
                      />
                      <span
                        className="dshsg-check"
                        data-checked={selected.has(item.path) ? 'true' : 'false'}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          toggleSelect(item.path)
                        }}
                      >{selected.has(item.path) ? '✓' : ''}</span>
                      {isFavoriteOf(item) && <span className="dshsg-fav-mark" title="已收藏">♥</span>}
                      <span className="dshsg-badge">
                        {originLabel(item.meta?.origin)} · {groupOf(item)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </>
        )}
      </div>

      {viewerIndex !== null && viewerIndex < viewerItems.length && (
        <GalleryLightbox
          items={viewerItems}
          index={viewerIndex}
          resolveUrl={resolveViewerUrl}
          favorites={favorites}
          favoriteOf={(viewerItem) => {
            const found = filtered.find((candidate) => candidate.path === viewerItem.id)
            return found === undefined ? false : isFavoriteOf(found)
          }}
          onToggleFavorite={(viewerItemId) => {
            const found = filtered.find((candidate) => candidate.path === viewerItemId)
            if (found !== undefined) toggleFavoriteOf(found)
          }}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
          onCopy={(url) => { void navigator.clipboard.writeText(url) }}
          onPutToDialog={(item) => { if (putPathToDialog(item)) setViewerIndex(null) }}
          onReveal={revealItem}
          onPutToWorkbench={(item) => {
            onPutToWorkbench([item.id])
            setViewerIndex(null)
          }}
          onDelete={(item, permanent) => { void deleteOne(item.path ?? item.id, permanent) }}
          onCompare={(picked) => {
            setViewerIndex(null)
            setCompareItems(picked)
          }}
        />
      )}

      {compareItems !== null && (
        <CompareView
          items={compareItems}
          resolveUrl={resolveViewerUrl}
          onClose={() => setCompareItems(null)}
        />
      )}

      {deleteOpen && (
        <ConfirmDelete
          names={libraryItems.map((item) => item.name)}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={(permanent) => { void runDelete(permanent) }}
        />
      )}

      {ctxMenu !== null && (
        <ImageContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            {
              label: '查看大图',
              onSelect: () => {
                const index = filtered.findIndex((entry) => entry.path === ctxMenu.item.path)
                if (index >= 0) setViewerIndex(index)
              },
            },
            {
              label: '放入对话',
              onSelect: () => {
                const asItem: ViewerItem = {
                  id: ctxMenu.item.path,
                  path: ctxMenu.item.path,
                  name: ctxMenu.item.name,
                }
                putPathToDialog(asItem)
              },
            },
            {
              label: '放入工作台',
              onSelect: () => { onPutToWorkbench([ctxMenu.item.path]) },
            },
            {
              label: isFavoriteOf(ctxMenu.item) ? '取消收藏' : '收藏',
              onSelect: () => { toggleFavoriteOf(ctxMenu.item) },
            },
            {
              label: '打开文件夹',
              onSelect: () => {
                revealItem({
                  id: ctxMenu.item.path,
                  path: ctxMenu.item.path,
                  name: ctxMenu.item.name,
                })
              },
            },
            {
              label: '删除',
              tone: 'danger',
              onSelect: () => {
                setSelected(new Set([ctxMenu.item.path]))
                setDeleteOpen(true)
              },
            },
          ]}
        />
      )}
      {paneIndex !== null && (
        <div
          className="dshsg-pane"
          onMouseDown={(event) => {
            if (event.button === 1) event.preventDefault()
          }}
          onAuxClick={(event) => {
            if (event.button === 1) {
              event.preventDefault()
              setPaneIndex(null)
            }
          }}
        >
          <div className="dshsg-pane-bar">
            <span className="dshsg-pane-name">{viewerItems[paneIndex]?.name ?? '图片'}</span>
            <button
              className="dshsg-chip"
              onClick={() => setPaneIndex(null)}
              title="退出大图（或再按一次鼠标中键）"
            >✕</button>
          </div>
          {paneUrl === undefined
            ? <div className="dshsg-empty">加载中…</div>
            : (
              <div
                className="dshsg-pane-stage"
                onWheel={(event) => {
                  event.preventDefault()
                  const rect = event.currentTarget.getBoundingClientRect()
                  const px = event.clientX - rect.left - rect.width / 2
                  const py = event.clientY - rect.top - rect.height / 2
                  const { zoom, offset } = paneViewRef.current
                  const next = Math.min(8, Math.max(0.3, zoom * Math.exp(-event.deltaY * 0.0015)))
                  const k = next / zoom
                  setPaneZoom(next)
                  setPaneOffset({
                    x: px - k * (px - offset.x),
                    y: py - k * (py - offset.y),
                  })
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0) return
                  event.currentTarget.setPointerCapture(event.pointerId)
                  paneDragRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                    ox: paneOffset.x,
                    oy: paneOffset.y,
                  }
                  setPaneDragging(true)
                }}
                onPointerMove={(event) => {
                  const drag = paneDragRef.current
                  if (drag === null) return
                  setPaneOffset({
                    x: drag.ox + (event.clientX - drag.x),
                    y: drag.oy + (event.clientY - drag.y),
                  })
                }}
                onPointerUp={(event) => {
                  paneDragRef.current = null
                  setPaneDragging(false)
                  try {
                    event.currentTarget.releasePointerCapture(event.pointerId)
                  } catch {
                    // 指针已释放时忽略
                  }
                }}
                onPointerCancel={() => {
                  paneDragRef.current = null
                  setPaneDragging(false)
                }}
              >
                <img
                  src={paneUrl}
                  alt=""
                  draggable={false}
                  data-dragging={paneDragging ? 'true' : 'false'}
                  style={{
                    transform: `translate(${paneOffset.x}px, ${paneOffset.y}px) scale(${paneZoom})`,
                    transition: paneDragging ? 'none' : 'transform .12s ease-out',
                  }}
                />
              </div>
              )}
          <div className="dshsg-pane-hint">
            {Math.round(paneZoom * 100)}% · 滚轮缩放 · 左键拖动 · 中键 / ✕ 退出
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
