/**
 * 全屏浮窗（灯箱）——会话图与图片库图共用。
 *
 * 布局（用户 2026-10-30 指定）：
 *   - 图片占满中间，左右各一条半透明浮条，鼠标移开自动淡出（CSS :hover）
 *   - 左浮条：渠道 / 模型 / 尺寸 / 质量 / 分辨率 / 体积 / 成本 / 提示词（信息向）
 *   - 右浮条：生成时间 / 归档时间 / 时间 / 操作按钮（动作向）
 *   - 导航收进顶部条，舞台两侧完全让给浮条
 *   - 只保留一个关闭入口（顶部 ✕）；Esc 与点空白同样可关
 *   - 浮条内所有文字可拖选复制；「复制参数」与浮条显示用同一份数据生成，避免对不上
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatBytes, formatRelative } from '../data/session-images'
import { ConfirmDelete } from './ConfirmDelete'

/** 查看器里的一项（会话图与库图统一成这个形状）。 */
export interface ViewerItem {
  id: string
  /**
   * 图片库里的磁盘路径。**只有库图有**——会话附件只有 attachmentId。
   * 「放入工作台」「删除」都依赖它，没有就说明这张图还不在库里。
   */
  path?: string
  name?: string
  mediaType?: string
  width?: number
  height?: number
  bytes?: number
  time?: number
  prompt?: string
  /** sidecar 原始元数据（来源、模型、参数、归档时间等，按需展示）。 */
  meta?: Record<string, unknown>
}

/** 来源 → 中文标签。`site` / `folder` 是 AI 参考库站点那一侧写进来的两种来源。 */
export function originLabel(origin: unknown): string {
  switch (origin) {
    case 'user': return '你发的'
    case 'tool': return '工具产物'
    case 'script': return '脚本产物'
    case 'manual': return '手动导入'
    case 'site': return '站点上传'
    case 'folder': return '文件夹放入'
    default: return '未知来源'
  }
}

/** 从 meta 里取字符串。 */
function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** 取数字。 */
function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

interface RailRow { label: string, value: string }

/**
 * 提示词的最终来源：优先 `item.prompt`，**空了再退回 sidecar 的 `meta.prompt`**。
 * 归档区和未归档区分别喂这两个字段，只认一个就会出现「参数显示了、提示词空白」。
 */
function effectivePrompt(item: ViewerItem): string | undefined {
  const own = item.prompt
  if (own !== undefined && own !== '') return own
  return textOf(item.meta?.prompt)
}

/** 左浮条：出图参数与体积成本（信息向）。顺序即界面顺序，也是「复制参数」的顺序。 */
function paramRows(item: ViewerItem): RailRow[] {
  const meta = item.meta ?? {}
  const rows: RailRow[] = []
  const channel = textOf(meta.channel)
  if (channel !== undefined) rows.push({ label: '渠道', value: channel })
  const model = textOf(meta.model)
  if (model !== undefined) rows.push({ label: '模型', value: model })
  const size = textOf(meta.size)
  if (size !== undefined) rows.push({ label: '尺寸', value: size })
  const quality = textOf(meta.quality)
  if (quality !== undefined) rows.push({ label: '质量', value: quality })
  const resolution = textOf(meta.resolution)
  if (resolution !== undefined) rows.push({ label: '分辨率', value: resolution.toUpperCase() })
  const width = item.width ?? numberOf(meta.width)
  const height = item.height ?? numberOf(meta.height)
  if (width !== undefined && height !== undefined) rows.push({ label: '像素', value: `${width} × ${height}` })
  if (item.bytes !== undefined) rows.push({ label: '体积', value: formatBytes(item.bytes) })
  const cost = numberOf(meta.costUsd)
  if (cost !== undefined) rows.push({ label: '成本', value: `$${cost.toFixed(4)}（约 ¥${(cost * 7.1).toFixed(3)}）` })
  return rows
}

/** 右浮条上半：时间（动作向浮条里的时间区）。 */
function timeRows(item: ViewerItem): RailRow[] {
  const meta = item.meta ?? {}
  const rows: RailRow[] = []
  const createdAt = textOf(meta.createdAt)
  if (createdAt !== undefined) rows.push({ label: '生成时间', value: createdAt.replace('T', ' ').slice(0, 19) })
  const importedAt = textOf(meta.importedAt)
  if (importedAt !== undefined) rows.push({ label: '归档时间', value: importedAt.replace('T', ' ').slice(0, 19) })
  if (item.time !== undefined) rows.push({ label: '时间', value: formatRelative(item.time) })
  const mediaType = item.mediaType
  if (mediaType !== undefined) rows.push({ label: '格式', value: mediaType })
  return rows
}

/** 「复制参数」的文本：与左浮条显示逐行一致，再接提示词。 */
function paramsText(item: ViewerItem): string {
  const lines = paramRows(item).map((row) => `${row.label}：${row.value}`)
  const prompt = effectivePrompt(item)
  if (prompt !== undefined && prompt !== '') {
    lines.push('', prompt)
  }
  return lines.join('\n')
}

/**
 * 参数对照表用的事实表（label → value）。
 * 取值口径与左浮条的 `paramRows` 一致，并排对比时两边的数字才对得上。
 */
export function compareFacts(item: ViewerItem): Map<string, string> {
  const meta = item.meta ?? {}
  const out = new Map<string, string>()
  const put = (label: string, value: string | undefined): void => {
    if (value !== undefined && value !== '') out.set(label, value)
  }
  put('模型', textOf(meta.model))
  put('尺寸', textOf(meta.size))
  const resolution = textOf(meta.resolution)
  put('分辨率', resolution === undefined ? undefined : resolution.toUpperCase())
  put('质量', textOf(meta.quality))
  const width = item.width ?? numberOf(meta.width)
  const height = item.height ?? numberOf(meta.height)
  put('像素', width !== undefined && height !== undefined ? `${width} × ${height}` : undefined)
  put('体积', item.bytes !== undefined ? formatBytes(item.bytes) : undefined)
  const refs = numberOf(meta.referenceCount)
  put('参考图', refs === undefined ? undefined : `${refs} 张`)
  const cost = numberOf(meta.costUsd)
  put('花费', cost === undefined ? undefined : `$${cost.toFixed(4)}`)
  const createdAt = textOf(meta.createdAt)
  put('生成时间', createdAt === undefined ? undefined : createdAt.replace('T', ' ').slice(0, 16))
  return out
}

export interface LightboxProps {
  items: readonly ViewerItem[]
  index: number
  /** 按需取这一项的显示 URL（会话：imageUrl；库：/plugins/.../image?path=）。 */
  resolveUrl(item: ViewerItem): Promise<string>
  onClose(): void
  onIndexChange(next: number): void
  onCopy(url: string): void
  onToggleFavorite?(id: string): void
  /** 传了才显示「存入图片库」按钮（用于未归档图）。 */
  onArchive?(item: ViewerItem): void
  /** 传了才显示「忽略」按钮（未归档图：不再出现在未归档区）。 */
  onIgnore?(item: ViewerItem): void
  /** 传了才显示「放入工作台」；只有带磁盘路径的库图才有效。 */
  onPutToWorkbench?(item: ViewerItem): void
  /** 传了才显示「放入对话」：把磁盘路径写进输入框。 */
  onPutToDialog?(item: ViewerItem): void
  /** 传了才显示「打开文件夹」：在资源管理器里定位这张图。 */
  onReveal?(item: ViewerItem): void
  /** 传了才显示「删除」；只有带磁盘路径的库图才有效。`permanent` 为真表示彻底删除。 */
  onDelete?(item: ViewerItem, permanent: boolean): void
  /**
   * 传了才显示「对比」按钮：在当前这组图里挑一张，和当前图并排对比。
   * 挑中的两张交给调用方打开 CompareView（不在这里直接渲染，避免两套布局互相牵扯）。
   */
  onCompare?(items: ViewerItem[]): void
  favorites: ReadonlySet<string>
  /**
   * 优先用它判断「当前图是否已收藏」。
   * 
   * 为什么需要：收藏键和 ViewerItem.id 不是一回事 ——
   *   - 会话图按 attachmentId 收藏；
   *   - 图片库按内容 hash 收藏（换目录不丢）。
   * 所以由调用方提供判定，而不是在灯箱里猜。
   */
  favoriteOf?(item: ViewerItem): boolean
}

/** 缩放范围（相对适屏比例的倍率）。 */
const MIN_ZOOM = 0.05
const MAX_ZOOM = 16

export function GalleryLightbox(props: LightboxProps): JSX.Element {
  const { items, index, resolveUrl, onClose, onIndexChange, onCopy, onToggleFavorite, onArchive, onIgnore, onPutToWorkbench, onPutToDialog, onReveal, onDelete, onCompare, favorites } = props
  const item = items[index]
  /**
   * 当前项的身份。依赖它、而不是 `item` 对象：
   * 流式对话时上游每次渲染都会重建 items 里的对象，用对象做依赖会让下面的 effect
   * 每帧重跑 → setUrl(undefined) → 图片消失再加载，表现为「大图一直闪」。
   */
  const itemKey = item === undefined ? '' : item.id
  /** 最新一帧的取值函数。它可能是内联箭头（每次渲染都换），所以不能进依赖数组。 */
  const resolveRef = useRef(resolveUrl)
  resolveRef.current = resolveUrl
  const itemRef = useRef(item)
  itemRef.current = item

  const stageRef = useRef<HTMLDivElement | null>(null)
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [stage, setStage] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  /** 给滚轮用：连续滚动时 state 闭包会滞后，读 ref 才准。 */
  const viewRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } })
  viewRef.current = { zoom, offset }
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  /** 一次按下时的坐标：用来区分「点空白」与「拖拽」。 */
  const downPointRef = useRef<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  /** 删除确认层：删图不可逆，先问一句（默认回收站，可勾选永久删除）。 */
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  /** 挑第二张对比图（true = 底部展开缩略图条）。 */
  const [comparePick, setComparePick] = useState(false)
  /** 挑图条的缩略图 URL（按 item.id 存）。 */
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  /** 最新一帧的 items：挑图条的 effect 不能依赖 items（流式对话时每帧都是新数组）。 */
  const itemsRef = useRef(items)
  itemsRef.current = items

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1600)
  }, [])

  // 取当前项的 URL —— 只在**换图**时重新取；流式更新（对话还在跑）时一动不动
  useEffect(() => {
    if (itemKey === '') return
    const target = itemRef.current
    if (target === undefined) return
    let alive = true
    setUrl(undefined)
    resolveRef.current(target)
      .then((value) => {
        if (alive) setUrl(value)
      })
      .catch(() => {
        if (alive) setUrl(undefined)
      })
    return () => {
      alive = false
    }
  }, [itemKey])

  // 适屏比例
  const fit = useMemo(() => {
    if (natural.width <= 0 || natural.height <= 0 || stage.width <= 0 || stage.height <= 0) return 1
    return Math.min(stage.width / natural.width, stage.height / natural.height) * 0.94
  }, [natural.width, natural.height, stage.width, stage.height])

  /**
   * 打开「对比」挑图条时，批量取缩略图 URL。
   * 只用 comparePick 做依赖（items 在流式对话里每帧都是新数组，进依赖会反复重取）；
   * 最多取 60 张，够挑就行，不为了一个候选条把整个会话的图全解一遍。
   */
  useEffect(() => {
    if (!comparePick) return
    let alive = true
    const current = itemRef.current?.id
    for (const target of itemsRef.current.slice(0, 60)) {
      if (target.id === current) continue
      void resolveRef.current(target)
        .then((value) => {
          if (alive) setThumbUrls((prev) => ({ ...prev, [target.id]: value }))
        })
        .catch(() => undefined)
    }
    return () => {
      alive = false
    }
  }, [comparePick])

  // 换图时重置视图
  useEffect(() => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setNatural({ width: 0, height: 0 })
  }, [index])

  // 监听 stage 尺寸
  useEffect(() => {
    const el = stageRef.current
    if (el === null) return
    const update = (): void => setStage({ width: el.clientWidth, height: el.clientHeight })
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        if (index > 0) onIndexChange(index - 1)
      } else if (e.key === 'ArrowRight') {
        if (index < items.length - 1) onIndexChange(index + 1)
      } else if (e.key === '0' || e.key === '+') {
        setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))
      } else if (e.key === '-') {
        setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onClose, onIndexChange])

  // 拖拽：监听挂 window，避免指针捕获在移出视口时被释放
  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      const d = dragRef.current
      if (d === null) return
      setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) })
    }
    const onUp = (): void => {
      if (dragRef.current !== null) {
        dragRef.current = null
        setDragging(false)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const onWheel = (e: React.WheelEvent): void => {
    e.preventDefault()
    // 以指针为锚点：缩放前后，光标下的那个点停在原地。
    // 图片是居中定位的（中心 = 舞台中心 + offset），所以 p 直接由光标减去舞台中心得到。
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - rect.height / 2
    const { zoom: currentZoom, offset: currentOffset } = viewRef.current
    const factor = Math.exp(-e.deltaY * 0.0015)
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * factor))
    const k = next / currentZoom
    setZoom(next)
    setOffset({
      x: px - k * (px - currentOffset.x),
      y: py - k * (py - currentOffset.y),
    })
  }

  const onMouseDown = (e: React.MouseEvent): void => {
    if (e.button !== 0) return
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setDragging(true)
  }

  const fitOnce = (): void => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }
  const actualSize = (): void => {
    if (fit <= 0) return
    setZoom(1 / fit)
    setOffset({ x: 0, y: 0 })
  }

  const displayW = natural.width * fit * zoom
  const displayH = natural.height * fit * zoom
  const zoomPct = Math.round(zoom * 100)

  const copyText = useCallback((text: string, okMessage: string) => {
    void navigator.clipboard.writeText(text).then(
      () => flash(okMessage),
      () => flash('复制失败'),
    )
  }, [flash])

  /**
   * 桌面版把「最小化 / 最大化 / 关闭」浮在页面最上层，会压住顶部条。
   * 优先用 Window Controls Overlay 的实测高度，拿不到再按 Electron 兜底（web 版为 0）。
   */
  const titlebarPx = useMemo(() => {
    const overlay = (navigator as unknown as {
      windowControlsOverlay?: { visible?: boolean, getTitlebarAreaRect?: () => { height?: number } }
    }).windowControlsOverlay
    if (overlay?.visible === true && typeof overlay.getTitlebarAreaRect === 'function') {
      try {
        const rect = overlay.getTitlebarAreaRect()
        if (typeof rect?.height === 'number' && rect.height > 0) return Math.round(rect.height)
      } catch {
        // 探测失败就用兜底值
      }
    }
    return /Electron/i.test(navigator.userAgent) ? 38 : 0
  }, [])

  if (item === undefined) return <></>

  const favorite = props.favoriteOf !== undefined ? props.favoriteOf(item) : favorites.has(item.id)
  const paramList = paramRows(item)
  const timeList = timeRows(item)
  const promptText = effectivePrompt(item)
  const hasPrompt = promptText !== undefined && promptText !== ''

  return (
    <div
      className="dshsg-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="图片查看器"
      style={{ '--dshsg-titlebar': `${titlebarPx}px` } as React.CSSProperties}
    >
      {/* 顶部条：标题在左，导航与关闭收在右端；舞台两侧留给浮条 */}
      <div className="dshsg-lb-top">
        <span className="dshsg-lb-title">{item.name ?? '图片'}</span>
        <span className="dshsg-lb-count">{index + 1} / {items.length}</span>
        {/* 上一张/下一张并排贴成一个分段控件。
            之前分别放在标题两侧，连点翻页时鼠标要横跨整个窗口，很难受。 */}
        <div className="dshsg-lb-nav-group">
          <button
            className="dshsg-lb-nav-inline"
            title="上一张 (←)"
            disabled={index <= 0}
            onClick={() => onIndexChange(index - 1)}
          >‹</button>
          <button
            className="dshsg-lb-nav-inline"
            title="下一张 (→)"
            disabled={index >= items.length - 1}
            onClick={() => onIndexChange(index + 1)}
          >›</button>
        </div>
        {onCompare !== undefined && items.length >= 2 && (
          <button
            className="dshsg-lb-compare"
            data-on={comparePick ? 'true' : 'false'}
            title="挑一张和当前图并排对比"
            onClick={() => setComparePick((value) => !value)}
          >对比</button>
        )}
        <button className="dshsg-lb-close-button" title="关闭 (Esc)" onClick={onClose}>✕</button>
      </div>

      <div
        className="dshsg-lb-stage"
        ref={stageRef}
        data-dragging={dragging ? 'true' : 'false'}
        onWheel={onWheel}
        onMouseDown={(e) => {
          downPointRef.current = { x: e.clientX, y: e.clientY }
          onMouseDown(e)
        }}
        onClick={(e) => {
          // 点空白处关闭：位移小（不是拖拽）、没点在图片/按钮/浮条上
          const start = downPointRef.current
          downPointRef.current = null
          if (start === null) return
          const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y)
          const target = e.target as HTMLElement
          if (moved >= 5) return
          if (target.tagName === 'IMG') return
          if (target.closest('button') !== null) return
          if (target.closest('[data-rail]') !== null) return
          onClose()
        }}
        onDoubleClick={(e) => {
          e.preventDefault()
          fitOnce()
        }}
      >
        {url !== undefined && (
          <img
            className="dshsg-lb-img"
            src={url}
            alt=""
            draggable={false}
            style={{
              width: displayW > 0 ? `${displayW}px` : 'auto',
              height: displayH > 0 ? `${displayH}px` : 'auto',
              maxWidth: displayW > 0 ? 'none' : '90vw',
              maxHeight: displayH > 0 ? 'none' : '90vh',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
            onLoad={(e) => {
              const el = e.currentTarget
              setNatural({ width: el.naturalWidth, height: el.naturalHeight })
            }}
          />
        )}

        <div className="dshsg-lb-zoom">
          <button title="缩小 (-)" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))}>−</button>
          <span>{zoomPct}%</span>
          <button title="放大 (+)" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))}>+</button>
          <button title="适应窗口 (双击图片)" onClick={fitOnce}>适应</button>
          <button title="实际像素 (100%)" onClick={actualSize}>1:1</button>
        </div>
      </div>

      {/* 左浮条：参数信息（可拖选复制） */}
      <aside className="dshsg-lb-rail" data-side="left" data-rail="params">
        <div className="dshsg-lb-rail-head">
          <span>参数</span>
          {paramList.length > 0 && (
            <button
              className="dshsg-lb-rail-copy"
              title="复制上面这些参数（有提示词则一并复制）"
              onClick={() => copyText(paramsText(item), hasPrompt ? '已复制：参数 + 提示词' : '已复制参数')}
            >复制全部</button>
          )}
        </div>
        <div className="dshsg-lb-rows">
          {paramList.map((row) => (
            <div key={row.label} className="dshsg-lb-row">
              <i>{row.label}</i>
              <b>{row.value}</b>
            </div>
          ))}
          {paramList.length === 0 && <div className="dshsg-lb-row dshsg-lb-row-empty">这张图没有参数信息</div>}
        </div>
        {hasPrompt && (
          <div className="dshsg-lb-rail-prompt">
            <div className="dshsg-lb-rail-head">
              <span>提示词</span>
              <button
                className="dshsg-lb-rail-copy"
                title="只复制提示词"
                onClick={() => copyText(promptText ?? '', '已复制提示词')}
              >复制提示词</button>
            </div>
            <div className="dshsg-lb-rail-prompt-body">{promptText}</div>
          </div>
        )}
      </aside>

      {/* 右浮条：时间 + 操作 */}
      <aside className="dshsg-lb-rail" data-side="right" data-rail="actions">
        {timeList.length > 0 && (
          <div className="dshsg-lb-rows">
            {timeList.map((row) => (
              <div key={row.label} className="dshsg-lb-row">
                <i>{row.label}</i>
                <b>{row.value}</b>
              </div>
            ))}
          </div>
        )}
        <div className="dshsg-lb-rail-actions">
          {onArchive !== undefined && (
            <button
              data-tone="primary"
              onClick={() => {
                onArchive(item)
                flash('已存入图片库')
              }}
              title="把这张图存进图片库（写 会话导入 + sidecar）"
            >存入图片库</button>
          )}
          {onIgnore !== undefined && (
            <button
              onClick={() => {
                onIgnore(item)
                flash('已忽略：不再出现在未归档区')
              }}
              title="忽略这张图（不再出现在未归档区；可在设置里清空忽略记录）"
            >忽略此图</button>
          )}
          {onToggleFavorite !== undefined && (
            <button onClick={() => onToggleFavorite(item.id)} title="收藏">
              {favorite ? '★ 已收藏' : '☆ 收藏'}
            </button>
          )}
          {onPutToWorkbench !== undefined && item.path !== undefined && (
            <button
              onClick={() => {
                onPutToWorkbench(item)
                flash('已放入工作台')
              }}
              title="把这张图放进工作台画布"
            >放入工作台</button>
          )}
          {onPutToDialog !== undefined && item.path !== undefined && (
            <button
              onClick={() => onPutToDialog(item)}
              title="把这张图的磁盘路径写进输入框"
            >放入对话</button>
          )}
          {onReveal !== undefined && item.path !== undefined && (
            <button
              onClick={() => onReveal(item)}
              title="在资源管理器里打开这张图所在的文件夹"
            >打开文件夹</button>
          )}
          {onDelete !== undefined && item.path !== undefined && (
            <button
              data-tone="danger"
              onClick={() => setDeleteConfirm(true)}
              title="删除这张图（默认进 Windows 回收站）"
            >删除</button>
          )}
          <button
            onClick={() => {
              if (url === undefined) return
              onCopy(url)
              flash('已复制图片')
            }}
          >复制图片</button>
        </div>
      </aside>

      {deleteConfirm && onDelete !== undefined && (
        <ConfirmDelete
          names={[item.name ?? '图片']}
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={(permanent) => {
            onDelete(item, permanent)
            setDeleteConfirm(false)
          }}
        />
      )}

      {/* 挑第二张对比图：从当前这组里选，不管两张在列表里挨不挨着 */}
      {comparePick && onCompare !== undefined && (
        <div className="dshsg-lb-pick">
          <div className="dshsg-lb-pick-head">
            <span>选一张和当前图并排对比</span>
            <button className="dshsg-lb-pick-cancel" onClick={() => setComparePick(false)}>取消</button>
          </div>
          <div className="dshsg-lb-pick-list">
            {items
              .filter((target) => target.id !== item.id)
              .slice(0, 60)
              .map((target) => (
                <button
                  key={target.id}
                  className="dshsg-lb-pick-item"
                  title={target.name ?? ''}
                  onClick={() => {
                    setComparePick(false)
                    onCompare([item, target])
                  }}
                >
                  {thumbUrls[target.id] === undefined
                    ? <span className="dshsg-lb-pick-ph">…</span>
                    : <img src={thumbUrls[target.id]} alt="" draggable={false} />}
                  <span className="dshsg-lb-pick-name">{target.name ?? ''}</span>
                </button>
              ))}
            {items.length <= 1 && <div className="dshsg-lb-pick-empty">这组图里没有别的图可选</div>}
          </div>
        </div>
      )}

      {toast !== null && <div className="dshsg-toast">{toast}</div>}
    </div>
  )
}
