/**
 * 设置面板（覆盖层）：图片库路径、旧图目录、自动归档开关与范围。
 *
 * 数据来自 `GET/POST /plugins/dsh-session-gallery/settings`。
 * 变更根目录不会自动迁移旧图——这是有意为之（移动用户文件风险高），面板里明确提示。
 */
import { useCallback, useEffect, useState } from 'react'
import { formatBytes } from '../data/session-images'

const SETTINGS_ROUTE = '/plugins/dsh-session-gallery/settings'
const CACHE_ROUTE = '/plugins/dsh-session-gallery/workbench-cache'
const GEN_CACHE_ROUTE = '/plugins/dsh-session-gallery/gen-cache'
const GEN_CONFIG_ROUTE = '/plugins/dsh-session-gallery/gen-config'
const GEN_PROBE_ROUTE = '/plugins/dsh-session-gallery/gen-probe'

/**
 * 出图配置（存在宿主侧的 gen-config.json 里）。
 *
 * 只有 `defaultModel`，没有「可用模型清单」：插件面向所有用户，
 * 多数人不会装「提示词优化」那类技能，只会说「画只猫」。
 * 所以契约是——AI 传了 model 就用传的，没传就用这里的默认模型。
 * 白名单会挡住技能推荐的模型，已废弃。
 */
interface GenConfig {
  baseURL: string
  protocol: 'apimart-async' | 'openai-compat'
  proxy: string
  credentialKey: string
  defaultModel: string
  hasKey?: boolean
}

const GEN_DEFAULT: GenConfig = {
  baseURL: '',
  protocol: 'apimart-async',
  /** 留空：不替使用者预设代理端口和凭据名，需要时自己填。 */
  proxy: '',
  credentialKey: '',
  defaultModel: '',
}

interface SettingsPayload {
  root: string
  legacyRoots: string[]
  /** 工作台导出图（标注图/蒙版图）保留天数，0 = 不自动清理。 */
  workbenchRetentionDays: number
  /** 脚本出图暂存目录保留天数，0 = 不自动清理。 */
  genRetentionDays: number
  /** 与 AI 参考库站点共用同一个素材库目录（打开后才发 `G-` 编号）。 */
  shareWithSite: boolean
}

export interface SettingsPanelProps {
  onClose(): void
  onFlash(message: string): void
  onSaved(): void
}

const DEFAULT: SettingsPayload = {
  root: '',
  legacyRoots: [],
  workbenchRetentionDays: 3,
  genRetentionDays: 7,
  shareWithSite: false,
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  const { onClose, onFlash, onSaved } = props
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SettingsPayload>(DEFAULT)
  const [legacyText, setLegacyText] = useState('')
  const [error, setError] = useState<string | null>(null)
  /** 工作台缓存占用（标注图/蒙版图）。 */
  const [cache, setCache] = useState<{ files: number, bytes: number } | null>(null)
  const [cacheBusy, setCacheBusy] = useState(false)
  /** 脚本出图暂存目录的占用。 */
  const [genCache, setGenCache] = useState<{ files: number, bytes: number } | null>(null)
  /** 出图配置。 */
  const [gen, setGen] = useState<GenConfig>({ ...GEN_DEFAULT })
  /** API Key 输入框：不回显已存的 key，填了才覆盖。 */
  const [genKey, setGenKey] = useState('')
  const [probing, setProbing] = useState(false)
  const [probeMessage, setProbeMessage] = useState('')
  const [probeOk, setProbeOk] = useState<boolean | null>(null)
  /** 检测到的候选模型（还没加进清单的）。 */
  const [candidates, setCandidates] = useState<string[]>([])

  const refreshGenCache = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(GEN_CACHE_ROUTE, { credentials: 'same-origin' })
      if (!response.ok) return
      const payload = (await response.json()) as { files?: unknown, bytes?: unknown }
      setGenCache({
        files: typeof payload.files === 'number' ? payload.files : 0,
        bytes: typeof payload.bytes === 'number' ? payload.bytes : 0,
      })
    } catch {
      setGenCache(null)
    }
  }, [])

  const sweepGenCache = useCallback(async (clear: boolean): Promise<void> => {
    if (cacheBusy) return
    setCacheBusy(true)
    try {
      const response = await fetch(GEN_CACHE_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(clear ? { clear: true } : {}),
      })
      if (!response.ok) {
        onFlash(`清理失败：HTTP ${response.status}`)
        return
      }
      const payload = (await response.json()) as { removed?: unknown }
      const removed = typeof payload.removed === 'number' ? payload.removed : 0
      onFlash(clear ? `已清空出图暂存（${removed} 个文件）` : `已清理过期文件（${removed} 个）`)
      await refreshGenCache()
    } catch (cause) {
      onFlash(`清理失败：${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setCacheBusy(false)
    }
  }, [cacheBusy, onFlash, refreshGenCache])

  const refreshCache = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(CACHE_ROUTE, { credentials: 'same-origin' })
      if (!response.ok) return
      const payload = (await response.json()) as { files?: unknown, bytes?: unknown }
      setCache({
        files: typeof payload.files === 'number' ? payload.files : 0,
        bytes: typeof payload.bytes === 'number' ? payload.bytes : 0,
      })
    } catch {
      setCache(null)
    }
  }, [])

  const sweepCache = useCallback(async (clear: boolean): Promise<void> => {
    if (cacheBusy) return
    setCacheBusy(true)
    try {
      const response = await fetch(CACHE_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(clear ? { clear: true } : {}),
      })
      if (!response.ok) {
        onFlash(`清理失败：HTTP ${response.status}`)
        return
      }
      const payload = (await response.json()) as { removed?: unknown }
      const removed = typeof payload.removed === 'number' ? payload.removed : 0
      onFlash(clear ? `已清空工作台缓存（${removed} 个文件）` : `已清理过期文件（${removed} 个）`)
      await refreshCache()
    } catch (cause) {
      onFlash(`清理失败：${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setCacheBusy(false)
    }
  }, [cacheBusy, onFlash, refreshCache])

  /** 读出图配置。 */
  const loadGenConfig = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(GEN_CONFIG_ROUTE, { credentials: 'same-origin' })
      if (!response.ok) return
      const data = (await response.json()) as Partial<GenConfig>
      setGen({
        baseURL: typeof data.baseURL === 'string' ? data.baseURL : '',
        protocol: data.protocol === 'openai-compat' ? 'openai-compat' : 'apimart-async',
        proxy: typeof data.proxy === 'string' ? data.proxy : GEN_DEFAULT.proxy,
        credentialKey: typeof data.credentialKey === 'string' && data.credentialKey !== ''
          ? data.credentialKey
          : GEN_DEFAULT.credentialKey,
        defaultModel: typeof data.defaultModel === 'string' ? data.defaultModel : '',
        hasKey: data.hasKey === true,
      })
    } catch {
      // 读不到就保持默认
    }
  }, [])

  /** 检测中转站：拉模型列表 + 判断协议。不花钱。 */
  const probe = useCallback(async (): Promise<void> => {
    if (probing) return
    setProbing(true)
    setProbeMessage('')
    setProbeOk(null)
    try {
      const response = await fetch(GEN_PROBE_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          baseURL: gen.baseURL,
          apiKey: genKey,
          proxy: gen.proxy,
          credentialKey: gen.credentialKey,
        }),
      })
      const data = (await response.json()) as {
        ok?: unknown
        message?: unknown
        models?: unknown
        protocol?: unknown
      }
      if (data.ok === true) {
        setProbeOk(true)
        setProbeMessage(typeof data.message === 'string' ? data.message : '连接正常')
        const list = Array.isArray(data.models)
          ? data.models.filter((m): m is string => typeof m === 'string')
          : []
        setCandidates(list)
        setGen((prev) => ({
          ...prev,
          protocol: data.protocol === 'openai-compat' ? 'openai-compat' : 'apimart-async',
          // 还没选默认模型时，先拿第一个候选顶上。
          // 没有默认模型的后果很具体：没装「提示词优化」技能的用户说「画只猫」，
          // AI 不知道该用哪个模型，出图会直接报错。
          defaultModel: prev.defaultModel === '' ? (list[0] ?? '') : prev.defaultModel,
        }))
      } else {
        setProbeOk(false)
        setProbeMessage(typeof data.message === 'string' ? data.message : '检测失败')
      }
    } catch (cause) {
      setProbeOk(false)
      setProbeMessage(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setProbing(false)
    }
  }, [gen.baseURL, gen.credentialKey, gen.proxy, genKey, probing])

  /** 选定默认模型（AI 不指定模型时用它）。 */
  const setDefaultModel = useCallback((id: string) => {
    setGen((prev) => ({ ...prev, defaultModel: id }))
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch(SETTINGS_ROUTE, { credentials: 'same-origin' })
        const payload = (await response.json()) as Partial<SettingsPayload> & { error?: unknown }
        if (!response.ok) {
          if (alive) setError(String(payload.error ?? response.status))
          return
        }
        if (!alive) return
        const next: SettingsPayload = {
          root: typeof payload.root === 'string' ? payload.root : DEFAULT.root,
          legacyRoots: Array.isArray(payload.legacyRoots)
            ? payload.legacyRoots.filter((p): p is string => typeof p === 'string')
            : [],
          workbenchRetentionDays: typeof payload.workbenchRetentionDays === 'number'
            ? payload.workbenchRetentionDays
            : DEFAULT.workbenchRetentionDays,
          genRetentionDays: typeof payload.genRetentionDays === 'number'
            ? payload.genRetentionDays
            : DEFAULT.genRetentionDays,
          shareWithSite: payload.shareWithSite === true,
        }
        setForm(next)
        setLegacyText(next.legacyRoots.join('\n'))
        void refreshCache()
        void refreshGenCache()
        void loadGenConfig()
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const save = useCallback(async (): Promise<void> => {
    if (saving) return
    setSaving(true)
    try {
      const legacyRoots = legacyText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
      const response = await fetch(SETTINGS_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, legacyRoots }),
      })
      const text = await response.text()
      let payload: { error?: unknown } = {}
      try {
        payload = JSON.parse(text) as { error?: unknown }
      } catch {
        onFlash(`保存失败：HTTP ${response.status}（响应为空，可能未重启）`)
        return
      }
      if (!response.ok) {
        onFlash(`保存失败：${String(payload.error ?? response.status)}`)
        return
      }

      // 出图配置是另一个文件，单独存
      const genResponse = await fetch(GEN_CONFIG_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...gen, apiKey: genKey }),
      })
      if (!genResponse.ok) {
        onFlash('图片库设置已保存，但出图配置没存上（宿主可能还是旧版本）')
        return
      }

      onFlash('设置已保存')
      onSaved()
      onClose()
    } catch (cause) {
      onFlash(`保存失败：${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setSaving(false)
    }
  }, [form, legacyText, onClose, onFlash, onSaved, saving])

  return (
    <div className="dshsg-settings-page">
      <div className="dshsg-settings-head">
        <button className="dshsg-settings-back" onClick={onClose} title="返回图库">← 返回</button>
        <span className="dshsg-settings-title">图片库设置</span>
      </div>
      <div className="dshsg-settings-scroll">
        {loading && <div className="dshsg-confirm-hint">正在读取设置…</div>}
        {!loading && error !== null && <div className="dshsg-confirm-hint">读取失败：{error}</div>}

        {!loading && error === null && (
          <>
            <h3 className="dshsg-settings-section">图片库</h3>
            <label className="dshsg-settings-label">图片库根目录</label>
            <input
              className="dshsg-settings-input"
              value={form.root}
              // 必须先把值取出来再 setState：函数式更新是**稍后**执行的，
              // 那时 React 已经把事件的 currentTarget 清成 null，
              // 在 updater 里读 e.currentTarget.value 会抛
              // "Cannot read properties of null (reading 'value')" → 整个面板白屏。
              onChange={(e) => {
                const value = e.currentTarget.value
                setForm((prev) => ({ ...prev, root: value }))
              }}
              placeholder="例如 C:\Users\你\Pictures\DSH图片库"
            />
            <div className="dshsg-settings-hint">
              改成新目录不会自动移动已有图片；旧图可以把原目录加到下面「旧图目录」里继续显示。
            </div>

            <label className="dshsg-settings-label">旧图目录（每行一个，可留空）</label>
            <textarea
              className="dshsg-settings-input dshsg-settings-textarea"
              value={legacyText}
              onChange={(e) => setLegacyText(e.currentTarget.value)}
              placeholder={'例如 C:\\Users\\你\\Desktop\\DSH\\...\\生成图'}
              rows={3}
            />

            <label className="dshsg-settings-check" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={form.shareWithSite}
                onChange={(e) => {
                  const value = e.currentTarget.checked
                  setForm((prev) => ({ ...prev, shareWithSite: value }))
                }}
              />
              与 AI 参考库站点共用这个目录
            </label>
            <div className="dshsg-settings-hint">
              打开后，出图落盘会给每张图发一个 <code>G-</code> 编号（站点那边用 <code>U-</code>，
              两套号不冲突），sidecar 也会按「两个前端共写一份」的方式合并保存，
              不会抹掉站点写的分组和标签。单机用插件建议关着——编号用不上，还会让每次出图多扫一遍库。
            </div>

            <h3 className="dshsg-settings-section">归档规则</h3>
            <div className="dshsg-settings-hint" style={{ marginTop: 0 }}>
              会话里出现的图会先进「未归档」区，由你自己决定存不存 —— 插件不会替你做主。
              出图工具产出的图例外：它们直接进图片库，不经过未归档。
            </div>

            <label className="dshsg-settings-label">未归档区</label>
            <button
              className="dshsg-chip"
              onClick={() => {
                try {
                  localStorage.removeItem('dshsg:pending-ignored:v1')
                } catch {
                  // 忽略
                }
                onFlash('已清空「忽略」记录，被忽略的图会重新出现')
                onSaved()
              }}
            >清空「忽略」记录</button>
            <div className="dshsg-settings-hint">
              在未归档图的大图查看器里点「忽略此图」会把那张隐藏；这里可以一次全部恢复。
            </div>

            <h3 className="dshsg-settings-section">出图</h3>
            <div className="dshsg-settings-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              填中转站和 Key → 点「检测」自动识别协议与可用模型。配好后<b>任何会话</b>都能直接让 AI 出图，
              图会自动进图片库，不需要写脚本、也不用手动告诉它路径。
            </div>

            <label className="dshsg-settings-label">中转站地址</label>
            <input
              className="dshsg-settings-input"
              value={gen.baseURL}
              onChange={(e) => {
                const value = e.currentTarget.value
                setGen((prev) => ({ ...prev, baseURL: value }))
              }}
              placeholder="https://api.apimart.ai"
            />

            <label className="dshsg-settings-label">API Key</label>
            <input
              className="dshsg-settings-input"
              type="password"
              value={genKey}
              onChange={(e) => setGenKey(e.currentTarget.value)}
              placeholder={gen.hasKey === true ? '已保存 · 留空表示不修改' : 'sk-...'}
            />
            <div className="dshsg-settings-hint">
              存在 <code>~/.dsh/.credentials.yaml</code> 的 <code>{gen.credentialKey}</code> 下，不会写进插件配置。
            </div>

            <label className="dshsg-settings-label">代理（可留空）</label>
            <input
              className="dshsg-settings-input"
              value={gen.proxy}
              onChange={(e) => {
                const value = e.currentTarget.value
                setGen((prev) => ({ ...prev, proxy: value }))
              }}
              placeholder="http://127.0.0.1:7897"
            />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
              <button
                className="dshsg-action"
                disabled={probing || gen.baseURL.trim() === ''}
                onClick={() => { void probe() }}
              >
                {probing ? '检测中…' : '检测'}
              </button>
              <span
                className="dshsg-settings-hint"
                style={{
                  marginTop: 0,
                  color: probeOk === false ? '#ef7f74' : (probeOk === true ? '#6fbf73' : undefined),
                }}
              >
                {probeMessage}
              </span>
            </div>

            <label className="dshsg-settings-label" style={{ marginTop: 14 }}>
              默认模型
            </label>
            <div className="dshsg-settings-hint" style={{ marginBottom: 6 }}>
              用户说「画张图」而没指定模型时，AI 用这个。
              装了提示词类技能的话，技能会直接指定模型，这里只当兜底。
            </div>
            <input
              className="dshsg-settings-input"
              value={gen.defaultModel}
              placeholder="如 gpt-image-2；也可以先点上面的「检测」，再从下面挑"
              onChange={(e) => setDefaultModel(e.currentTarget.value)}
            />

            {candidates.length > 0 && (
              <div className="dshsg-gen-models" style={{ marginTop: 8 }}>
                {candidates.map((id) => (
                  <label
                    key={id}
                    className="dshsg-gen-model"
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="dshsg-settings-check" style={{ flex: '0 0 auto' }}>
                      <input
                        type="radio"
                        name="dshsg-gen-default-model"
                        checked={gen.defaultModel === id}
                        onChange={() => setDefaultModel(id)}
                      />
                    </span>
                    <span className="dshsg-gen-model-id" title={id}>{id}</span>
                  </label>
                ))}
              </div>
            )}

            <h3 className="dshsg-settings-section">缓存与清理</h3>
            <label className="dshsg-settings-label">工作台导出缓存</label>
            <div className="dshsg-settings-hint" style={{ marginBottom: 8 }}>
              每次点「生成改图请求」都会在图片库的 <code>.workbench</code> 目录里存一张标注图和一张蒙版图，
              交给后续改图使用。当前占用：
              <b style={{ marginLeft: 4 }}>
                {cache === null ? '—' : `${cache.files} 个文件 · ${formatBytes(cache.bytes)}`}
              </b>
            </div>
            <label className="dshsg-settings-check">
              自动清理超过
              <input
                className="dshsg-settings-input"
                style={{ display: 'inline-block', width: 56, margin: '0 6px', padding: '2px 6px' }}
                type="number"
                min={0}
                value={form.workbenchRetentionDays}
                onChange={(e) => {
                  const value = Math.max(0, Math.round(Number(e.currentTarget.value) || 0))
                  setForm((prev) => ({ ...prev, workbenchRetentionDays: value }))
                }}
              />
              天的文件
            </label>
            <div className="dshsg-settings-hint">
              「0」表示不自动清理。保存新文件时会顺手清理过期的；改完天数要点下方「保存」才生效。
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="dshsg-chip" disabled={cacheBusy} onClick={() => { void sweepCache(false) }}>
                清理过期
              </button>
              <button className="dshsg-chip dshsg-action-danger" disabled={cacheBusy} onClick={() => { void sweepCache(true) }}>
                清空全部
              </button>
              <button className="dshsg-chip" disabled={cacheBusy} onClick={() => { void refreshCache() }}>
                刷新占用
              </button>
            </div>

            <label className="dshsg-settings-label">出图暂存（旧脚本产出的图）</label>
            <div className="dshsg-settings-hint" style={{ marginBottom: 8 }}>
              只有在用外部脚本出图（`--no-archive`）时才会有东西落在
              <code> ~/.dsh/cache/session-gallery/gen </code>
              这里。走插件的「出图」功能时，图直接进图片库，不经过这里。
              当前占用：
              <b style={{ marginLeft: 4 }}>
                {genCache === null ? '—' : `${genCache.files} 个文件 · ${formatBytes(genCache.bytes)}`}
              </b>
            </div>
            <label className="dshsg-settings-check">
              自动清理超过
              <input
                className="dshsg-settings-input"
                style={{ display: 'inline-block', width: 56, margin: '0 6px', padding: '2px 6px' }}
                type="number"
                min={0}
                value={form.genRetentionDays}
                onChange={(e) => {
                  const value = Math.max(0, Math.round(Number(e.currentTarget.value) || 0))
                  setForm((prev) => ({ ...prev, genRetentionDays: value }))
                }}
              />
              天的文件
            </label>
            <div className="dshsg-settings-hint">
              图进过会话后 DSH 另有副本，删这里不影响会话里那张图；只是「未归档期复制提示词」会少一份 sidecar。
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="dshsg-chip" disabled={cacheBusy} onClick={() => { void sweepGenCache(false) }}>
                清理过期
              </button>
              <button className="dshsg-chip dshsg-action-danger" disabled={cacheBusy} onClick={() => { void sweepGenCache(true) }}>
                清空全部
              </button>
              <button className="dshsg-chip" disabled={cacheBusy} onClick={() => { void refreshGenCache() }}>
                刷新占用
              </button>
            </div>
          </>
        )}

        <div className="dshsg-settings-actions">
          <button className="dshsg-action dshsg-action-ghost" onClick={onClose}>取消</button>
          <button className="dshsg-action" disabled={saving || loading} onClick={() => { void save() }}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
