/**
 * 工作台画布（M3 骨架版）。
 *
 * 定位：**只负责表达意图，不负责出图**。圈选之后拼一段「改图请求」文本交给对话框，
 * 用什么模型、怎么出图，由接手的 AI 自己决定 —— 所以这里不认识任何出图通道。
 *
 * 坐标系约定（改这里之前先读）：
 *   世界坐标 == 图片像素坐标（每张图以 1:1 放在世界里，靠 view.zoom 整体缩放）
 *   屏幕 → 世界：(sx - panX) / zoom
 *   世界 → 图片：[wx - img.x, wy - img.y]
 * 这样只要不做旋转，换算就是一次平移缩放，不会有累积误差。
 *
 * 壳：DOM + CSS transform（图片用 <img>，缩放由浏览器重采样，比 canvas 画图清晰），
 * 墨迹用一张覆盖视口的 canvas，只负责画笔和选框。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface WorkbenchItem {
  path: string
  name: string
}

interface PlacedImage {
  path: string
  name: string
  /** 世界坐标（左上角），单位 = 原图像素 */
  x: number
  y: number
  width: number
  height: number
  url: string
  /** 不透明度 0..1，叠图对比时把上层调淡。 */
  opacity: number
}

interface Point { x: number, y: number }
interface Box { x: number, y: number, w: number, h: number }

/** 一次圈选：矩形，或一条自由笔画（世界坐标）。 */
type Mark =
  | { kind: 'rect', box: Box }
  | { kind: 'pen', points: Point[] }

type Tool = 'pan' | 'rect' | 'pen'

export interface WorkbenchProps {
  items: readonly WorkbenchItem[]
  onRemove?(path: string): void
  onClear?(): void
  /** 把拼好的「改图请求」交给调用方（通常是填进对话框）。 */
  onRequestEdit(text: string): void
}

const IMAGE_ROUTE = '/plugins/dsh-session-gallery/image'
const SAVE_ROUTE = '/plugins/dsh-session-gallery/workbench-save'

function imageUrl(path: string): string {
  return `${IMAGE_ROUTE}?path=${encodeURIComponent(path)}`
}

/** 加载一张图（同源，能直接 drawImage 到 canvas 上）。 */
async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image-load-failed'))
    image.src = url
  })
}

/** 把圈选轨迹描进当前路径（坐标 = 图片像素）。`begin=false` 时接着上一条子路径画。 */
function traceShape(
  context: CanvasRenderingContext2D,
  mark: Mark,
  points: readonly Point[],
  begin = true,
): void {
  if (begin) context.beginPath()
  if (mark.kind === 'rect') {
    const first = points[0]
    const second = points[1]
    if (first === undefined || second === undefined) return
    context.rect(
      Math.min(first.x, second.x),
      Math.min(first.y, second.y),
      Math.abs(second.x - first.x),
      Math.abs(second.y - first.y),
    )
    return
  }
  const head = points[0]
  if (head === undefined) return
  context.moveTo(head.x, head.y)
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]
    if (point !== undefined) context.lineTo(point.x, point.y)
  }
  // 闭合才能填充成"面"，模型才看得出改的是哪一块
  context.closePath()
}

/** canvas → base64 → 宿主落盘，返回磁盘路径。 */
async function saveCanvasImage(
  canvas: HTMLCanvasElement,
  name: string,
  mime: 'image/png' | 'image/jpeg' = 'image/png',
  quality?: number,
): Promise<string | undefined> {
  const dataUrl = canvas.toDataURL(mime, quality)
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return undefined
  try {
    const response = await fetch(SAVE_ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, dataBase64: dataUrl.slice(comma + 1) }),
    })
    if (!response.ok) return undefined
    const payload = (await response.json()) as { path?: unknown }
    return typeof payload.path === 'string' ? payload.path : undefined
  } catch {
    return undefined
  }
}

/**
 * 导出**蒙版图**（只此一张）。
 *
 *  - 蒙版图：全白不透明底，圈选区挖成**透明**（`destination-out`）。
 *    OpenAI 系接口的约定是「透明 = 允许重绘」，APIMart 兼容该协议。
 *
 * 2026-11-06 去掉标注图：`generate_image` 支持 `mask` 参数后，
 * 「改哪里」由蒙版精确表达，标注图（原图+红线）只是让模型"看"，
 * 信息冗余且整张 JPEG 有几 MB。区域坐标仍写进改图请求里兜底。
 *
 * 支持一次带多个圈：它们的路径会合并成同一张蒙版上的多个子路径，
 * 这样"一张图改多处"只产生一张蒙版，而不是每处一张。
 */
async function exportMask(
  image: PlacedImage,
  marks: readonly Mark[],
  locales: readonly (readonly Point[])[],
): Promise<{ mask?: string }> {
  let source: HTMLImageElement
  try {
    source = await loadHtmlImage(image.url)
  } catch {
    return {}
  }
  const width = Math.max(1, Math.round(image.width))
  const height = Math.max(1, Math.round(image.height))
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const base = image.name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'image'

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height
  const maskContext = maskCanvas.getContext('2d')
  if (maskContext === null) return {}
  maskContext.fillStyle = '#ffffff'
  maskContext.fillRect(0, 0, width, height)
  maskContext.globalCompositeOperation = 'destination-out'
  marks.forEach((mark, index) => {
    const points = locales[index]
    if (points !== undefined) traceShape(maskContext, mark, points, index === 0)
  })
  maskContext.fill()
  maskContext.globalCompositeOperation = 'source-over'
  // 蒙版必须是 PNG：要靠 alpha 通道表达「哪里可以重绘」
  const mask = await saveCanvasImage(maskCanvas, `${base}-mask-${stamp}.png`, 'image/png')
  return mask === undefined ? {} : { mask }
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** 包围盒（世界坐标）。 */
function boundsOf(points: readonly Point[]): Box {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const point of points) {
    if (point.x < minX) minX = point.x
    if (point.y < minY) minY = point.y
    if (point.x > maxX) maxX = point.x
    if (point.y > maxY) maxY = point.y
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function Workbench(props: WorkbenchProps): JSX.Element {
  const { items, onRemove, onClear, onRequestEdit } = props

  const hostRef = useRef<HTMLDivElement | null>(null)
  const inkRef = useRef<HTMLCanvasElement | null>(null)

  const [placed, setPlaced] = useState<PlacedImage[]>([])
  const [view, setView] = useState({ panX: 40, panY: 40, zoom: 0.5 })
  const [tool, setTool] = useState<Tool>('pan')
  const [marks, setMarks] = useState<Mark[]>([])
  const [draft, setDraft] = useState<Mark | null>(null)
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 })
  const [toast, setToast] = useState<string | null>(null)
  /** 正在导出标注图 / 蒙版图。 */
  const [busy, setBusy] = useState(false)
  /**
   * 排布方式：grid = 自动网格（新图进来时排一次），free = 用户自己拖过，位置不再被覆盖。
   */
  const [layout, setLayout] = useState<'grid' | 'free'>('grid')
  /** 当前选中的图（用于透明度滑块、置顶/置底）。 */
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const flash = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((cur) => (cur === message ? null : cur)), 1600)
  }, [])

  // ---------------------------------------------------------------- 放图

  // 已知尺寸的缓存：同一路径只量一次
  const sizesRef = useRef<Map<string, { width: number, height: number }>>(new Map())

  useEffect(() => {
    let cancelled = false
    const wanted = items.map((item) => item.path)
    setPlaced((prev) => {
      const existing = new Map(prev.map((image) => [image.path, image]))
      const next: PlacedImage[] = []
      let cursorX = 0
      const gap = 40
      for (const item of items) {
        const known = existing.get(item.path)
        if (known !== undefined) {
          next.push(known)
          cursorX = Math.max(cursorX, known.x + known.width + gap)
          continue
        }
        // 新图先放在最后，尺寸测出来后再排（见下）
        next.push({
          path: item.path,
          name: item.name,
          x: cursorX,
          y: 0,
          width: 0,
          height: 0,
          url: imageUrl(item.path),
          opacity: 1,
        })
        cursorX += gap
      }
      // 尺寸未知的图异步测量
      for (const image of next) {
        if (image.width > 0) continue
        const cached = sizesRef.current.get(image.path)
        if (cached !== undefined) {
          image.width = cached.width
          image.height = cached.height
          continue
        }
        const probe = new Image()
        probe.onload = () => {
          if (cancelled) return
          const size = { width: probe.naturalWidth, height: probe.naturalHeight }
          sizesRef.current.set(image.path, size)
          setPlaced((cur) => cur.map((entry) => entry.path === image.path ? { ...entry, ...size } : entry))
        }
        probe.src = image.url
      }
      return next
    })
    // 删掉的图同步移除
    setPlaced((prev) => prev.filter((image) => wanted.includes(image.path)))
    return () => {
      cancelled = true
    }
  }, [items])

  /**
   * 按指定方式重排位置。返回新数组（不改原对象）。
   * 排列结果直接写进 placed 的 x/y —— 位置是真实数据，不是渲染期算出来的，
   * 否则用户拖过的位置会被下一次渲染覆盖掉。
   */
  const arrange = useCallback((images: readonly PlacedImage[], mode: 'grid' | 'row' | 'column' | 'stack'): PlacedImage[] => {
    const gap = 40
    // 重叠：全部以左上角对齐到同一点，叠在一起比对齐/比差异（配合不透明度滑块用）
    if (mode === 'stack') {
      return images.map((image) => ({ ...image, x: 0, y: 0 }))
    }
    if (mode === 'row') {
      let x = 0
      return images.map((image) => {
        const next = { ...image, x, y: 0 }
        x += (image.width || 1) + gap
        return next
      })
    }
    if (mode === 'column') {
      let y = 0
      return images.map((image) => {
        const next = { ...image, x: 0, y }
        y += (image.height || 1) + gap
        return next
      })
    }
    // 少量图（对比场景通常 2~4 张）直接排成一行，不换行。
    // 阈值 2200 太窄：两张 1536 宽的图加起来 3112 就被迫换行，看着像竖排。
    // 超过 4 张才按 2200 换行，免得十几张排成一条长龙、缩放后全是缩略图。
    const limit = images.length <= 4 ? Number.POSITIVE_INFINITY : 2200
    let x = 0
    let y = 0
    let rowHeight = 0
    return images.map((image) => {
      const width = image.width || 1
      if (x > 0 && x + width > limit) {
        x = 0
        y += rowHeight + gap
        rowHeight = 0
      }
      const next = { ...image, x, y }
      x += width + gap
      rowHeight = Math.max(rowHeight, image.height || 1)
      return next
    })
  }, [])

  /** 自动网格：尺寸到齐且用户没手动拖过时，保持排好。 */
  useEffect(() => {
    if (layout !== 'grid') return
    setPlaced((prev) => {
      if (prev.length === 0 || prev.some((image) => image.width === 0)) return prev
      const next = arrange(prev, 'grid')
      const same = next.every((image, index) => image.x === prev[index]?.x && image.y === prev[index]?.y)
      return same ? prev : next
    })
  }, [placed, layout, arrange])

  const laidOut = placed

  // ---------------------------------------------------------------- 视口

  useEffect(() => {
    const host = hostRef.current
    if (host === null) return
    const measure = (): void => setHostSize({ width: host.clientWidth, height: host.clientHeight })
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  /** 第一次拿到尺寸后，把内容整体居中适配一次。 */
  const fittedRef = useRef(false)
  useEffect(() => {
    if (fittedRef.current) return
    if (hostSize.width === 0 || laidOut.length === 0) return
    if (laidOut.some((image) => image.width === 0)) return
    const box = boundsOf(laidOut.flatMap((image) => [
      { x: image.x, y: image.y },
      { x: image.x + image.width, y: image.y + image.height },
    ]))
    if (box.w === 0 || box.h === 0) return
    const zoom = Math.min(hostSize.width / (box.w + 120), hostSize.height / (box.h + 120), 1)
    setView({
      zoom,
      panX: (hostSize.width - box.w * zoom) / 2 - box.x * zoom,
      panY: (hostSize.height - box.h * zoom) / 2 - box.y * zoom,
    })
    fittedRef.current = true
  }, [hostSize, laidOut])

  const toWorld = useCallback((screenX: number, screenY: number): Point => ({
    x: (screenX - view.panX) / view.zoom,
    y: (screenY - view.panY) / view.zoom,
  }), [view])

  const toScreen = useCallback((worldX: number, worldY: number): Point => ({
    x: worldX * view.zoom + view.panX,
    y: worldY * view.zoom + view.panY,
  }), [view])

  /** 世界坐标命中的图（从上层往下，后放的优先）。 */
  const imageAt = useCallback((point: Point): PlacedImage | undefined => {
    for (let index = laidOut.length - 1; index >= 0; index -= 1) {
      const image = laidOut[index]
      if (image === undefined || image.width === 0) continue
      if (point.x >= image.x && point.x <= image.x + image.width
        && point.y >= image.y && point.y <= image.y + image.height) return image
    }
    return undefined
  }, [laidOut])

  // ---------------------------------------------------------------- 交互

  const panRef = useRef<{ screenX: number, screenY: number, panX: number, panY: number } | null>(null)
  const drawRef = useRef<{ points: Point[] } | null>(null)
  /** 正在拖动某一张图（pan 工具下按住图）。 */
  const dragImageRef = useRef<{
    path: string
    screenX: number
    screenY: number
    originX: number
    originY: number
  } | null>(null)

  const onWheel = (event: React.WheelEvent): void => {
    event.preventDefault()
    const host = hostRef.current
    if (host === null) return
    const rect = host.getBoundingClientRect()
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top
    const factor = Math.exp(-event.deltaY * 0.0015)
    setView((prev) => {
      const zoom = Math.min(8, Math.max(0.05, prev.zoom * factor))
      // 以光标为锚点缩放
      const worldX = (cursorX - prev.panX) / prev.zoom
      const worldY = (cursorY - prev.panY) / prev.zoom
      return { zoom, panX: cursorX - worldX * zoom, panY: cursorY - worldY * zoom }
    })
  }

  const onPointerDown = (event: React.PointerEvent): void => {
    const host = hostRef.current
    if (host === null) return
    // 阻止浏览器的默认动作（图片拖拽、文本选择、中键自动滚动）
    event.preventDefault()
    const rect = host.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const wantsPan = tool === 'pan' || event.button === 1 || event.shiftKey
    if (wantsPan) {
      const world = toWorld(screenX, screenY)
      // 左键按在图上 = 拖动这张图；按在空白（或中键） = 平移画布
      const hit = event.button === 1 ? undefined : imageAt(world)
      if (hit !== undefined && hit.width > 0) {
        setSelectedPath(hit.path)
        dragImageRef.current = {
          path: hit.path,
          screenX,
          screenY,
          originX: hit.x,
          originY: hit.y,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        return
      }
      setSelectedPath(null)
      panRef.current = { screenX, screenY, panX: view.panX, panY: view.panY }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    const world = toWorld(screenX, screenY)
    drawRef.current = { points: [world] }
    setDraft(tool === 'rect' ? { kind: 'rect', box: { x: world.x, y: world.y, w: 0, h: 0 } } : { kind: 'pen', points: [world] })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent): void => {
    const host = hostRef.current
    if (host === null) return
    const rect = host.getBoundingClientRect()
    const moving = dragImageRef.current
    if (moving !== null) {
      const dx = (event.clientX - rect.left - moving.screenX) / view.zoom
      const dy = (event.clientY - rect.top - moving.screenY) / view.zoom
      // 一旦手动拖过就退出自动网格，否则下一次重排会把它弹回去
      setLayout('free')
      setPlaced((prev) => prev.map((image) => image.path === moving.path
        ? { ...image, x: moving.originX + dx, y: moving.originY + dy }
        : image))
      return
    }
    const pan = panRef.current
    if (pan !== null) {
      setView((prev) => ({
        ...prev,
        panX: pan.panX + (event.clientX - rect.left - pan.screenX),
        panY: pan.panY + (event.clientY - rect.top - pan.screenY),
      }))
      return
    }
    const drawing = drawRef.current
    if (drawing === null) return
    const world = toWorld(event.clientX - rect.left, event.clientY - rect.top)
    drawing.points.push(world)
    if (tool === 'rect') {
      const first = drawing.points[0]
      if (first === undefined) return
      setDraft({
        kind: 'rect',
        box: {
          x: Math.min(first.x, world.x),
          y: Math.min(first.y, world.y),
          w: Math.abs(world.x - first.x),
          h: Math.abs(world.y - first.y),
        },
      })
    } else {
      setDraft({ kind: 'pen', points: [...drawing.points] })
    }
  }

  const onPointerUp = (): void => {
    panRef.current = null
    dragImageRef.current = null
    const drawing = drawRef.current
    drawRef.current = null
    if (drawing === null || draft === null) return
    // 太小的动作当成误触
    if (draft.kind === 'rect' && (draft.box.w < 4 || draft.box.h < 4)) {
      setDraft(null)
      return
    }
    if (draft.kind === 'pen' && draft.points.length < 3) {
      setDraft(null)
      return
    }
    setMarks((prev) => [...prev, draft])
    setDraft(null)
  }

  // ---------------------------------------------------------------- 墨迹绘制

  useEffect(() => {
    const canvas = inkRef.current
    if (canvas === null) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(hostSize.width * ratio))
    canvas.height = Math.max(1, Math.floor(hostSize.height * ratio))
    canvas.style.width = `${hostSize.width}px`
    canvas.style.height = `${hostSize.height}px`
    const context = canvas.getContext('2d')
    if (context === null) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, hostSize.width, hostSize.height)

    const paint = (mark: Mark, color: string): void => {
      context.strokeStyle = color
      context.lineWidth = 2
      context.lineJoin = 'round'
      context.lineCap = 'round'
      if (mark.kind === 'rect') {
        const topLeft = toScreen(mark.box.x, mark.box.y)
        context.strokeRect(topLeft.x, topLeft.y, mark.box.w * view.zoom, mark.box.h * view.zoom)
        return
      }
      if (mark.points.length === 0) return
      const head = mark.points[0]
      if (head === undefined) return
      context.beginPath()
      const first = toScreen(head.x, head.y)
      context.moveTo(first.x, first.y)
      for (let index = 1; index < mark.points.length; index += 1) {
        const point = mark.points[index]
        if (point === undefined) continue
        const screen = toScreen(point.x, point.y)
        context.lineTo(screen.x, screen.y)
      }
      context.stroke()
    }

    for (const mark of marks) paint(mark, 'rgba(91, 140, 255, .95)')
    if (draft !== null) paint(draft, 'rgba(255, 196, 0, .95)')
  }, [marks, draft, view, hostSize, toScreen])

  // ---------------------------------------------------------------- 生成请求

  const buildRequest = useCallback(async (): Promise<string | undefined> => {
    if (marks.length === 0) {
      flash('先用框选或画笔圈出要改的位置')
      return undefined
    }

    const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value))

    /**
     * 按「归属哪张图」把圈分组。
     * 之前只取最后一个圈，用户圈了三处点一次按钮只有最后一处生效 —— 那是 bug。
     */
    const groups = new Map<string, { image: PlacedImage, marks: Mark[], locales: Point[][] }>()
    for (const mark of marks) {
      const worldPoints = mark.kind === 'rect'
        ? [
          { x: mark.box.x, y: mark.box.y },
          { x: mark.box.x + mark.box.w, y: mark.box.y + mark.box.h },
        ]
        : mark.points
      const probe = mark.kind === 'rect'
        ? { x: mark.box.x + mark.box.w / 2, y: mark.box.y + mark.box.h / 2 }
        : mark.points[0]
      if (probe === undefined) continue
      const image = imageAt(probe)
      if (image === undefined) continue
      const local = worldPoints.map((point) => ({
        x: clamp(point.x - image.x, image.width),
        y: clamp(point.y - image.y, image.height),
      }))
      const box = boundsOf(local)
      if (box.w < 2 || box.h < 2) continue
      const group = groups.get(image.path) ?? { image, marks: [], locales: [] }
      group.marks.push(mark)
      group.locales.push(local)
      groups.set(image.path, group)
    }

    if (groups.size === 0) {
      flash('圈选没落在这张图上，或范围太小')
      return undefined
    }

    const blocks: string[] = []
    for (const group of groups.values()) {
      const { image } = group
      const exported = await exportMask(image, group.marks, group.locales)
      const lines: string[] = []
      lines.push(`图：${image.path}`)
      lines.push(`尺寸：${Math.round(image.width)} × ${Math.round(image.height)}`)
      if (exported.mask !== undefined) {
        lines.push(`蒙版图：${exported.mask}（透明处 = 允许重绘；传给 generate_image 的 mask 参数）`)
      } else {
        lines.push('蒙版图：导出失败，只能用下面的区域坐标描述')
      }
      group.locales.forEach((points, index) => {
        const box = boundsOf(points)
        lines.push(
          `区域${index + 1}：像素 (x=${Math.round(box.x)}, y=${Math.round(box.y)}, w=${Math.round(box.w)}, h=${Math.round(box.h)})`
          + `｜归一化 (x=${round(box.x / image.width, 3)}, y=${round(box.y / image.height, 3)}, `
          + `w=${round(box.w / image.width, 3)}, h=${round(box.h / image.height, 3)})`,
        )
      })
      blocks.push(lines.join('\n'))
    }

    return ['【改图请求】', '', ...blocks, '', '要求：'].join('\n')
  }, [marks, imageAt, flash])

  const emit = useCallback(() => {
    if (busy) return
    setBusy(true)
    void buildRequest()
      .then((text) => {
        if (text === undefined) return
        onRequestEdit(text)
        flash('已填入对话框')
      })
      .finally(() => setBusy(false))
  }, [busy, buildRequest, onRequestEdit, flash])

  // ---------------------------------------------------------------- 渲染

  const empty = laidOut.length === 0
  const selectedImage = laidOut.find((image) => image.path === selectedPath)

  return (
    <div className="dshsg-wb">
      <div className="dshsg-wb-bar">
        <div className="dshsg-wb-tools">
          <button data-active={tool === 'pan' ? 'true' : 'false'} onClick={() => setTool('pan')} title="按图拖动单张；按空白拖动平移（也可按住 Shift 或鼠标中键）">移动</button>
          <button data-active={tool === 'rect' ? 'true' : 'false'} onClick={() => setTool('rect')} title="拖出矩形选区">框选</button>
          <button data-active={tool === 'pen' ? 'true' : 'false'} onClick={() => setTool('pen')} title="按住自由圈画">画笔</button>
        </div>
        <div className="dshsg-wb-actions">
          <span className="dshsg-wb-hint">{Math.round(view.zoom * 100)}% · {laidOut.length} 张</span>
          {laidOut.length > 1 && (
            <>
              <button onClick={() => { setPlaced((prev) => arrange(prev, 'row')); setLayout('free') }} title="水平并排">横排</button>
              <button onClick={() => { setPlaced((prev) => arrange(prev, 'column')); setLayout('free') }} title="垂直堆叠">竖排</button>
              <button onClick={() => { setPlaced((prev) => arrange(prev, 'stack')); setLayout('free') }} title="左上角对齐叠在一起；选中后调低不透明度即可透看下一张">重叠</button>
            </>
          )}
          <button onClick={() => setMarks([])} disabled={marks.length === 0}>清除圈选</button>
          <button data-tone="primary" onClick={emit} disabled={busy}>
            {busy ? '正在导出…' : '生成改图请求'}
          </button>
          {onClear !== undefined && (
            <button onClick={() => { setMarks([]); onClear() }} disabled={empty}>清空</button>
          )}
        </div>
      </div>

      {selectedImage !== undefined && (
        <div className="dshsg-wb-bar dshsg-wb-selbar">
          <span className="dshsg-wb-hint">选中：{selectedImage.name}</span>
          <label className="dshsg-wb-opacity">
            不透明度
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(selectedImage.opacity * 100)}
              onChange={(event) => {
                const value = Number(event.currentTarget.value) / 100
                setPlaced((prev) => prev.map((image) => image.path === selectedImage.path ? { ...image, opacity: value } : image))
              }}
            />
            <b>{Math.round(selectedImage.opacity * 100)}%</b>
          </label>
          <button
            onClick={() => setPlaced((prev) => {
              const target = prev.find((image) => image.path === selectedImage.path)
              if (target === undefined) return prev
              return [...prev.filter((image) => image.path !== target.path), target]
            })}
            title="放到最上层，方便叠在另一张上对比"
          >置顶</button>
          <button
            onClick={() => setPlaced((prev) => {
              const target = prev.find((image) => image.path === selectedImage.path)
              if (target === undefined) return prev
              return [target, ...prev.filter((image) => image.path !== target.path)]
            })}
            title="放到最下层"
          >置底</button>
          <button onClick={() => { setPlaced((prev) => prev.map((image) => image.path === selectedImage.path ? { ...image, opacity: 1 } : image)); setSelectedPath(null) }}>
            取消选中
          </button>
        </div>
      )}

      <div
        className="dshsg-wb-stage"
        ref={hostRef}
        data-tool={tool}
        onWheel={onWheel}
        /* 必须在容器上拦掉原生拖拽：Chromium 对 <img> 的原生 drag 一旦启动，
           pointermove 就不再派发，画笔/框选/平移全部失灵（只看到拖动 ghost 的假象）。 */
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {empty && (
          <div className="dshsg-wb-empty">
            <strong>工作台</strong>
            <div style={{ marginTop: 8 }}>
              在「图片库」勾选图片后点「放入工作台」，图片会落在这里。<br />
              用「框选」或「画笔」圈出要改的位置，再点「生成改图请求」。
            </div>
          </div>
        )}

        <div
          className="dshsg-wb-world"
          style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}
        >
          {laidOut.map((image) => (
            <div
              key={image.path}
              className="dshsg-wb-image"
              data-selected={selectedPath === image.path ? 'true' : 'false'}
              style={{
                left: image.x,
                top: image.y,
                width: image.width || 1,
                height: image.height || 1,
                opacity: image.opacity,
              }}
            >
              <img src={image.url} alt={image.name} draggable={false} />
              {onRemove !== undefined && (
                <button
                  className="dshsg-wb-remove"
                  title="从工作台移除"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(image.path)
                  }}
                >✕</button>
              )}
            </div>
          ))}
        </div>

        <canvas className="dshsg-wb-ink" ref={inkRef} />
      </div>

      {toast !== null && <div className="dshsg-toast">{toast}</div>}
    </div>
  )
}
