/**
 * 删除确认层 —— 三个入口共用一份（会话图片勾选、未归档勾选、图片库勾选、大图右浮条）。
 *
 * 为什么抽出来：之前只有图片库那边有确认框，其它入口点「删除」直接执行，
 * 而且图片库那个还把 `permanent` 写死成 false（勾了也没用）。统一到一处，文案和行为才不会再分叉。
 */
import { useState } from 'react'

export interface ConfirmDeleteProps {
  /** 要删的文件名，只用于展示（最多列 6 个） */
  names: readonly string[]
  onCancel(): void
  onConfirm(permanent: boolean): void
}

export function ConfirmDelete(props: ConfirmDeleteProps): JSX.Element {
  const { names, onCancel, onConfirm } = props
  const [permanent, setPermanent] = useState(false)
  const count = names.length

  return (
    <div
      className="dshsg-confirm-backdrop"
      onClick={onCancel}
    >
      <div className="dshsg-confirm" onClick={(event) => event.stopPropagation()}>
        <div className="dshsg-confirm-title">
          {count === 1
            ? (permanent ? '永久删除这张图？' : '删除这张图？')
            : (permanent ? `永久删除 ${count} 张图片？` : `删除 ${count} 张图片？`)}
        </div>
        <ul className="dshsg-confirm-list">
          {names.slice(0, 6).map((name, index) => (
            <li key={`${name}-${index}`} title={name}>{name}</li>
          ))}
          {count > 6 && <li>…… 另有 {count - 6} 张</li>}
        </ul>
        <label className="dshsg-confirm-check">
          <input
            type="checkbox"
            checked={permanent}
            onChange={(event) => setPermanent(event.currentTarget.checked)}
          />
          永久删除（不可恢复）
        </label>
        <div className="dshsg-confirm-hint">
          {permanent
            ? '这些文件会被直接从磁盘删除，无法恢复。'
            : '默认送进 Windows 回收站，可以在系统回收站里找回。'}
        </div>
        <div className="dshsg-confirm-actions">
          <button
            className="dshsg-action dshsg-action-ghost"
            onClick={onCancel}
          >取消</button>
          <button
            className="dshsg-action dshsg-action-danger"
            onClick={() => onConfirm(permanent)}
          >删除</button>
        </div>
      </div>
    </div>
  )
}
