/**
 * 出图日志面板（替换图片库视图，侧栏内联）。
 *
 * 数据来自 `GET /plugins/dsh-session-gallery/gen-logs`：
 * 每次 `generate_image` 任务一条，含请求 / 提交响应 / 轮询轨迹 / 结果 / 错误原文。
 * 只记录**插件内出图**，不记录你发的截图之类。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

const LOGS_ROUTE = '/plugins/dsh-session-gallery/gen-logs'

interface LogPoll {
  at: string
  status: string
  progress?: number
  repeat?: number
  httpStatus?: number
}

interface LogChild {
  index: number
  status: string
  taskId?: string
  submitHttpStatus?: number
  submitRaw?: string
  failRaw?: string
  polls?: LogPoll[]
  costUsd?: number
  urls?: string[]
  error?: string
}

interface LogRecord {
  id: string
  startedAt: string
  finishedAt?: string
  elapsedMs?: number
  status: 'running' | 'completed' | 'partial' | 'failed'
  source?: string
  machine?: string
  sessionId?: string
  request: {
    baseURL?: string
    protocol?: string
    prompt?: string
    model?: string
    size?: string
    resolution?: string
    quality?: string
    n?: number
    references?: { name: string, bytes: number }[]
    extra?: Record<string, unknown>
  }
  children?: LogChild[]
  result?: {
    dir?: string
    files?: { hash: string, width: number, height: number, bytes: number, costUsd?: number }[]
    costUsd?: number
  }
  failures?: string[]
  error?: string
}

export interface GenLogPanelProps {
  onClose(): void
  onFlash(message: string): void
}

/** 状态 → 图标 + 颜色。 */
function statusOf(record: LogRecord): { icon: string, tone: string, text: string } {
  if (record.status === 'completed') return { icon: '✓', tone: 'ok', text: '成功' }
  if (record.status === 'partial') return { icon: '!', tone: 'warn', text: '部分失败' }
  if (record.status === 'running') return { icon: '…', tone: 'muted', text: '进行中' }
  return { icon: '✗', tone: 'bad', text: '失败' }
}

function formatTime(iso: string | undefined): string {
  if (iso === undefined) return ''
  return iso.replace('T', ' ').slice(5, 19)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function shortError(record: LogRecord): string {
  if (record.error !== undefined && record.error !== '') return record.error
  const first = record.failures?.[0]
  return first ?? ''
}

export function GenLogPanel(props: GenLogPanelProps): JSX.Element {
  const { onClose, onFlash } = props
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<LogRecord[]>([])
  const [stats, setStats] = useState<{ days: number, bytes: number, records: number, dir?: string }>(
    { days: 0, bytes: 0, records: 0 },
  )
  const [onlyFailed, setOnlyFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setLoading(true)
    try {
      const response = await fetch(LOGS_ROUTE, { credentials: 'same-origin' })
      const payload = (await response.json()) as {
        records?: LogRecord[]
        stats?: { days?: number, bytes?: number, records?: number, dir?: string }
        error?: unknown
      }
      if (!response.ok) {
        setError(String(payload.error ?? response.status))
        return
      }
      setRecords(Array.isArray(payload.records) ? payload.records : [])
      setStats({
        days: payload.stats?.days ?? 0,
        bytes: payload.stats?.bytes ?? 0,
        records: payload.stats?.records ?? 0,
        ...(typeof payload.stats?.dir === 'string' ? { dir: payload.stats.dir } : {}),
      })
      setError(null)
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return records.filter((record) => {
      if (onlyFailed && record.status !== 'failed' && record.status !== 'partial') return false
      if (keyword === '') return true
      const haystack = [
        record.request?.prompt ?? '',
        record.request?.model ?? '',
        record.error ?? '',
        ...(record.failures ?? []),
      ].join('\n').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [onlyFailed, query, records])

  const selected = useMemo(
    () => filtered.find((record) => record.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  )

  const clearAll = useCallback(async (): Promise<void> => {
    if (!window.confirm('清空全部出图日志？此操作不可恢复。')) return
    try {
      const response = await fetch(LOGS_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      const payload = (await response.json()) as { removed?: unknown, error?: unknown }
      if (!response.ok) {
        onFlash(`清空失败：${String(payload.error ?? response.status)}`)
        return
      }
      onFlash(`已清空 ${payload.removed ?? 0} 个日志文件`)
      setSelectedId(null)
      void load()
    } catch (cause) {
      onFlash(`清空失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }, [load, onFlash])

  const copyJson = useCallback((record: LogRecord) => {
    void navigator.clipboard.writeText(JSON.stringify(record, null, 2)).then(
      () => onFlash('已复制这条任务 JSON'),
      () => onFlash('复制失败'),
    )
  }, [onFlash])

  return (
    <div className="dshsg-genlog">
      <div className="dshsg-genlog-head">
        <button className="dshsg-settings-back" onClick={onClose}>← 返回</button>
        <span className="dshsg-genlog-title">出图日志</span>
        <span className="dshsg-genlog-stats">
          {stats.records} 条 · {stats.days} 天 · {formatBytes(stats.bytes)}
        </span>
        {stats.dir !== undefined && (
          <button
            className="dshsg-genlog-dir"
            title={`日志目录（点击复制）：${stats.dir}`}
            onClick={() => {
              void navigator.clipboard.writeText(stats.dir ?? '').then(
                () => onFlash('已复制日志目录路径'),
                () => onFlash('复制失败'),
              )
            }}
          >{stats.dir}</button>
        )}
        <button className="dshsg-chip" onClick={() => { void load() }}>刷新</button>
        <button className="dshsg-chip" onClick={() => { void clearAll() }}>清空</button>
      </div>

      <div className="dshsg-genlog-filter">
        <button
          className="dshsg-chip"
          data-on={onlyFailed ? 'true' : 'false'}
          onClick={() => setOnlyFailed((value) => !value)}
        >仅失败</button>
        <input
          className="dshsg-search"
          placeholder="搜索 prompt / 模型 / 错误"
          value={query}
          onChange={(e) => {
            const value = e.currentTarget.value
            setQuery(value)
          }}
        />
      </div>

      {loading && <div className="dshsg-empty">正在读取日志…</div>}
      {!loading && error !== null && <div className="dshsg-empty">读取失败：{error}</div>}
      {!loading && error === null && filtered.length === 0 && (
        <div className="dshsg-empty">
          <strong>还没有出图日志</strong>
          <span>用「出图」工具生成图片后，这里会记录每次任务的完整过程。</span>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="dshsg-genlog-body">
          <div className="dshsg-genlog-list">
            {filtered.map((record) => {
              const status = statusOf(record)
              const params = [record.request?.size, record.request?.resolution, record.request?.quality]
                .filter((value): value is string => typeof value === 'string' && value !== '')
              return (
                <button
                  key={record.id}
                  className="dshsg-genlog-row"
                  data-active={selected?.id === record.id ? 'true' : 'false'}
                  onClick={() => setSelectedId(record.id)}
                >
                  <span className={`dshsg-genlog-icon dshsg-tone-${status.tone}`}>{status.icon}</span>
                  <span className="dshsg-genlog-row-main">
                    <span className="dshsg-genlog-row-title">
                      {formatTime(record.startedAt)} · {record.request?.model ?? '?'}
                      {params.length > 0 ? ` · ${params.join(' / ')}` : ''}
                    </span>
                    <span className="dshsg-genlog-row-sub">
                      {status.text}
                      {record.elapsedMs !== undefined ? ` · ${(record.elapsedMs / 1000).toFixed(1)}s` : ''}
                      {record.result?.costUsd !== undefined ? ` · $${record.result.costUsd.toFixed(4)}` : ''}
                      {shortError(record) !== '' ? ` · ${shortError(record).slice(0, 60)}` : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {selected !== undefined && (
            <div className="dshsg-genlog-detail">
              <div className="dshsg-genlog-detail-head">
                <b>{statusOf(selected).text}</b>
                <button className="dshsg-chip" onClick={() => copyJson(selected)}>复制 JSON</button>
              </div>

              <div className="dshsg-genlog-kv">
                <span><i>开始</i>{formatTime(selected.startedAt)}</span>
                {selected.elapsedMs !== undefined && <span><i>耗时</i>{(selected.elapsedMs / 1000).toFixed(1)}s</span>}
                <span><i>模型</i>{selected.request?.model ?? '-'}</span>
                {selected.request?.size !== undefined && <span><i>比例</i>{selected.request.size}</span>}
                {selected.request?.resolution !== undefined && <span><i>分辨率</i>{selected.request.resolution}</span>}
                {selected.request?.quality !== undefined && <span><i>质量</i>{selected.request.quality}</span>}
                {selected.request?.n !== undefined && <span><i>张数</i>{selected.request.n}</span>}
                {selected.request?.protocol !== undefined && <span><i>协议</i>{selected.request.protocol}</span>}
                {selected.request?.baseURL !== undefined && <span><i>中转站</i>{selected.request.baseURL}</span>}
                {selected.result?.costUsd !== undefined && <span><i>成本</i>${selected.result.costUsd.toFixed(4)}</span>}
                {selected.machine !== undefined && <span><i>机器</i>{selected.machine}</span>}
                {selected.source !== undefined && (<span><i>来源</i>{selected.source === 'sidecar' ? '历史反推（sidecar）' : selected.source === 'apimart' ? '历史反推（任务接口）' : '运行记录'}</span>)}
                {selected.sessionId !== undefined && <span><i>会话</i>{selected.sessionId.slice(0, 18)}…</span>}
              </div>

              {selected.request?.prompt !== undefined && (
                <div className="dshsg-genlog-block">
                  <div className="dshsg-genlog-block-title">提示词</div>
                  <div className="dshsg-genlog-prompt">{selected.request.prompt}</div>
                </div>
              )}

              {selected.request?.references !== undefined && selected.request.references.length > 0 && (
                <div className="dshsg-genlog-block">
                  <div className="dshsg-genlog-block-title">参考图（{selected.request.references.length} 张）</div>
                  <div className="dshsg-genlog-list-inline">
                    {selected.request.references.map((ref, index) => (
                      <span key={`${ref.name}-${index}`}>{ref.name}（{formatBytes(ref.bytes)}）</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.error !== undefined && selected.error !== '' && (
                <div className="dshsg-genlog-block">
                  <div className="dshsg-genlog-block-title">错误</div>
                  <div className="dshsg-genlog-error">{selected.error}</div>
                </div>
              )}

              {selected.result?.files !== undefined && selected.result.files.length > 0 && (
                <div className="dshsg-genlog-block">
                  <div className="dshsg-genlog-block-title">产物（{selected.result.files.length} 张）</div>
                  <div className="dshsg-genlog-list-inline">
                    {selected.result.files.map((file) => (
                      <span key={file.hash}>{file.hash} · {file.width}×{file.height} · {formatBytes(file.bytes)}</span>
                    ))}
                  </div>
                </div>
              )}

              {(selected.children ?? []).map((child) => (
                <div key={child.index} className="dshsg-genlog-block">
                  <div className="dshsg-genlog-block-title">
                    子任务 #{child.index + 1} · {child.status}
                    {child.taskId !== undefined ? ` · ${child.taskId}` : ''}
                  </div>
                  {child.submitHttpStatus !== undefined && (
                    <div className="dshsg-genlog-mono">提交 HTTP {child.submitHttpStatus}</div>
                  )}
                  {child.submitRaw !== undefined && (
                    <div className="dshsg-genlog-mono">提交：{child.submitRaw}</div>
                  )}
                  {child.failRaw !== undefined && (
                    <div className="dshsg-genlog-mono">失败响应：{child.failRaw}</div>
                  )}
                  {child.polls !== undefined && child.polls.length > 0 && (
                    <div className="dshsg-genlog-mono">
                      {child.polls.map((poll, pollIndex) => (
                        <div key={pollIndex}>
                          {formatTime(poll.at)} · {poll.status}
                          {poll.progress !== undefined ? ` ${poll.progress}%` : ''}
                          {(poll.repeat ?? 1) > 1 ? ` ×${poll.repeat}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                  {child.error !== undefined && <div className="dshsg-genlog-error">{child.error}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
