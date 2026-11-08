/**
 * 右栏主面板：两个子标签「图库 / 工作台」。
 *
 * 图库：
 *   - 读取当前会话事件里的图片附件 → 网格 → 点卡片开全屏浮窗（可缩放）
 *   - 勾选（1..N）→ 出现操作条：「放入对话」「放入工作台」
 * 工作台：
 *   - M2 暂为占位；M3 接入画布后，勾选的图会直接落到画布上
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collectSessionImages,
  formatRelative,
  type SessionImage,
} from '../data/session-images'
import type {
  ImageAttachmentRef,
  InputActionsLike,
  SessionGalleryProps,
} from '../contract'
import { GalleryLightbox, originLabel, type ViewerItem } from './Lightbox'
import { CompareView } from './CompareView'
import { ConfirmDelete } from './ConfirmDelete'
import { ImageContextMenu } from './ImageContextMenu'
import { Workbench, type WorkbenchItem } from './Workbench'
import { LibraryView } from './LibraryView'
import { SettingsPanel } from './SettingsPanel'
import { pickAndImport } from './import-images'
import {
  favoriteKeyOf,
  loadFavorites,
  subscribeFavorites,
  toggleFavorite as toggleFavoriteKey,
} from '../data/favorites'

/**
 * 从「存入图片库」后的文件路径里取内容哈希。
 *
 * 归档命名形如 `<时间>-<哈希12>.png`，出图直出是 `<哈希12>.png`，
 * 两种都靠这个正则认。收藏键要的是 hash，而归档接口只回路径。
 */
function hashOfArchivedPath(filePath: string): string | undefined {
  const base = filePath.split(/[\\/]/).pop() ?? ''
  const matched = /([0-9a-f]{12})\.(?:png|jpe?g|webp|gif)$/i.exec(base)
  return matched?.[1]
}

/** 宿主侧导出路由（把会话附件写成短名字文件并返回真实路径）。 */
const EXPORT_ROUTE = '/plugins/dsh-session-gallery/export'
/** 宿主侧清理路由（删除导出缓存）。 */
const CLEAR_ROUTE = '/plugins/dsh-session-gallery/clear-cache'
/** 扫描路由（取已归档到图片库的会话图）。 */
const SCAN_ROUTE = '/plugins/dsh-session-gallery/scan'
/** 图片库文件字节路由。 */
const IMAGE_ROUTE = '/plugins/dsh-session-gallery/image'
/** 删除路由（默认进回收站）。 */
const DELETE_ROUTE = '/plugins/dsh-session-gallery/delete'
/** 在资源管理器里定位图片的路由。 */
const REVEAL_ROUTE = '/plugins/dsh-session-gallery/reveal'

/** 图片库文件 URL。 */
function fileUrlOf(path: string): string {
  return `${IMAGE_ROUTE}?path=${encodeURIComponent(path)}`
}

/** 图片库扫描项（只取本插件用到的字段）。 */
interface SessionLibraryFile {
  path: string
  name: string
  mtime: number
  bytes: number
  /** 12 位内容指纹（宿主从文件名 / sidecar.hash 解析）。 */
  hash?: string
  meta?: Record<string, unknown>
}

/** 全库索引里的一条：按内容 hash 找得到磁盘文件。 */
interface LibraryFileByHash {
  path: string
  name: string
  mtime: number
  bytes: number
  hash: string
  meta?: Record<string, unknown>
}

/** 合并视图里的一项：已归档文件 或 未归档的会话附件。 */
interface MergedItem {
  id: string
  kind: 'file' | 'attachment'
  name: string
  time: number
  bytes: number
  path?: string
  attachment?: ImageAttachmentRef
  width?: number
  height?: number
  mediaType?: string
  prompt?: string
  /** sidecar 原始元数据（来源/模型/参数/时间）。 */
  meta?: Record<string, unknown>
}

/** 从 sidecar 里取数字。 */
function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** 从 sidecar 里取字符串。 */
function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** 会话级 URL 缓存：同一个 attachment 只解析一次。 */
const urlCache = new Map<string, Promise<string>>()

export function SessionGalleryPanel(props: SessionGalleryProps): JSX.Element {
  const { sessions, uiConversation, sessionId, inputActions } = props
  /** 一级标签：会话图片 / 工作台 / 图片库（不再有二级来源切换）。 */
  type PanelTab = 'session' | 'workbench' | 'library'
  const [tab, setTab] = useState<PanelTab>(() => {
    try {
      const raw = localStorage.getItem('dshsg:tab:v1')
      return raw === 'workbench' || raw === 'library' ? raw : 'session'
    } catch {
      return 'session'
    }
  })
  const switchTab = useCallback((next: PanelTab) => {
    setTab(next)
    try {
      localStorage.setItem('dshsg:tab:v1', next)
    } catch {
      // 忽略
    }
  }, [])
  /** 「放入工作台」的库图路径（M3 画布未接入，先暂存）。 */
  const [workbenchPaths, setWorkbenchPaths] = useState<string[]>([])
  const [images, setImages] = useState<SessionImage[]>([])
  const [onlyFavorite, setOnlyFavorite] = useState(false)
  /** 收藏集合（`hash:<12>` / `att:<attachmentId>`），与图片库视图共用同一份数据。 */
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites())
  // 另一个视图改了收藏时同步过来
  useEffect(() => subscribeFavorites(() => setFavorites(loadFavorites())), [])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  /**
   * 大图当前显示的图 **id**，不是索引。
   * 索引会随列表增删漂移（对话进行时上游不断插新图），表现为「大图自己跳到别的图上」。
   */
  const [viewerId, setViewerId] = useState<string | null>(null)
  /** 会话图片页批量删除的确认层要删的路径（null = 不显示）。 */
  const [bulkDelete, setBulkDelete] = useState<string[] | null>(null)
  /** 缩略图右键菜单：目标不同，菜单项也不同。 */
  const [ctxMenu, setCtxMenu] = useState<
    | { kind: 'file'; x: number; y: number; item: MergedItem }
    | { kind: 'pending'; x: number; y: number; item: SessionImage }
    | null
  >(null)
  /**
   * 侧边栏内嵌大图（鼠标中键开关）。
   * 与 Lightbox 的区别：它不弹全屏浮窗，只占满右侧栏内部，
   * 这样左边还能同时看对话/报告——用户 2026-11-01 提的需求。
   */
  const [paneItem, setPaneItem] = useState<{ item: ViewerItem; kind: 'file' | 'pending' } | null>(null)
  const [paneUrl, setPaneUrl] = useState<string | undefined>(undefined)
  /** 内嵌大图的缩放与拖动（滚轮缩放 / 左键拖动）。 */
  const [paneZoom, setPaneZoom] = useState(1)
  const [paneOffset, setPaneOffset] = useState({ x: 0, y: 0 })
  const paneDragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [paneDragging, setPaneDragging] = useState(false)
  /** 给滚轮用：event 里读到的一定要是最新值（连续滚动时 state 闭包会滞后）。 */
  const paneViewRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } })
  paneViewRef.current = { zoom: paneZoom, offset: paneOffset }
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  /** 已「放入工作台」的图（M3 画布接入后真正落图）。 */
  const [workbenchItems, setWorkbenchItems] = useState<MergedItem[]>([])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200)
  }, [])

  /**
   * 工作台画布要的图：**只保留有磁盘路径的**。
   * 会话附件只有 attachmentId、没有路径，喂不了出图脚本，所以工作台只收图片库的图。
   */
  const workbenchSources = useMemo<WorkbenchItem[]>(() => {
    const out: WorkbenchItem[] = []
    const seen = new Set<string>()
    for (const item of workbenchItems) {
      const path = item.path
      if (path === undefined || path === '' || seen.has(path)) continue
      seen.add(path)
      out.push({ path, name: item.name })
    }
    for (const path of workbenchPaths) {
      if (seen.has(path)) continue
      seen.add(path)
      const name = path.split(/[\\/]/).pop() ?? path
      out.push({ path, name })
    }
    return out
  }, [workbenchItems, workbenchPaths])

  /** 把「改图请求」塞进输入框：不覆盖用户已经打好的字。 */
  const sendToComposer = useCallback((text: string) => {
    if (inputActions === undefined) {
      flash('当前没有可用的输入框')
      return
    }
    try {
      const span = inputActions.captureInsertion()
      if (inputActions.insertText(text, span)) return
    } catch {
      // 落到下面的兜底
    }
    try {
      inputActions.setDraft(text)
    } catch {
      flash('写入输入框失败')
    }
  }, [inputActions, flash])
  const [busy, setBusy] = useState(false)
  /** 缩略图大小档位：1 = 最小（6 列）… 6 = 最大（1 列）。 */
  const [sizeLevel, setSizeLevel] = useState<number>(() => {
    try {
      const raw = Number(localStorage.getItem('dshsg:sizeLevel:v1'))
      return Number.isFinite(raw) && raw >= 1 && raw <= 6 ? Math.round(raw) : 5
    } catch {
      return 5
    }
  })
  /** 诊断信息（仅在空态显示，用于排查"读不到图"）。 */
  const [debug, setDebug] = useState<string>('')
  /** 设置面板开关。 */
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** 改设置后让图片库视图重挂载并重扫。 */
  const [libraryKey, setLibraryKey] = useState(0)
  const cols = 7 - sizeLevel

  // ---------- 读取会话事件 ----------
  useEffect(() => {
    if (sessions === undefined || sessionId === undefined || sessionId === '') {
      setLoading(false)
      setError('没有会话上下文')
      return
    }
    let disposed = false
    let unsubscribe: (() => void) | undefined
    let binding: ReturnType<typeof sessions.binding> | undefined
    // 累积集合：事件窗口会滑动，曾经出现过的图不能因为滑出窗口而消失
    const accumulated = new Map<string, SessionImage>()

    const merge = (): void => {
      if (disposed || binding === undefined) return
      try {
        const snapshot = binding.eventSource.getSnapshot()
        const entries = snapshot.entries ?? []
        const collected = collectSessionImages(entries)
        // 诊断：只在读到 0 张时值得排查，能看清 entries 形状与事件类型分布
        if (collected.length === 0) {
          const types: Record<string, number> = {}
          let firstImageBlock = ''
          for (const raw of entries) {
            const entry = raw as { event?: { type?: string, data?: unknown } } | null
            const event = entry?.event ?? (raw as { type?: string, data?: unknown })
            const type = String(event?.type ?? '?')
            types[type] = (types[type] ?? 0) + 1
            if (firstImageBlock === '') {
              const data = event?.data as { content?: unknown } | undefined
              const content = Array.isArray(data?.content) ? data.content : undefined
              if (content !== undefined) {
                const image = content.find((c) => (c as { type?: string } | null)?.type === 'image')
                if (image !== undefined) firstImageBlock = JSON.stringify(image).slice(0, 200)
              }
            }
          }
          setDebug(
            `entries=${entries.length} hasMore=${String(snapshot.hasMore)} ` +
            `图片块=${firstImageBlock === '' ? 0 : 1} ` +
            `类型=${JSON.stringify(types).slice(0, 160)} ` +
            (firstImageBlock === '' ? '' : `样例=${firstImageBlock}`),
          )
        } else {
          setDebug('')
        }
        for (const item of collected) {
          const prev = accumulated.get(item.id)
          if (prev === undefined || prev.time !== item.time) accumulated.set(item.id, item)
        }
        setImages([...accumulated.values()].sort((a, b) => b.time - a.time))
        setLoading(false)
        setError(null)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
        setLoading(false)
      }
    }

    /** 一次性把更早的历史补齐（避免在订阅回调里反复触发）。 */
    const fillOlder = async (): Promise<void> => {
      // 上限给足：会话很长时（几千条事件）早期图片块在最前面，
      // 页数不够会被漏掉 —— 表现为「以前看到的图突然从会话视图里消失」。
      for (let page = 0; page < 300; page += 1) {
        if (disposed || binding === undefined) return
        const snapshot = binding.eventSource.getSnapshot()
        if (snapshot.hasMore !== true) return
        if (typeof binding.loadOlder !== 'function') return
        try {
          await binding.loadOlder()
        } catch {
          return
        }
        if (disposed) return
        merge()
      }
    }

    try {
      binding = sessions.binding(sessionId)
      merge()
      void fillOlder()
      unsubscribe = binding.eventSource.subscribe(merge)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setLoading(false)
    }

    return () => {
      disposed = true
      try {
        unsubscribe?.()
      } catch {
        // 忽略
      }
    }
  }, [sessions, sessionId])

  // ---------- 图片 URL ----------
  const resolveUrl = useCallback(
    (attachment: ImageAttachmentRef): Promise<string> => {
      if (uiConversation === undefined || sessionId === undefined) {
        return Promise.reject(new Error('uiConversation 不可用'))
      }
      const cacheKey = `${sessionId}:${attachment.attachmentId}`
      const cached = urlCache.get(cacheKey)
      if (cached !== undefined) return cached
      const request = uiConversation.imageUrl(sessionId, attachment)
      urlCache.set(cacheKey, request)
      request.catch(() => urlCache.delete(cacheKey))
      return request
    },
    [uiConversation, sessionId],
  )

  // ---------- 当前会话已归档到图片库的图（按 sidecar.sessionId 筛） ----------
  const [sessionFiles, setSessionFiles] = useState<SessionLibraryFile[]>([])
  /**
   * 全库内容指纹 → sidecar。**只用于显示**（未归档大图借它显示参数/提示词），
   * 不参与「是否已归档」的判定 —— 那个只用 sourceAttachmentId。
   */
  const [metaByHash, setMetaByHash] = useState<Map<string, Record<string, unknown>>>(
    () => new Map<string, Record<string, unknown>>(),
  )
  /** 全库：12 位 hash → 库文件。用于「图已在库里 = 已归档」的判定与归档区补齐。 */
  const [fileByHash, setFileByHash] = useState<Map<string, LibraryFileByHash>>(
    () => new Map<string, LibraryFileByHash>(),
  )

  const refreshSessionFiles = useCallback(async (): Promise<void> => {
    if (sessionId === undefined || sessionId === '') return
    try {
      const response = await fetch(SCAN_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
      const payload = (await response.json()) as {
        items?: { path?: unknown, name?: unknown, mtime?: unknown, bytes?: unknown, hash?: unknown, meta?: Record<string, unknown> }[]
        pendingMeta?: { hash?: unknown, meta?: unknown }[]
      }
      const list = Array.isArray(payload.items) ? payload.items : []
      const mine: SessionLibraryFile[] = []
      const hashMeta = new Map<string, Record<string, unknown>>()
      /** 全库：12 位 hash → 库文件。用于「图在库里 = 已归档」的判定和归档区补齐。 */
      const hashFiles = new Map<string, LibraryFileByHash>()
      for (const item of list) {
        const path = typeof item.path === 'string' ? item.path : ''
        const itemHash = typeof item.hash === 'string'
          ? item.hash
          : (typeof item.meta?.hash === 'string' ? item.meta.hash : undefined)
        if (typeof itemHash === 'string' && itemHash !== '') {
          const key = itemHash.slice(0, 12).toLowerCase()
          // 全库：内容 hash → sidecar，供未归档大图借用元数据（仅显示用）
          if (item.meta !== undefined) hashMeta.set(key, item.meta)
          if (path !== '') {
            hashFiles.set(key, {
              path,
              name: typeof item.name === 'string' ? item.name : '图片',
              mtime: typeof item.mtime === 'number' ? item.mtime : 0,
              bytes: typeof item.bytes === 'number' ? item.bytes : 0,
              hash: key,
              ...(item.meta === undefined ? {} : { meta: item.meta }),
            })
          }
        }

        // 只收「已归属本会话」的文件（认领依据 = sidecar.sessionId）。
        // 库里其它副本哪怕内容相同也不算认领 —— 那是别的会话/脚本的图。
        const sid = item.meta?.sessionId
        if (typeof sid !== 'string' || sid !== sessionId) continue
        if (path === '') continue
        mine.push({
          path,
          name: typeof item.name === 'string' ? item.name : '图片',
          mtime: typeof item.mtime === 'number' ? item.mtime : 0,
          bytes: typeof item.bytes === 'number' ? item.bytes : 0,
          ...(typeof item.hash === 'string' ? { hash: item.hash } : {}),
          ...(item.meta === undefined ? {} : { meta: item.meta }),
        })
      }
      // 并入「脚本输出目录」的 sidecar（那批图不在图片库，但未归档时要显示参数/提示词）。
      // 图片库里的优先，这里只补缺。
      for (const entry of Array.isArray(payload.pendingMeta) ? payload.pendingMeta : []) {
        const hash = typeof entry.hash === 'string' ? entry.hash.slice(0, 12).toLowerCase() : ''
        const meta = entry.meta
        if (hash === '' || meta === null || typeof meta !== 'object') continue
        if (!hashMeta.has(hash)) hashMeta.set(hash, meta as Record<string, unknown>)
      }
      setSessionFiles(mine)
      setMetaByHash(hashMeta)
      setFileByHash(hashFiles)
    } catch {
      // 扫描失败时保留上次结果
    }
  }, [sessionId])

  useEffect(() => {
    void refreshSessionFiles()
  }, [refreshSessionFiles])

  /** 会话视图也定时补扫（库图部分需要跟着自动归档更新）。 */
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return
      void refreshSessionFiles()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [refreshSessionFiles])

  /**
   * 会话里出现新图时，立刻补扫一次库。
   * 不做这一步会出现「先显示在未归档、过几秒自己跳进归档区」的闪动：
   * 图刚进会话时，库那边的快照还是 5 秒前的，判不出它其实已经归属本会话。
   */
  const imageCount = images.length
  useEffect(() => {
    if (imageCount === 0) return
    void refreshSessionFiles()
  }, [imageCount, refreshSessionFiles])

  /**
   * 会话视图 = 图片库里 `sessionId === 当前会话` 的图（严格子集）。
   *
   * 别往这里加「会话事件里出现过的图」：那些图之所以没有 sessionId，
   * 是因为它们**绕过了「存入图片库」流程**（典型是脚本直接写库）。
   * 在这里补判断只会掩盖数据问题，而且结果会随会话事件窗口滑动时有时无。
   */
  const merged = useMemo<MergedItem[]>(() => {
    const list: MergedItem[] = []
    for (const file of sessionFiles) {
      list.push({
        id: file.path,
        kind: 'file',
        name: file.name,
        time: file.mtime,
        bytes: file.bytes,
        path: file.path,
        width: numberOf(file.meta?.width),
        height: numberOf(file.meta?.height),
        mediaType: stringOf(file.meta?.mediaType),
        prompt: stringOf(file.meta?.prompt),
        meta: file.meta,
      })
    }
    return list.sort((a, b) => b.time - a.time)
  }, [sessionFiles])

  /** 已归档附件 id 集合（用于判断哪些会话图还没入库）。 */
  const archivedIds = useMemo(() => {
    const set = new Set<string>()
    for (const file of sessionFiles) {
      const source = file.meta?.sourceAttachmentId
      if (typeof source === 'string' && source !== '') set.add(source)
    }
    return set
  }, [sessionFiles])

  /** 「忽略」的未归档图（attachmentId，存 localStorage；忽略后不再出现）。 */
  const [ignored, setIgnored] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('dshsg:pending-ignored:v1')
      const parsed = raw === null ? [] : (JSON.parse(raw) as unknown)
      return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
    } catch {
      return new Set()
    }
  })
  /** 未归档区是否展开全部（默认只看最近 30 张）。 */
  const [showAllPending, setShowAllPending] = useState(false)

  const ignorePending = useCallback((id: string) => {
    setIgnored((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem('dshsg:pending-ignored:v1', JSON.stringify([...next]))
      } catch {
        // 忽略存储失败
      }
      return next
    })
  }, [])

  /** 批量忽略：未归档区全选后一次性清干净。 */
  const ignorePendingMany = useCallback((ids: readonly string[]) => {
    if (ids.length === 0) return
    setIgnored((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      try {
        localStorage.setItem('dshsg:pending-ignored:v1', JSON.stringify([...next]))
      } catch {
        // 忽略存储失败
      }
      return next
    })
    setPendingSelected(new Set())
    flash(`已忽略 ${ids.length} 张（设置页「未归档区」可清空这个记录）`)
  }, [flash])

  /** 未归档：进过会话（你/工具看到过）但还没存进图片库的图（排除已忽略）。 */
  const unarchived = useMemo(
    () => images.filter((item) => !archivedIds.has(item.id) && !ignored.has(item.id)),
    [archivedIds, ignored, images],
  )

  /** 未归档区默认只显示最近 30 张，其余折叠。 */
  const PENDING_LIMIT = 30
  const visiblePending = useMemo(
    () => (showAllPending ? unarchived : unarchived.slice(0, PENDING_LIMIT)),
    [showAllPending, unarchived],
  )

  const [pendingSelected, setPendingSelected] = useState<Set<string>>(() => new Set())
  const [archiving, setArchiving] = useState(false)
  /** 未归档图的大图查看器（点开看大图再决定是否存入）。同样按 id 记，不按索引。 */
  const [pendingViewerId, setPendingViewerId] = useState<string | null>(null)

  /**
   * 把一批未归档图存入图片库（写 会话导入\<会话短id>\ + sidecar）。
   * 返回**新入库文件的绝对路径**——「收藏前先归档」那条路要用它反推内容 hash。
   */
  const archiveItems = useCallback(async (chosen: SessionImage[]): Promise<string[]> => {
    if (chosen.length === 0 || archiving) return []
    setArchiving(true)
    try {
      const response = await fetch('/plugins/dsh-session-gallery/archive', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId ?? '',
          items: chosen.map((item) => ({ attachment: item.attachment, origin: item.origin })),
        }),
      })
      const text = await response.text()
      let payload: { files?: unknown[], failed?: unknown[], error?: unknown } = {}
      try {
        payload = JSON.parse(text) as typeof payload
      } catch {
        flash(`存入失败：HTTP ${response.status}（响应为空，可能未重启）`)
        return []
      }
      if (!response.ok) {
        flash(`存入失败：${String(payload.error ?? response.status)}`)
        return []
      }
      const savedCount = Array.isArray(payload.files) ? payload.files.length : 0
      const failedCount = Array.isArray(payload.failed) ? payload.failed.length : 0
      flash(failedCount > 0 ? `已存入 ${savedCount} 张，${failedCount} 张失败` : `已存入图片库 ${savedCount} 张`)
      setPendingSelected(new Set())
      void refreshSessionFiles()
      return Array.isArray(payload.files)
        ? payload.files
          .map((entry) => (entry !== null && typeof entry === 'object' && typeof (entry as { path?: unknown }).path === 'string'
            ? (entry as { path: string }).path
            : ''))
          .filter((one) => one !== '')
        : []
    } catch (cause) {
      flash(`存入失败：${cause instanceof Error ? cause.message : String(cause)}`)
      return []
    } finally {
      setArchiving(false)
    }
  }, [archiving, flash, refreshSessionFiles, sessionId])

  /** 把勾选的未归档图存入图片库。 */
  const archivePending = useCallback(async (): Promise<void> => {
    await archiveItems(unarchived.filter((item) => pendingSelected.has(item.id)))
  }, [archiveItems, pendingSelected, unarchived])

  /**
   * 未归档图 → 查看器条目。
   * 会话事件里只有附件编号、没有 sidecar，所以这里按内容 hash 去全库借一份元数据，
   * 否则未归档大图的左浮条会是空的（参数、提示词全都看不到）。
   */
  const pendingViewerItems = useMemo<ViewerItem[]>(
    () => visiblePending.map((item) => {
      const bare = item.id.replace(/^sha256:/i, '').toLowerCase()
      const meta = bare.length >= 12 ? metaByHash.get(bare.slice(0, 12)) : undefined
      // 提示词是**独立字段**（查看器不从 meta 里取它），必须单独补一份。
      // 只补 meta 会得到「参数显示了、提示词空白」——两者的数据来源不同。
      const borrowedPrompt = meta !== undefined && typeof meta.prompt === 'string' && meta.prompt !== ''
        ? meta.prompt
        : undefined
      return {
        id: item.id,
        name: item.attachment.name ?? '图片',
        mediaType: item.attachment.mediaType,
        width: item.attachment.width,
        height: item.attachment.height,
        bytes: item.attachment.bytes,
        time: item.time,
        ...(borrowedPrompt === undefined ? {} : { prompt: borrowedPrompt }),
        ...(meta === undefined ? {} : { meta }),
      }
    }),
    [visiblePending, metaByHash],
  )

  /** 未归档查看器的当前索引：由 id 反查，列表增删不会让画面跳图。 */
  const pendingViewerIndex = pendingViewerId === null
    ? -1
    : pendingViewerItems.findIndex((entry) => entry.id === pendingViewerId)

  /** 一张会话图的收藏键：已归档的优先用内容 hash（改目录不丢），未归档用附件 id。 */
  const favoriteKeyOfMerged = useCallback((item: MergedItem): string | undefined => favoriteKeyOf({
    hash: typeof item.meta?.hash === 'string' ? item.meta.hash : undefined,
    attachmentId: item.attachment?.attachmentId,
  }), [])

  const isFavorite = useCallback((item: MergedItem): boolean => {
    const key = favoriteKeyOfMerged(item)
    return key !== undefined && favorites.has(key)
  }, [favorites, favoriteKeyOfMerged])

  const visible = useMemo(
    () => (onlyFavorite ? merged.filter((item) => isFavorite(item)) : merged),
    [merged, onlyFavorite, isFavorite],
  )

  /**
   * 当前会话里实际被收藏的张数，用于工具栏按钮的数字。
   *
   * 不能用 `favorites.size` —— 那份集合两个视图共用，还包含**别的会话**和图片库的收藏，
   * 数字会比本视图能筛出来的多，出现「显示收藏 2、点开一张都没有」
   * （2026-11-03 用户报的同类问题）。
   */
  const favoriteCount = useMemo(
    () => merged.filter((item) => isFavorite(item)).length,
    [merged, isFavorite],
  )

  /** 统一查看器条目。 */
  const viewerItems = useMemo(
    () => visible.map((item) => ({
      id: item.id,
      ...(item.path === undefined ? {} : { path: item.path }),
      name: item.name,
      mediaType: item.mediaType,
      width: item.width,
      height: item.height,
      bytes: item.bytes,
      time: item.time,
      prompt: item.prompt,
      meta: item.meta,
    })),
    [visible],
  )

  /** 会话图片查看器的当前索引：由 id 反查，列表增删不会让画面跳图。 */
  const viewerIndex = viewerId === null
    ? -1
    : viewerItems.findIndex((entry) => entry.id === viewerId)

  /** 统一查看器取 URL：文件走图片路由，附件走 DSH 附件通道。 */
  const resolveViewerUrl = useCallback(
    (item: { id: string }): Promise<string> => {
      const found = visible.find((candidate) => candidate.id === item.id)
      if (found === undefined) return Promise.reject(new Error('图片不存在'))
      if (found.kind === 'file' && found.path !== undefined) return Promise.resolve(fileUrlOf(found.path))
      if (found.attachment !== undefined) return resolveUrl(found.attachment)
      return Promise.reject(new Error('图片不可用'))
    },
    [resolveUrl, visible],
  )

  /** 并排对比：归档区和未归档区共用一个视图，靠 `pending` 区分取图通道。 */
  const [compare, setCompare] = useState<{ items: ViewerItem[], pending: boolean } | null>(null)

  const resolveCompareUrl = useCallback(
    (item: ViewerItem): Promise<string> => {
      if (compare?.pending === true) {
        const found = unarchived.find((candidate) => candidate.id === item.id)
        return found === undefined
          ? Promise.reject(new Error('图片不存在'))
          : resolveUrl(found.attachment)
      }
      return resolveViewerUrl(item)
    },
    [compare, unarchived, resolveUrl, resolveViewerUrl],
  )

  /** 内嵌大图取 URL：只在切换目标时重取，不被对话流式更新打断。 */
  const paneResolveRef = useRef(resolveViewerUrl)
  paneResolveRef.current = resolveViewerUrl
  const attachmentResolveRef = useRef(resolveUrl)
  attachmentResolveRef.current = resolveUrl
  const unarchivedRef = useRef(unarchived)
  unarchivedRef.current = unarchived

  useEffect(() => {
    if (paneItem === null) {
      setPaneUrl(undefined)
      return
    }
    // 换图时把缩放/位移复位，否则会带着上一张的状态
    setPaneZoom(1)
    setPaneOffset({ x: 0, y: 0 })
    let alive = true
    const { item, kind } = paneItem
    const promise = kind === 'file'
      ? paneResolveRef.current(item)
      : (() => {
        const found = unarchivedRef.current.find((candidate) => candidate.id === item.id)
        return found === undefined
          ? Promise.reject(new Error('图片不存在'))
          : attachmentResolveRef.current(found.attachment)
      })()
    promise
      .then((value) => { if (alive) setPaneUrl(value) })
      .catch(() => { if (alive) setPaneUrl(undefined) })
    return () => { alive = false }
  }, [paneItem])

  const toggleFavorite = useCallback((id: string) => {
    const item = merged.find((candidate) => candidate.id === id)
    const key = item === undefined ? undefined : favoriteKeyOfMerged(item)
    if (key === undefined) {
      flash('这张图没有可收藏的标识')
      return
    }
    setFavorites(toggleFavoriteKey(favorites, key))
  }, [favorites, favoriteKeyOfMerged, flash, merged])

  /**
   * 未归档图点收藏 → **先确认归档，归档成功再按内容 hash 收藏**。
   *
   * 为什么要强制先归档：收藏键优先用内容 hash，未归档图没有 hash，只能用附件 id
   * （`att:` 键）。一旦它被归档（换目录、换文件名），旧键就失效，收藏等于丢了；
   * 而且这份全局集合会让工具栏「收藏 N」混进当前视图筛不出来的项。
   * 用户的原话：「你都想收藏了怎么能不归档呢」。
   */
  const favoritePending = useCallback(async (item: SessionImage): Promise<void> => {
    // 旧数据里可能已经有 att: 键 → 先允许取消，不然用户没法清掉历史收藏
    const legacyKey = favoriteKeyOf({ attachmentId: item.attachment.attachmentId })
    if (legacyKey !== undefined && favorites.has(legacyKey)) {
      setFavorites(toggleFavoriteKey(favorites, legacyKey))
      return
    }
    const agreed = window.confirm(
      '收藏前要先把这张图存入图片库。\n\n'
      + '（收藏是按图片内容认的，不归档就没有可认的标识）\n\n'
      + '现在存入并收藏？',
    )
    if (!agreed) return
    const paths = await archiveItems([item])
    const hash = paths.map(hashOfArchivedPath).find((one) => one !== undefined)
    if (hash === undefined) {
      flash('已存入图片库，但没认出图片哈希，收藏失败')
      return
    }
    setFavorites(toggleFavoriteKey(loadFavorites(), `hash:${hash}`))
    flash('已存入图片库并收藏')
  }, [archiveItems, favorites, flash])

  const copyImage = useCallback((url: string) => {
    void (async () => {
      try {
        const blob = await (await fetch(url)).blob()
        const bitmap = await createImageBitmap(blob)
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
        bitmap.close()
        const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (png !== null) await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      } catch {
        // 剪贴板不可用时静默失败
      }
    })()
  }, [])

  /** 在资源管理器里定位这张图（浏览器不能起资源管理器，交给宿主 fork explorer）。 */
  const revealPath = useCallback((path: string) => {
    void (async () => {
      try {
        const response = await fetch(REVEAL_ROUTE, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path }),
        })
        if (!response.ok) {
          flash(`打开文件夹失败：HTTP ${response.status}`)
          return
        }
        flash('已在资源管理器中定位')
      } catch (cause) {
        flash(`打开文件夹失败：${cause instanceof Error ? cause.message : String(cause)}`)
      }
    })()
  }, [flash])

  /** 「打开文件夹」按钮：只有库图有磁盘路径。 */
  const revealItem = useCallback((item: ViewerItem) => {
    const path = item.path
    if (path === undefined || path === '') {
      flash('这张图没有磁盘路径')
      return
    }
    revealPath(path)
  }, [flash, revealPath])

  /** 「放入对话」按钮：把磁盘路径写进输入框（不覆盖已经打好的字）。返回是否写入成功。 */
  const putPathToDialog = useCallback((item: ViewerItem): boolean => {
    const path = item.path
    if (path === undefined || path === '') {
      flash('这张图没有磁盘路径，无法放入对话')
      return false
    }
    sendToComposer(path)
    flash('已把图片路径写入输入框')
    return true
  }, [flash, sendToComposer])

  // ---------- 勾选 ----------
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const selectedItems = useMemo(
    () => merged.filter((item) => selected.has(item.id)),
    [merged, selected],
  )

  /**
   * 放入对话：
   *   - 已归档文件：直接写真实路径（零复制）
   *   - 会话附件：先由宿主导出成短名文件，再把「短名 + 位置说明」写进输入框
   */
  const putIntoDialog = useCallback(async () => {
    if (selectedItems.length === 0 || busy) return
    setBusy(true)
    try {
      const filePaths = selectedItems
        .filter((item) => item.kind === 'file' && item.path !== undefined)
        .map((item) => item.path as string)
      const attachments = selectedItems.filter(
        (item) => item.kind === 'attachment' && item.attachment !== undefined,
      )

      let exportedNames: string[] = []
      let exportDir = ''
      let failures = 0

      if (attachments.length > 0) {
        const response = await fetch(EXPORT_ROUTE, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            items: attachments.map((item) => ({ attachment: item.attachment })),
          }),
        })
        const payload = (await response.json()) as {
          files?: { short?: unknown }[]
          failures?: unknown[]
          dir?: unknown
          error?: unknown
        }
        if (!response.ok) {
          flash(`导出会话附件失败：${String(payload.error ?? response.status)}`)
          return
        }
        exportedNames = (payload.files ?? [])
          .map((file) => (typeof file.short === 'string' ? file.short : ''))
          .filter((name) => name !== '')
        exportDir = typeof payload.dir === 'string' ? payload.dir : ''
        failures = payload.failures?.length ?? 0
      }

      if (filePaths.length === 0 && exportedNames.length === 0) {
        flash('没有可写入的图片')
        return
      }

      const textLines = [...filePaths]
      if (exportedNames.length > 0) {
        textLines.push(exportedNames.join('、'))
        textLines.push(`（会话附件在 ${exportDir} 下，文件名分别为 ${exportedNames.join('、')}.png）`)
      }
      const text = textLines.join('\n')

      const actions = inputActions
      if (actions === undefined) {
        flash('输入框不可用（没有 inputActions）')
        return
      }
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
      if (!wrote) {
        flash('写入输入框失败')
        return
      }
      if (failures > 0) flash(`已写入输入框（${failures} 张会话附件导出失败）`)
      else flash(`已把 ${filePaths.length + exportedNames.length} 张图片写入输入框`)
      clearSelection()
    } catch (cause) {
      flash(`放入对话失败：${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setBusy(false)
    }
  }, [busy, clearSelection, flash, inputActions, selectedItems])

  /** 放入工作台：切过去并记下这一批（M3 画布接入后直接落图）。 */
  const putIntoWorkbench = useCallback(() => {
    if (selectedItems.length === 0) return
    setWorkbenchItems((prev) => {
      const seen = new Set(prev.map((item) => item.id))
      return [...prev, ...selectedItems.filter((item) => !seen.has(item.id))]
    })
    switchTab('workbench')
    flash(`已放入工作台（${selectedItems.length} 张）`)
    clearSelection()
  }, [clearSelection, flash, selectedItems])

  /** 把指定路径放进工作台（查看器里单张放入用）。 */
  const pushPathsToWorkbench = useCallback((paths: readonly string[]) => {
    if (paths.length === 0) return
    setWorkbenchPaths((prev) => {
      const seen = new Set(prev)
      return [...prev, ...paths.filter((path) => !seen.has(path))]
    })
    switchTab('workbench')
    flash(`已放入工作台（${paths.length} 张）`)
  }, [flash])

  /** 删除图片库里的图（默认回收站；`permanent` 为真则彻底删），成功后刷新。 */
  const deletePaths = useCallback(async (paths: readonly string[], permanent = false): Promise<void> => {
    if (paths.length === 0) return
    try {
      const response = await fetch(DELETE_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paths: [...paths], permanent }),
      })
      const text = await response.text()
      let payload: { deleted?: unknown, mode?: unknown, error?: unknown } = {}
      try {
        payload = JSON.parse(text) as typeof payload
      } catch {
        flash(`删除失败：HTTP ${response.status}`)
        return
      }
      if (!response.ok) {
        flash(`删除失败：${String(payload.error ?? response.status)}`)
        return
      }
      const ok = typeof payload.deleted === 'number' ? payload.deleted : 0
      flash(ok > 0
        ? (payload.mode === 'recycle-bin' ? `已移入回收站 ${ok} 张` : `已删除 ${ok} 张`)
        : '没有可删除的图（不在图片库里）')
      if (ok > 0) {
        setViewerId(null)
        setPendingViewerId(null)
        void refreshSessionFiles()
      }
    } catch (cause) {
      flash(`删除失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }, [flash, refreshSessionFiles])

  /** 右键菜单：已归档的图。有磁盘路径才给「放入对话 / 工作台 / 打开文件夹 / 删除」。 */
  const fileMenuItems = useCallback((item: MergedItem) => {
    const path = item.path
    const items: { label: string, onSelect(): void, tone?: 'danger' }[] = [
      { label: '查看大图', onSelect: () => setViewerId(item.id) },
    ]
    if (path !== undefined) {
      items.push(
        {
          label: '放入对话',
          onSelect: () => {
            sendToComposer(path)
            flash('已把图片路径写入输入框')
          },
        },
        { label: '放入工作台', onSelect: () => pushPathsToWorkbench([path]) },
        { label: '打开文件夹', onSelect: () => revealPath(path) },
      )
    }
    items.push({
      label: isFavorite(item) ? '取消收藏' : '收藏',
      onSelect: () => toggleFavorite(item.id),
    })
    if (path !== undefined) {
      items.push({ label: '删除', tone: 'danger', onSelect: () => setBulkDelete([path]) })
    }
    return items
  }, [favorites, flash, pushPathsToWorkbench, revealPath, sendToComposer, toggleFavorite])

  /** 右键菜单：未归档的图（还没入库，没有磁盘路径）。 */
  const pendingMenuItems = useCallback((item: SessionImage) => [
    { label: '查看大图', onSelect: () => setPendingViewerId(item.id) },
    { label: '存入图片库', onSelect: () => { void archiveItems([item]) } },
    { label: '忽略此图', onSelect: () => ignorePendingMany([item.id]) },
  ], [archiveItems, ignorePendingMany])

  // ---------- 渲染 ----------
  /**
   * 顶栏的「共 N 张」= 这一栏实际能看到的张数（未归档 + 已归档）。
   * 不能用 `images.length`：那是会话事件窗口里的图，对话一长早期事件就滑出去，
   * 数字会小于列表里实际显示的张数（用户看到过的"共 4 张但下面 7 张"）。
   */
  const count = merged.length + unarchived.length
  const selectedCount = selected.size

  return (
    <div className="dshsg-root">
      {settingsOpen ? (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          onFlash={flash}
          onSaved={() => {
            void refreshSessionFiles()
            setLibraryKey((value) => value + 1)
          }}
        />
      ) : (
        <>
      <div className="dshsg-tabs">
        <button
          className="dshsg-tab"
          data-active={tab === 'session' ? 'true' : 'false'}
          onClick={() => switchTab('session')}
        >会话图片</button>
        <button
          className="dshsg-tab"
          data-active={tab === 'workbench' ? 'true' : 'false'}
          onClick={() => switchTab('workbench')}
        >工作台</button>
        <button
          className="dshsg-tab"
          data-active={tab === 'library' ? 'true' : 'false'}
          onClick={() => switchTab('library')}
        >图片库</button>
        <span className="dshsg-count">{count > 0 ? `共 ${count} 张` : ''}</span>
        <button
          className="dshsg-chip dshsg-settings-trigger"
          title="图片库设置"
          onClick={() => setSettingsOpen(true)}
        >⚙</button>
      </div>

      {tab === 'session' && (
        <>
          <div className="dshsg-toolbar">
            <button
              className="dshsg-chip"
              data-on={onlyFavorite ? 'true' : 'false'}
              onClick={() => setOnlyFavorite((v) => !v)}
            >★ 收藏{favoriteCount > 0 ? ` ${favoriteCount}` : ''}</button>
            <button
              className="dshsg-chip"
              onClick={() => {
                if (selectedCount === visible.length && visible.length > 0) clearSelection()
                else setSelected(new Set(visible.map((item) => item.id)))
              }}
            >{selectedCount > 0 && selectedCount === visible.length ? '取消全选' : '全选'}</button>
            <label className="dshsg-zoom" title="缩略图大小（向右拖 = 更大）">
              <span>小</span>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={sizeLevel}
                onChange={(e) => {
                  const value = Number(e.currentTarget.value)
                  setSizeLevel(value)
                  try {
                    localStorage.setItem('dshsg:sizeLevel:v1', String(value))
                  } catch {
                    // 忽略
                  }
                }}
              />
              <span>大</span>
            </label>
            <button
              className="dshsg-chip"
              title="清空「放入对话」导出的缓存文件"
              onClick={() => {
                void (async () => {
                  try {
                    const response = await fetch(CLEAR_ROUTE, {
                      method: 'POST',
                      credentials: 'same-origin',
                      headers: { 'content-type': 'application/json' },
                      body: '{}',
                    })
                    const payload = (await response.json()) as { removed?: unknown }
                    flash(`已清理 ${String(payload.removed ?? 0)} 个缓存文件`)
                  } catch {
                    flash('清理失败')
                  }
                })()
              }}
            >清缓存</button>
            <button
              className="dshsg-chip"
              title="把本地图片导入图片库（归到当前会话）"
              onClick={() => {
                void (async () => {
                  if (sessionId === undefined || sessionId === '') {
                    flash('没有会话上下文')
                    return
                  }
                  try {
                    const result = await pickAndImport(sessionId)
                    if (result === null) return
                    flash(result.message)
                    if (result.saved > 0) void refreshSessionFiles()
                  } catch (cause) {
                    flash(`导入失败：${cause instanceof Error ? cause.message : String(cause)}`)
                  }
                })()
              }}
            >导入</button>
          </div>

          {selectedCount > 0 && (
            <div className="dshsg-actionbar">
              <span className="dshsg-actionbar-count">已选 {selectedCount} 张</span>
              <button className="dshsg-action" disabled={busy} onClick={() => { void putIntoDialog() }}>
                放入对话
              </button>
              <button className="dshsg-action" disabled={busy} onClick={putIntoWorkbench}>
                放入工作台
              </button>
              <button
                className="dshsg-action dshsg-action-danger"
                disabled={busy}
                title="删除选中的图（默认进 Windows 回收站）。只有已存进图片库的图能删"
                onClick={() => {
                  const paths = selectedItems
                    .map((item) => item.path)
                    .filter((path): path is string => typeof path === 'string' && path !== '')
                  if (paths.length === 0) {
                    flash('选中的图还没存进图片库，无法删除（可用查看器里的「忽略此图」）')
                    return
                  }
                  if (paths.length < selectedItems.length) {
                    flash(`其中 ${paths.length} 张在图片库里，只删这些`)
                  }
                  setBulkDelete(paths)
                }}
              >删除</button>
              <button className="dshsg-action dshsg-action-ghost" onClick={clearSelection}>清空</button>
            </div>
          )}

          <div className="dshsg-scroll">
            {loading && <div className="dshsg-empty">正在读取会话图片…</div>}
            {!loading && error !== null && (
              <div className="dshsg-empty">
                <strong>读取失败</strong>
                <span>{error}</span>
              </div>
            )}
            {!loading && unarchived.length > 0 && (
              <div className="dshsg-pending">
                <div className="dshsg-pending-head">
                  <span className="dshsg-pending-title">
                    未归档 {unarchived.length} 张 · 只在对话里可见，还没进图片库
                  </span>
                  {unarchived.length > PENDING_LIMIT && (
                    <button
                      className="dshsg-chip"
                      onClick={() => setShowAllPending((value) => !value)}
                    >
                      {showAllPending ? `仅看最近 ${PENDING_LIMIT} 张` : `还有 ${unarchived.length - PENDING_LIMIT} 张（展开）`}
                    </button>
                  )}
                  <button
                    className="dshsg-chip"
                    title="选中未归档区的**全部**图（含被折叠的），配合「忽略」一次清空"
                    onClick={() => setPendingSelected(new Set(unarchived.map((item) => item.id)))}
                  >全选</button>
                  <button
                    className="dshsg-action"
                    disabled={pendingSelected.size === 0 || archiving}
                    onClick={() => { void archivePending() }}
                  >
                    {archiving ? '存入中…' : `存入图片库（${pendingSelected.size}）`}
                  </button>
                  <button
                    className="dshsg-action dshsg-action-ghost"
                    disabled={pendingSelected.size === 0}
                    title="把选中的图从「未归档」里隐藏（记在本地，可在设置页清空）"
                    onClick={() => ignorePendingMany([...pendingSelected])}
                  >
                    忽略（{pendingSelected.size}）
                  </button>
                </div>
                <div className="dshsg-pending-list">
                  {visiblePending.map((item, index) => (
                    <PendingThumb
                      key={item.id}
                      item={item}
                      resolveUrl={resolveUrl}
                      selected={pendingSelected.has(item.id)}
                      onOpen={() => setPendingViewerId(item.id)}
                      onToggle={() => {
                        setPendingSelected((prev) => {
                          const next = new Set(prev)
                          if (next.has(item.id)) next.delete(item.id)
                          else next.add(item.id)
                          return next
                        })
                      }}
                      onContext={({ x, y }) => setCtxMenu({ kind: 'pending', x, y, item })}
                      onMiddleClick={() => {
                        const found = pendingViewerItems.find((entry) => entry.id === item.id)
                        if (found !== undefined) setPaneItem({ kind: 'pending', item: found })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {!loading && error === null && visible.length === 0 && (
              <div className="dshsg-empty">
                <strong>{onlyFavorite ? '还没有收藏的图' : '这个会话里还没有图片'}</strong>
                <span>在对话中发图、或让 Agent 生成图片后，会自动出现在这里。</span>
                {debug !== '' && (
                  <details style={{ marginTop: 12, textAlign: 'left', width: '100%', fontSize: 10, opacity: .75 }}>
                    <summary style={{ cursor: 'pointer' }}>诊断信息（排查用）</summary>
                    <div style={{ wordBreak: 'break-all', marginTop: 6, lineHeight: 1.6 }}>{debug}</div>
                  </details>
                )}
              </div>
            )}
            {!loading && visible.length > 0 && (
              <div
                className="dshsg-grid"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {visible.map((item, i) => (
                  <Thumb
                    key={item.id}
                    item={item}
                    resolveUrl={resolveUrl}
                    favorite={isFavorite(item)}
                    selected={selected.has(item.id)}
                    onOpen={() => setViewerId(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onContext={({ x, y }) => setCtxMenu({ kind: 'file', x, y, item })}
                    onMiddleClick={() => {
                      const found = viewerItems.find((entry) => entry.id === item.id)
                      if (found !== undefined) setPaneItem({ kind: 'file', item: found })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'library' && (
        <LibraryView
          key={libraryKey}
          inputActions={inputActions}
          sessionId={sessionId}
          onFlash={flash}
          sizeLevel={sizeLevel}
          onSizeLevelChange={(level) => {
            setSizeLevel(level)
            try {
              localStorage.setItem('dshsg:sizeLevel:v1', String(level))
            } catch {
              // 忽略
            }
          }}
          onPutToWorkbench={(paths) => {
            // 走同一条路：追加去重 + 切到工作台标签 + 提示，与会话页/查看器的「放入工作台」保持一致
            pushPathsToWorkbench(paths)
          }}
        />
      )}

      {tab === 'workbench' && (
        <Workbench
          items={workbenchSources}
          onRequestEdit={sendToComposer}
          onRemove={(path) => {
            setWorkbenchItems((prev) => prev.filter((item) => item.path !== path))
            setWorkbenchPaths((prev) => prev.filter((entry) => entry !== path))
          }}
          onClear={() => {
            setWorkbenchItems([])
            setWorkbenchPaths([])
          }}
        />
      )}

      {viewerIndex >= 0 && (
        <GalleryLightbox
          items={viewerItems}
          index={viewerIndex}
          resolveUrl={resolveViewerUrl}
          favorites={favorites}
          favoriteOf={(viewerItem) => {
            const found = visible.find((candidate) => candidate.id === viewerItem.id)
            return found === undefined ? false : isFavorite(found)
          }}
          onClose={() => setViewerId(null)}
          onIndexChange={(next) => setViewerId(viewerItems[next]?.id ?? null)}
          onCopy={copyImage}
          onToggleFavorite={toggleFavorite}
          onPutToDialog={(item) => { if (putPathToDialog(item)) setViewerId(null) }}
          onReveal={revealItem}
          onPutToWorkbench={(item) => {
            pushPathsToWorkbench([item.path ?? item.id])
            setViewerId(null)
          }}
          onDelete={(item, permanent) => { void deletePaths([item.path ?? item.id], permanent) }}
          onCompare={(picked) => {
            setViewerId(null)
            setCompare({ items: picked, pending: false })
          }}
        />
      )}

      {pendingViewerIndex >= 0 && (
        <GalleryLightbox
          items={pendingViewerItems}
          index={pendingViewerIndex}
          resolveUrl={(item) => {
            const found = unarchived.find((candidate) => candidate.id === item.id)
            if (found === undefined) return Promise.reject(new Error('图片不存在'))
            return resolveUrl(found.attachment)
          }}
          favorites={favorites}
          favoriteOf={(viewerItem) => {
            const found = unarchived.find((candidate) => candidate.id === viewerItem.id)
            if (found === undefined) return false
            const key = favoriteKeyOf({ attachmentId: found.attachment.attachmentId })
            return key !== undefined && favorites.has(key)
          }}
          onClose={() => setPendingViewerId(null)}
          onIndexChange={(next) => setPendingViewerId(pendingViewerItems[next]?.id ?? null)}
          onCopy={copyImage}
          onPutToDialog={(item) => { if (putPathToDialog(item)) setPendingViewerId(null) }}
          onReveal={revealItem}
          onArchive={(item) => {
            const found = unarchived.find((candidate) => candidate.id === item.id)
            if (found !== undefined) void archiveItems([found])
          }}
          // 未归档图也能点收藏，但会先要求归档（见 favoritePending）
          onToggleFavorite={(id) => {
            const found = unarchived.find((candidate) => candidate.id === id)
            if (found !== undefined) void favoritePending(found)
          }}
          onIgnore={(item) => {
            ignorePending(item.id)
            // 关闭查看器（列表会刷新）
            setPendingViewerId(null)
          }}
          onCompare={(picked) => {
            setPendingViewerId(null)
            setCompare({ items: picked, pending: true })
          }}
        />
      )}

      {compare !== null && (
        <CompareView
          items={compare.items}
          resolveUrl={resolveCompareUrl}
          onClose={() => setCompare(null)}
        />
      )}
        </>
      )}

      {bulkDelete !== null && (
        <ConfirmDelete
          names={bulkDelete.map((path) => path.split(/[\\/]/).pop() ?? path)}
          onCancel={() => setBulkDelete(null)}
          onConfirm={(permanent) => {
            void deletePaths(bulkDelete, permanent)
            setBulkDelete(null)
          }}
        />
      )}

      {ctxMenu !== null && (
        <ImageContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={ctxMenu.kind === 'file' ? fileMenuItems(ctxMenu.item) : pendingMenuItems(ctxMenu.item)}
        />
      )}

      {paneItem !== null && (
        <div
          className="dshsg-pane"
          onMouseDown={(event) => {
            // 中键在 Windows 上会触发自动滚动，先拦掉
            if (event.button === 1) event.preventDefault()
          }}
          onAuxClick={(event) => {
            if (event.button === 1) {
              event.preventDefault()
              setPaneItem(null)
            }
          }}
        >
          <div className="dshsg-pane-bar">
            <span className="dshsg-pane-name">{paneItem.item.name ?? '图片'}</span>
            <button
              className="dshsg-chip"
              onClick={() => setPaneItem(null)}
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
                  // 光标相对「舞台中心」的偏移：图片是居中的，所以图片中心 = 舞台中心
                  const px = event.clientX - rect.left - rect.width / 2
                  const py = event.clientY - rect.top - rect.height / 2
                  const { zoom, offset } = paneViewRef.current
                  const next = Math.min(8, Math.max(0.3, zoom * Math.exp(-event.deltaY * 0.0015)))
                  const k = next / zoom
                  // 让光标下的那个点缩放前后停在同一位置
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

      {toast !== null && <div className="dshsg-toast">{toast}</div>}
    </div>
  )
}

/** 未归档区的缩略图：点击看大图，左上角勾选（忽略请在大图里操作，避免误触）。 */
function PendingThumb(props: {
  item: SessionImage
  resolveUrl(attachment: ImageAttachmentRef): Promise<string>
  selected: boolean
  onOpen(): void
  onToggle(): void
  onContext(event: { x: number; y: number }): void
  /** 鼠标中键：在侧边栏内嵌显示大图 */
  onMiddleClick(): void
}): JSX.Element {
  const { item, resolveUrl, selected, onOpen, onToggle, onContext, onMiddleClick } = props
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let alive = true
    resolveUrl(item.attachment)
      .then((value) => {
        if (alive) setUrl(value)
      })
      .catch(() => {
        // 忽略
      })
    return () => {
      alive = false
    }
  }, [item.attachment, resolveUrl])

  return (
    <button
      className="dshsg-pending-thumb"
      data-selected={selected ? 'true' : 'false'}
      onClick={onOpen}
      onContextMenu={(event) => {
        event.preventDefault()
        onContext({ x: event.clientX, y: event.clientY })
      }}
      onMouseDown={(event) => {
        if (event.button === 1) event.preventDefault()
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault()
          onMiddleClick()
        }
      }}
      title={`${item.origin === 'user' ? '你发的' : '工具产物'} · 点击看大图；中键在侧栏内展开；右键更多操作`}
    >
      {url !== undefined
        ? <img src={url} alt="" loading="lazy" draggable={false} />
        : <div className="dshsg-card-placeholder">…</div>}
      <span
        className="dshsg-check"
        data-checked={selected ? 'true' : 'false'}
        role="checkbox"
        aria-checked={selected}
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onToggle()
        }}
      >{selected ? '✓' : ''}</span>
    </button>
  )
}

/** 网格里的一个缩略图：文件直接走图片路由，附件进入视口才解析 URL；左上角可勾选。 */
function Thumb(props: {
  item: MergedItem
  resolveUrl(attachment: ImageAttachmentRef): Promise<string>
  favorite: boolean
  selected: boolean
  onOpen(): void
  onToggleSelect(): void
  onContext(event: { x: number; y: number }): void
  /** 鼠标中键：在侧边栏内嵌显示大图 */
  onMiddleClick(): void
}): JSX.Element {
  const { item, resolveUrl, favorite, selected, onOpen, onToggleSelect, onContext, onMiddleClick } = props
  const ref = useRef<HTMLButtonElement | null>(null)
  const initialUrl = item.kind === 'file' && item.path !== undefined ? fileUrlOf(item.path) : undefined
  const [url, setUrl] = useState<string | undefined>(initialUrl)
  const [need, setNeed] = useState<boolean>(item.kind === 'file')

  useEffect(() => {
    if (item.kind === 'file') return
    const el = ref.current
    if (el === null) return
    if (typeof IntersectionObserver === 'undefined') {
      setNeed(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNeed(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [item.kind])

  useEffect(() => {
    if (item.kind === 'file') {
      setUrl(item.path === undefined ? undefined : fileUrlOf(item.path))
      return
    }
    if (!need || item.attachment === undefined) return
    let alive = true
    resolveUrl(item.attachment)
      .then((value) => {
        if (alive) setUrl(value)
      })
      .catch(() => {
        // 忽略：保持占位
      })
    return () => {
      alive = false
    }
  }, [need, item.kind, item.path, item.attachment, resolveUrl])

  return (
    <button
      className="dshsg-card"
      ref={ref}
      data-selected={selected ? 'true' : 'false'}
      onClick={onOpen}
      onContextMenu={(event) => {
        event.preventDefault()
        onContext({ x: event.clientX, y: event.clientY })
      }}
      onMouseDown={(event) => {
        if (event.button === 1) event.preventDefault()
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault()
          onMiddleClick()
        }
      }}
      title={`${item.name}\n点击查看大图；中键在侧栏内展开；右键更多操作；有路径的图可以直接拖进输入框`}
    >
      {url !== undefined
        ? (
          <img
            src={url}
            alt=""
            loading="lazy"
            draggable={item.path !== undefined}
            onDragStart={(event) => {
              if (item.path === undefined) {
                event.preventDefault()
                return
              }
              // 拖进输入框 = 插入路径文本（浏览器默认把 text/plain 落进去）
              event.dataTransfer.setData('text/plain', item.path)
              event.dataTransfer.effectAllowed = 'copy'
            }}
          />
          )
        : <div className="dshsg-card-placeholder">{need ? '加载中…' : ''}</div>}
      <span
        className="dshsg-check"
        data-checked={selected ? 'true' : 'false'}
        role="checkbox"
        aria-checked={selected}
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onToggleSelect()
        }}
      >{selected ? '✓' : ''}</span>
      <span className="dshsg-badge">
        {favorite ? '★ ' : ''}{originLabel(item.meta?.origin)} · {formatRelative(item.time)}
      </span>
    </button>
  )
}
