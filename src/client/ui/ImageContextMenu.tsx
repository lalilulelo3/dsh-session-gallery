/**
 * 缩略图的右键菜单。
 *
 * 为什么需要：把图放进输入框原本要先在角落勾选、再跑到顶部点「放入对话」——
 * 两次精准定位。右键一次，菜单就在鼠标旁边，还顺带放下了大图/工作台/打开文件夹/删除。
 *
 * 定位用 `position: fixed` + 视口坐标，靠近边缘时自动往回让，避免出屏。
 */
import { useEffect } from 'react'

export interface ContextMenuItem {
  label: string
  onSelect(): void
  /** 危险动作（删除）用红色 */
  tone?: 'danger'
}

export interface ImageContextMenuProps {
  /** 视口坐标（clientX / clientY） */
  x: number
  y: number
  items: readonly ContextMenuItem[]
  onClose(): void
}

const MENU_WIDTH = 172
/** 每项大致高度，用于估算是否要向上翻 */
const ITEM_HEIGHT = 34

export function ImageContextMenu(props: ImageContextMenuProps): JSX.Element {
  const { x, y, items, onClose } = props

  // 点空白、滚动、Esc 都关掉
  useEffect(() => {
    const close = (): void => onClose()
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const left = Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8))
  const estimated = items.length * ITEM_HEIGHT + 12
  const top = y + estimated > window.innerHeight
    ? Math.max(8, y - estimated)
    : y

  return (
    <div
      className="dshsg-ctx"
      style={{ left, top, width: MENU_WIDTH }}
      onMouseDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          className="dshsg-ctx-item"
          data-tone={item.tone ?? ''}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
        >{item.label}</button>
      ))}
    </div>
  )
}
