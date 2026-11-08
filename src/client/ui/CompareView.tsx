/**
 * 并排对比视图 —— 选中 2~4 张图同时看，底部给参数对照表。
 *
 * 设计约定（2026-11-08 用户确认）：
 *   - 2 张为主，最多 4 张
 *   - **不翻页**：对比是有目的的动作，选定就固定，想换退出重选
 *   - 底部参数对照（模型 / 分辨率 / 质量 / 花费 …），这才是"对比"真正要看的部分
 *
 * 同步缩放（2026-11-08 追加，用户确认走"构图位置"而不是"像素倍率"）：
 *   - 滚轮以鼠标位置为中心缩放，**所有图共用一个缩放与位置**
 *   - 同步的是**归一化坐标**（0~1，相对图片自身尺寸），所以 1536×1024 和 1024×1536
 *     摆在一起时，放大看到的是各自同一块构图区域，能对上主体
 *   - 拖动同步平移：平移量也存成归一化比例，两张按各自尺寸换算，构图才对得齐
 *   - 不做"取消同步"开关（用户明确不要）
 *
 * 和 Lightbox 的关系：Lightbox 是"单张 + 参数浮条"，这里是"多张 + 参数表"。
 * 参数提取复用 Lightbox 导出的 `compareFacts`，避免两处各写一套口径。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { compareFacts, type ViewerItem } from './Lightbox'

/** 参数对照表的行顺序（只显示至少一张有值的行）。 */
const ROW_ORDER = ['模型', '尺寸', '分辨率', '质量', '像素', '体积', '参考图', '花费', '生成时间']

/** 缩放范围：1 = 适应格子；最大 8 倍够看像素级细节了。 */
const MIN_ZOOM = 0.5
const MAX_ZOOM = 8
/** 滚一格放大多少。 */
const WHEEL_STEP = 1.15

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

/** 把一个数夹到 0~1。 */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export interface CompareViewProps {
  items: readonly ViewerItem[]
  resolveUrl(item: ViewerItem): Promise<string>
  onClose(): void
}

export function CompareView(props: CompareViewProps): JSX.Element {
  const { items, resolveUrl, onClose } = props
  /** 每张图的显示 URL（按 item.id 存）。 */
  const [urls, setUrls] = useState<Record<string, string | undefined>>({})
  /** 最新一帧的取值函数：父组件可能内联传箭头，不能进依赖数组。 */
  const resolveRef = useRef(resolveUrl)
  resolveRef.current = resolveUrl

  /** 这组图的身份：只有"换了一组图"才重新取 URL，父组件重渲染不重取。 */
  const groupKey = items.map((item) => item.id).join('|')

  // ---- 同步缩放状态（所有图共用） ----
  /** 相对"适应格子"的倍率。 */
  const [zoom, setZoom] = useState(1)
  /** 缩放锚点（图片内容的归一化坐标，0~1）。滚轮时移到鼠标位置。 */
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 })
  /** 平移量（相对图片自身尺寸的归一化比例）。 */
  const [shift, setShift] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    x: number
    y: number
    sx: number
    sy: number
    w: number
    h: number
  } | null>(null)

  useEffect(() => {
    let alive = true
    setUrls({})
    for (const item of items) {
      void resolveRef.current(item)
        .then((url) => {
          if (!alive) return
          setUrls((prev) => ({ ...prev, [item.id]: url }))
        })
        .catch(() => {
          if (!alive) return
          setUrls((prev) => ({ ...prev, [item.id]: undefined }))
        })
    }
    return () => {
      alive = false
    }
  }, [groupKey])

  /** 复位到"适应窗口 + 居中"。 */
  const reset = useCallback((): void => {
    setZoom(1)
    setOrigin({ x: 0.5, y: 0.5 })
    setShift({ x: 0, y: 0 })
  }, [])

  // 换一组图时复位
  useEffect(() => {
    reset()
  }, [groupKey, reset])

  /**
   * 滚轮缩放：以鼠标位置为锚点。
   *
   * 用原生 addEventListener 而不是 React 的 onWheel —— React 把 wheel 委托成 passive，
   * 里面调 preventDefault 无效，整个对比视图会跟着页面一起滚动。
   */
  useEffect(() => {
    const stage = stageRef.current
    if (stage === null) return
    const onWheel = (event: WheelEvent): void => {
      const cell = (event.target as HTMLElement | null)?.closest('[data-cmp-cell]')
      if (cell === null || cell === undefined) return
      const img = cell.querySelector('img')
      if (img === null) return
      event.preventDefault()
      const rect = img.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      // 鼠标点 = 图片内容的哪个归一化位置（变换后的 rect 依然是整张图的范围）
      setOrigin({
        x: clamp01((event.clientX - rect.left) / rect.width),
        y: clamp01((event.clientY - rect.top) / rect.height),
      })
      const factor = event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP
      setZoom((prev) => clampZoom(prev * factor))
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  // Esc 关闭
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  /** 按住在图上拖：放大后才有意义，平移量按**基础尺寸**换算（不含当前 zoom）。 */
  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>): void => {
    if (zoom <= 1) return
    const img = event.currentTarget.querySelector('img')
    if (img === null) return
    const rect = img.getBoundingClientRect()
    // rect 是缩放后的；除掉 zoom 得到"未缩放的基础显示尺寸"，平移比例才对得上
    const width = rect.width / zoom
    const height = rect.height / zoom
    if (width <= 0 || height <= 0) return
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      sx: shift.x,
      sy: shift.y,
      w: width,
      h: height,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [zoom, shift])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === null) return
    setShift({
      x: drag.sx + (event.clientX - drag.x) / drag.w,
      y: drag.sy + (event.clientY - drag.y) / drag.h,
    })
  }, [])

  const endDrag = useCallback((): void => {
    dragRef.current = null
    setDragging(false)
  }, [])

  /** 每张图的事实表（label → value）。 */
  const facts = useMemo(() => items.map((item) => compareFacts(item)), [groupKey])

  /** 只保留至少一张有值的行，避免整张表全是"—"。 */
  const rows = useMemo(() => {
    return ROW_ORDER.filter((label) => facts.some((fact) => fact.has(label)))
  }, [facts])

  const close = useCallback((): void => onClose(), [onClose])

  /** 所有图共用的变换：先缩放（锚点在 origin），再平移（归一化比例 → 百分比）。 */
  const imageStyle: React.CSSProperties = {
    transform: `translate(${shift.x * 100}%, ${shift.y * 100}%) scale(${zoom})`,
    transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`,
  }

  return (
    <div className="dshsg-cmp-mask" onClick={close}>
      <div className="dshsg-cmp" onClick={(event) => event.stopPropagation()}>
        <div className="dshsg-cmp-head">
          <span className="dshsg-cmp-title">并排对比 · {items.length} 张</span>
          <div className="dshsg-cmp-zoom">
            <button title="缩小" onClick={() => setZoom((value) => clampZoom(value / 1.25))}>−</button>
            <span className="dshsg-cmp-pct">{Math.round(zoom * 100)}%</span>
            <button title="放大" onClick={() => setZoom((value) => clampZoom(value * 1.25))}>+</button>
            <button title="复位（双击图片也行）" onClick={reset}>复位</button>
          </div>
          <button className="dshsg-cmp-close" title="关闭（Esc）" onClick={close}>✕</button>
        </div>

        <div
          className="dshsg-cmp-stage"
          ref={stageRef}
          data-dragging={dragging ? 'true' : 'false'}
        >
          {items.map((item, index) => (
            <figure
              className="dshsg-cmp-cell"
              key={item.id}
              data-cmp-cell="true"
              style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onDoubleClick={reset}
            >
              <div className="dshsg-cmp-frame">
                {urls[item.id] === undefined
                  ? <span className="dshsg-cmp-loading">加载中…</span>
                  : (
                    <img
                      src={urls[item.id]}
                      alt={item.name ?? `图 ${index + 1}`}
                      draggable={false}
                      style={imageStyle}
                    />
                  )}
              </div>
              <figcaption className="dshsg-cmp-cap">
                {items.length === 2 ? (index === 0 ? '左图' : '右图') : `图 ${index + 1}`}
                {item.name !== undefined && <span className="dshsg-cmp-name">{item.name}</span>}
              </figcaption>
            </figure>
          ))}
        </div>

        {rows.length > 0 && (
          <div className="dshsg-cmp-table-wrap">
            <table className="dshsg-cmp-table">
              <tbody>
                {rows.map((label) => (
                  <tr key={label}>
                    <th>{label}</th>
                    {facts.map((fact, index) => (
                      <td key={items[index]?.id ?? index}>{fact.get(label) ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
