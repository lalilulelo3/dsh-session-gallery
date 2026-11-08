/**
 * 宿主半侧：把会话图片附件导出成短名字文件，返回真实路径与短名。
 *
 * 为什么需要它：会话附件（attachment）是 DSH 附件库里的内容寻址副本，
 * 浏览器侧拿不到磁盘路径；而 DSH 的输入框只接受文本。
 * 所以「放入对话」的做法是——宿主把选中的附件写成普通文件，
 * 客户端再把「短名 + 位置说明」写进输入框，Agent 随后按路径读图。
 *
 * 落点：`<用户主目录>/.dsh/cache/session-gallery/`（不进工作区，避免污染产物目录）。
 * 命名：`图片1.png`、`图片2.png`……；同一张图（内容哈希相同）重复放入时复用同一个文件名，
 * 不会生成重复文件，并回报 `reused: true` 供客户端提示。
 */
import type { Context } from '@deepseek-ai/cordis'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { appendFile, mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { homedir, hostname, tmpdir } from 'node:os'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { zstdDecompressSync } from 'node:zlib'

const execFileP = promisify(execFile)

/** 本机名（出图日志里标记来源机器，方便以后合并两台电脑的记录）。 */
const MACHINE_NAME = hostname()

/** 稳定的 Cordis 插件名。 */
export const name = 'session-gallery'

/** 导出路由。 */
const EXPORT_ROUTE = '/plugins/dsh-session-gallery/export'
/** 清理路由。 */
const CLEAR_ROUTE = '/plugins/dsh-session-gallery/clear-cache'
/** 设置读写路由。 */
const SETTINGS_ROUTE = '/plugins/dsh-session-gallery/settings'
/** 图片库扫描路由。 */
const SCAN_ROUTE = '/plugins/dsh-session-gallery/scan'
/** 图片库图片字节路由。 */
const IMAGE_ROUTE = '/plugins/dsh-session-gallery/image'
/** 删除图片（默认移到回收站目录）路由。 */
const DELETE_ROUTE = '/plugins/dsh-session-gallery/delete'
/** 在系统文件管理器里定位图片的路由。 */
const REVEAL_ROUTE = '/plugins/dsh-session-gallery/reveal'
/** 手动导入路由。 */
const IMPORT_ROUTE = '/plugins/dsh-session-gallery/import'
/** 把会话附件「存入图片库」的路由（C 方案：未归档区一键归档）。 */
const ARCHIVE_ROUTE = '/plugins/dsh-session-gallery/archive'
/** 工作台导出（标注图 / 蒙版图）的保存路由。 */
const WORKBENCH_SAVE_ROUTE = '/plugins/dsh-session-gallery/workbench-save'
/** 工作台导出缓存的统计 / 清理路由。 */
const WORKBENCH_CACHE_ROUTE = '/plugins/dsh-session-gallery/workbench-cache'
/** 脚本出图暂存目录的统计 / 清理路由。 */
const GEN_CACHE_ROUTE = '/plugins/dsh-session-gallery/gen-cache'
/** 出图工具注册状态的诊断路由（排查「AI 看不到 generate_image」时直接访问）。 */
const GEN_DIAG_ROUTE = '/plugins/dsh-session-gallery/gen-diag'
/** 客户端渲染错误上报路由：面板崩溃时把消息写进 boot-diag.log。 */
const CLIENT_LOG_ROUTE = '/plugins/dsh-session-gallery/client-log'
/** 回收站目录名（位于图片库根下，扫描时会被跳过）。 */
const TRASH_DIR_NAME = '.dshsg-trash'
/** 工作台导出的临时图目录（点开头，不参与图片库扫描）。 */
const WORKBENCH_DIR_NAME = '.workbench'
/** 会话图片自动归档子目录名。 */
const SESSION_IMPORT_DIR = '会话导入'
/** 手动导入子目录名。 */
const MANUAL_IMPORT_DIR = '手动导入'

/** 单次请求体上限（只含少量元数据）。 */
const MAX_BODY_BYTES = 256 * 1024

/** 导出目录（不进工作区）。 */
function exportDir(): string {
  return join(homedir(), '.dsh', 'cache', 'session-gallery')
}

/** 索引：内容哈希 → 已分配的短文件名。 */
interface GalleryIndex {
  next: number
  names: Record<string, string>
}

/** 读取索引；损坏或缺失时重置。 */
async function readIndex(dir: string): Promise<GalleryIndex> {
  try {
    const raw = await readFile(join(dir, 'index.json'), 'utf8')
    const parsed = JSON.parse(raw) as Partial<GalleryIndex>
    const names: Record<string, string> = {}
    if (parsed.names !== undefined && typeof parsed.names === 'object') {
      for (const [hash, name] of Object.entries(parsed.names)) {
        if (typeof name === 'string') names[hash] = name
      }
    }
    const next = typeof parsed.next === 'number' && parsed.next > 0 ? parsed.next : 1
    return { next, names }
  } catch {
    return { next: 1, names: {} }
  }
}

/** 写索引（失败不致命）。 */
async function writeIndex(dir: string, index: GalleryIndex): Promise<void> {
  try {
    await writeFile(join(dir, 'index.json'), JSON.stringify(index), 'utf8')
  } catch {
    // 索引写失败时下一次会重新分配名字，不影响图片本身
  }
}

/** 读取请求体（`maxBytes` 默认只有元数据量级；手动导入会放宽）。 */
async function readBody(
  req: { on(event: string, cb: (chunk?: unknown) => void): void },
  maxBytes = MAX_BODY_BYTES,
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk?: unknown) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk ?? ''))
      total += buf.length
      if (total > maxBytes) {
        reject(new Error('body-too-large'))
        return
      }
      chunks.push(buf)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', (err?: unknown) => reject(err instanceof Error ? err : new Error(String(err))))
  })
}

/** 写一个 JSON 响应。 */
function sendJson(res: {
  writeHead(status: number, headers: Record<string, string>): void
  end(body?: string): void
}, status: number, payload: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

/** 同源校验（与官方路由一致的做法）。 */
function sameOrigin(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const origin = req.headers.origin
  const host = req.headers.host
  if (typeof origin !== 'string' || typeof host !== 'string') return true
  return origin === `http://${host}` || origin === `https://${host}`
}

/** 媒体类型 → 扩展名。 */
function extOf(mediaType: string | undefined): string {
  switch (mediaType) {
    case 'image/jpeg': return '.jpg'
    case 'image/webp': return '.webp'
    case 'image/gif': return '.gif'
    case 'image/bmp': return '.bmp'
    case 'image/svg+xml': return '.svg'
    default: return '.png'
  }
}

interface ExportedFile {
  path: string
  fileName: string
  short: string
  reused: boolean
}

/** 处理导出请求。 */
async function handleExport(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
  attachments: {
    readImage(ref: unknown): Promise<{ ref?: { mediaType?: string }, data: Uint8Array }>
  },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: { items?: unknown }
  try {
    body = JSON.parse(await readBody(req)) as { items?: unknown }
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }

  const dir = exportDir()
  try {
    await mkdir(dir, { recursive: true })
  } catch {
    sendJson(res, 500, { error: 'mkdir-failed' })
    return
  }

  const index = await readIndex(dir)
  const items = Array.isArray(body.items) ? body.items : []
  const files: ExportedFile[] = []
  const failures: { name: string, error: string }[] = []

  for (const raw of items) {
    const item = raw as { attachment?: { attachmentId?: unknown, mediaType?: unknown, name?: unknown } } | null
    const attachment = item?.attachment
    if (attachment === undefined || typeof attachment.attachmentId !== 'string') {
      failures.push({ name: 'unknown', error: 'bad-item' })
      continue
    }
    const displayName = typeof attachment.name === 'string' && attachment.name !== ''
      ? attachment.name
      : `image-${attachment.attachmentId.slice(0, 8)}`
    try {
      const stored = await attachments.readImage(attachment)
      const mediaType = stored.ref?.mediaType
        ?? (typeof attachment.mediaType === 'string' ? attachment.mediaType : undefined)
      const data = Buffer.from(stored.data)
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 12)

      const existing = index.names[hash]
      const reused = existing !== undefined
      let fileName: string
      if (existing !== undefined) {
        fileName = existing
      } else {
        fileName = `图片${index.next}${extOf(mediaType)}`
        index.next += 1
        index.names[hash] = fileName
        // 每新增一张就落一次索引，避免中途失败导致名字重复
        await writeIndex(dir, index)
      }
      const filePath = join(dir, fileName)
      if (!reused) await writeFile(filePath, data)
      files.push({
        path: filePath,
        fileName,
        short: fileName.replace(/\.[^.]+$/, ''),
        reused,
      })
    } catch (cause) {
      failures.push({
        name: displayName,
        error: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }

  sendJson(res, 200, { files, failures, dir })
}

/**
 * 宿主半侧插件体：注册导出/扫描/图片路由。
 *
 * **防御性设计（重要）**：任何一步失败都只打日志，绝不让异常冒到宿主启动流程。
 * 之前的版本在路由注册抛错时会连带把 Desktop Host 启动流程打断（表现为
 * 主进程 `authenticateWebHost` 拿不到有效 URL、报 `bad port`）。
 *
 * @param ctx - 宿主根上下文。
 */
/**
 * 从工具调用上下文里取当前会话 id。
 *
 * 别改这里的取值路径：DSH 把会话编号放在 `exec.agent.session.id`
 * （见 `@deepseek-ai/dsh-tools` 的 `defineTool`——它调 `userExecute(args, exec)`，
 * 而框架自己在 PTC 里用的就是 `exec.agent.session.id`）。
 * 早先按 `exec.sessionId` / `exec.agent.sessionId` 取，两层都取不到，
 * 结果是 sidecar 不写 sessionId，图进了图片库却不出现在「会话图片」栏。
 * 后面几种旧写法留着当兜底，DSH 换版本时不至于又静默失效。
 */
function pickSessionId(exec: unknown): string {
  const execLike = exec as
    | {
      sessionId?: unknown
      session?: { id?: unknown }
      agent?: { sessionId?: unknown, session?: { id?: unknown } }
    }
    | undefined
  const candidates = [
    execLike?.agent?.session?.id,
    execLike?.session?.id,
    execLike?.sessionId,
    execLike?.agent?.sessionId,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '') return candidate
  }
  return ''
}

/**
 * `generate_image` 工具的注册状态。
 *
 * 为什么记在内存里而不是只打日志：DSH 桌面版的宿主 stdout 不落盘，
 * `console.log` / `console.warn` 用户根本看不到——上次就是这样：
 * 工具一直没注册上，日志里有 warn，但我们谁都看不见，以为注册成功了。
 * 这里留一份快照，由 GEN_DIAG_ROUTE 暴露，排查时直接访问那个地址即可。
 */
const genToolDiag: {
  at: string | null
  via: 'inject' | 'root' | 'none'
  registered: boolean
  hasToolsService: boolean
  error?: string
} = { at: null, via: 'none', registered: false, hasToolsService: false }

/**
 * 启动诊断日志（自己写文件）。
 *
 * 为什么不打 console：DSH 桌面版的宿主 stdout 不落盘，`console.log` 全进虚空。
 * `generate_image` 前后「修」了两轮都没注册上，就是因为每次都在盲猜。
 * 这里把每一步写进 `~/.dsh/cache/session-gallery/boot-diag.log`，
 * 重启一次就能读出到底卡在哪。
 */
const BOOT_LOG_DIR = join(homedir(), '.dsh', 'cache', 'session-gallery')
const BOOT_LOG_FILE = join(BOOT_LOG_DIR, 'boot-diag.log')

/** 追加一行启动诊断；永远不抛错（诊断不能反过来弄坏插件）。 */
function bootLog(step: string, extra?: unknown): void {
  let suffix = ''
  if (extra !== undefined) {
    try {
      suffix = ` ${JSON.stringify(extra)}`
    } catch {
      suffix = ` ${String(extra)}`
    }
  }
  const line = `${new Date().toISOString()} ${step}${suffix}\n`
  void appendFile(BOOT_LOG_FILE, line, 'utf8').catch(() => {
    void mkdir(BOOT_LOG_DIR, { recursive: true })
      .then(() => appendFile(BOOT_LOG_FILE, line, 'utf8'))
      .catch(() => {})
  })
}

/**
 * 给 AI 注册出图工具。
 *
 * 为什么做成工具而不是"生成一个脚本"：脚本是死文件，DSH 的工具列表里没有它，
 * 换个新会话 AI 就不知道它存在（会自己去找别的路子，甚至用第三个脚本）。
 * 注册成工具后，**任何会话、任何新窗口**都天然能用，也不用 AI 记任何路径。
 *
 * 形式参考 `@michengai/dsh-skills-manager` 的 `create_skill` 注册方式：
 * `ctx.tools.register({ name, description, parameters, output, execute })`。
 */
function registerImageTool(ctx: Context): void {
  const anyCtx = ctx as unknown as {
    tools?: { register?: (definition: unknown) => unknown }
    effect?: (fn: () => unknown, label?: string) => void
    inject?(services: string[], callback: (owner: {
      get(name: string): unknown
      effect(fn: () => unknown, label?: string): void
    }) => void): void
  }

  const definition = {
    name: 'generate_image',
    description: [
      '用用户在「图片库插件设置」里配置的中转站生成图片。',
      '生成的图会自动存入图片库，并立刻出现在右侧栏的「会话图片」里。',
      '不需要写脚本、不需要指定输出路径。',
      '用户或技能明确说了要用哪个模型，就填到 model；没说就留空，插件会用设置里的默认模型。',
      '要垫图 / 改图（拿现有图片当参考）就把本地图片路径放进 images。',
      'gpt-image-2.5 这类按质量计费的模型，用 quality 指定档位（不指定会按最高档预扣资金）。',
      '出图会花钱，调用前先确认用户确实要生成。',
    ].join(' '),
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述（中文可以）' },
        model: { type: 'string', description: '模型名。用户或技能指定了模型就填这里；留空用插件设置里的默认模型' },
        size: { type: 'string', description: '比例，如 1:1 / 16:9 / 9:16 / 3:4；不确定就留空' },
        resolution: {
          type: 'string',
          description: '分辨率档：1k / 1.5k / 2k / 4k。各模型支持范围不同（如 Seedream-5.0-Pro 没有 4k），不支持的会被站点拒绝',
        },
        quality: {
          type: 'string',
          description: '质量档：low / medium / high / xhigh / max。只有 gpt-image-2.5 支持（xhigh、max 是它独有）。'
            + '不传时站点默认 auto，而 auto 会按 max 档预扣资金，所以能用就显式指定',
        },
        n: {
          type: 'number',
          description: '张数 1-6，默认 1。插件内部并发提交，耗时接近一张，但会花 n 倍钱',
        },
        images: {
          type: 'array',
          items: { type: 'string' },
          description: '参考图：本地图片绝对路径，最多 10 张（png/jpg/webp/gif）。用于垫图、改图、多图融合',
        },
        mask: {
          type: 'string',
          description: '局部重绘用的蒙版：本地 png 绝对路径，必须带 alpha 通道，尺寸与 images 第一张一致，<4MB。'
            + '透明区域 = 允许重绘。只有 gpt-image-2.5-* 和 gpt-image-2-official 支持；gpt-image-2 会明确报错',
        },
        extra: {
          type: 'object',
          description: '模型专有参数，原样合并进请求体（如 background、layer_decomposition、official_fallback）。不确定就别传',
        },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object' },
      render: (_args: unknown, value: unknown): { type: string, text: string }[] => {
        const result = value as {
          ok?: boolean
          files?: string[]
          sizes?: { width: number, height: number }[]
          costUsd?: number
          failures?: string[]
          error?: string
        } | null
        if (result !== null && result.ok === false) {
          return [{ type: 'text', text: `出图失败：${result.error ?? '未知错误'}` }]
        }
        const files = result?.files ?? []
        const sizes = result?.sizes ?? []
        const lines = [`已生成 ${files.length} 张，已存入图片库：`]
        files.forEach((file, index) => {
          const size = sizes[index]
          lines.push(size === undefined ? file : `${file}（${size.width}×${size.height}）`)
        })
        if (typeof result?.costUsd === 'number') lines.push(`本次共花 $${result.costUsd.toFixed(4)}`)
        const failures = result?.failures ?? []
        if (failures.length > 0) lines.push(`另有 ${failures.length} 张失败：${failures.join('；')}`)
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    async execute(
      args: {
        prompt?: unknown
        model?: unknown
        size?: unknown
        resolution?: unknown
        quality?: unknown
        n?: unknown
        images?: unknown
        mask?: unknown
        extra?: unknown
      },
      exec?: unknown,
    ): Promise<{
      ok: boolean
      files?: string[]
      sizes?: { width: number, height: number }[]
      dir?: string
      model?: string
      costUsd?: number
      failures?: string[]
      error?: string
    }> {
      const prompt = typeof args.prompt === 'string' ? args.prompt.trim() : ''
      if (prompt === '') return { ok: false, error: 'prompt 不能为空' }
      const sessionId = pickSessionId(exec)
      // 静默失败是这次踩过的最贵的坑：图照出、照进图片库，只是「会话图片」栏空着，
      // 看起来像出图失败。留一行日志，下次一眼就能看见。
      if (sessionId === '') {
        console.warn('[session-gallery] 出图没取到会话 id：这张图只会进图片库，不会出现在「会话图片」栏')
      }
      try {
        const result = await generateImages({
          prompt,
          ...(typeof args.model === 'string' && args.model !== '' ? { model: args.model } : {}),
          ...(typeof args.size === 'string' && args.size !== '' ? { size: args.size } : {}),
          ...(typeof args.resolution === 'string' && args.resolution !== '' ? { resolution: args.resolution } : {}),
          ...(typeof args.quality === 'string' && args.quality !== '' ? { quality: args.quality } : {}),
          ...(typeof args.n === 'number' ? { n: Math.min(6, Math.max(1, Math.round(args.n))) } : {}),
          ...(Array.isArray(args.images)
            ? { images: args.images.filter((one): one is string => typeof one === 'string' && one !== '') }
            : {}),
          ...(typeof args.mask === 'string' && args.mask !== '' ? { mask: args.mask } : {}),
          ...(args.extra !== null && typeof args.extra === 'object' && !Array.isArray(args.extra)
            ? { extra: args.extra as Record<string, unknown> }
            : {}),
        }, sessionId)
        return {
          ok: true,
          files: result.files.map((file) => file.path),
          sizes: result.files.map((file) => ({ width: file.width, height: file.height })),
          dir: result.dir,
          model: result.model,
          ...(result.cost === undefined ? {} : { costUsd: result.cost }),
          ...(result.failures.length === 0 ? {} : { failures: result.failures }),
        }
      } catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : String(cause) }
      }
    },
  }

  /**
   * 把定义注册到给到的服务容器上。
   *
   * 为什么参数不是根 ctx：`tools` 服务在 apply 执行时还没注册，
   * 直接在根 ctx 上读 `ctx.tools` 会得到 undefined——这正是
   * `generate_image` 一直「注册成功」却不在 AI 工具清单里的原因
   * （日志里只有一行 warn，而桌面版宿主 stdout 不落盘，没人看得到）。
   * 对照 `@michengai/dsh-skills-manager`：它在模块级声明了
   * `inject = ['webServer', 'skills', 'tools', 'sessions']`，所以它的
   * `create_skill` 能注册上。
   */
  const install = (holder: {
    get(name: string): unknown
    effect(fn: () => unknown, label?: string): void
  }): void => {
    if (genToolDiag.registered) {
      bootLog('install-skip-already-registered')
      return
    }
    let tools: { register?: (definition: unknown) => unknown } | undefined
    try {
      tools = holder.get('tools') as typeof tools
    } catch (cause) {
      bootLog('install-get-tools-threw', cause instanceof Error ? cause.message : String(cause))
      tools = undefined
    }
    genToolDiag.hasToolsService = tools !== undefined && tools !== null
    bootLog('install-probe', {
      hasTools: tools !== undefined && tools !== null,
      hasRegister: typeof tools?.register === 'function',
      toolsType: typeof tools,
    })
    if (typeof tools?.register !== 'function') {
      console.warn('[session-gallery] tools 服务没有 register，generate_image 不可用')
      return
    }
    // 必须带着 this 调用：register 是类方法，内部要读 this.layers。
    // 上一版写成 `const register = tools.register; register(def)`，
    // 方法被摘下来后 this 变成 undefined，于是抛
    // "Cannot read properties of undefined (reading 'layers')"，
    // 而抛错又被下面的 catch 吞成一行 warn——工具就这么一直没注册上。
    // 对照 skills-manager 的 `ctx.tools.register({...})`：它没拆，所以它一直正常。
    const service = tools as { register: (definition: unknown) => unknown }
    try {
      holder.effect(() => service.register(definition), 'session-gallery: generate_image tool')
      genToolDiag.registered = true
      bootLog('install-ok')
      console.log('[session-gallery] 已注册 generate_image 工具')
    } catch (cause) {
      genToolDiag.error = cause instanceof Error ? cause.message : String(cause)
      bootLog('install-threw', genToolDiag.error)
      console.warn('[session-gallery] generate_image 注册抛错', cause)
    }
  }

  genToolDiag.at = new Date().toISOString()

  bootLog('register-start', {
    hasInject: typeof anyCtx.inject === 'function',
    hasEffect: typeof anyCtx.effect === 'function',
    ctxType: typeof ctx,
  })

  if (typeof anyCtx.inject === 'function') {
    // 运行时作用域注入：等 tools 就绪再注册，且 tools 缺失时插件其余功能照常工作。
    // （不用模块级 inject 的理由：那会让整个插件在 tools 缺失时完全不加载，
    //  连图片库都一起没了。）
    genToolDiag.via = 'inject'
    anyCtx.inject(['tools'], (owner) => {
      bootLog('inject-fired')
      install(owner)
    })
    bootLog('inject-declared')

    // 兜底：万一这条注入永远不触发（tools 不在根 scope 之类），3 秒后自己用根 ctx 再试一次。
    // unref 掉，避免挂住事件循环——上次「DSH 关不掉」就是定时器没清导致的。
    const fallback = setTimeout(() => {
      if (genToolDiag.registered) return
      bootLog('fallback-timer-fired')
      const viaGet = (): unknown => {
        const getter = (ctx as unknown as { get?: (name: string) => unknown }).get
        if (typeof getter !== 'function') throw new Error('ctx.get 不是函数')
        return getter.call(ctx, 'tools')
      }
      install({
        get: (name: string) => {
          if (name !== 'tools') throw new Error(`不支持的注入名 ${name}`)
          return viaGet()
        },
        effect: (fn: () => unknown, label?: string) => {
          const effectFn = (ctx as unknown as { effect?: (f: () => unknown, l?: string) => void }).effect
          if (typeof effectFn === 'function') effectFn.call(ctx, fn, label)
          else fn()
        },
      })
    }, 3000)
    ;(fallback as unknown as { unref?: () => void }).unref?.()

    return
  }

  // 退化路径：宿主不提供 inject 时，只能赌根 ctx 上已经有 tools。
  // 注意 cordis 的 ctx 是 Proxy，读未声明的服务属性会**抛错**而不是返回 undefined。
  genToolDiag.via = 'root'
  let rootTools: {
    register?: (definition: unknown) => unknown
    effect?: (fn: () => unknown, label?: string) => void
  } | undefined
  try {
    rootTools = anyCtx.tools
  } catch {
    rootTools = undefined
  }
  genToolDiag.hasToolsService = rootTools !== undefined && rootTools !== null
  if (typeof rootTools?.register !== 'function') {
    console.warn('[session-gallery] 宿主没有 ctx.tools.register，generate_image 不可用')
    return
  }
  // 同样必须带着 this 调用（见 install 里的注释）。
  const rootService = rootTools as { register: (definition: unknown) => unknown }
  if (typeof anyCtx.effect === 'function') {
    anyCtx.effect(() => rootService.register(definition), 'session-gallery: generate_image tool')
  } else {
    rootService.register(definition)
  }
  genToolDiag.registered = true
  bootLog('install-ok-root')
  console.log('[session-gallery] 已注册 generate_image 工具')
}

export function apply(ctx: Context): void {
  // 先证明「插件这一版代码真的被加载了」：老版本不会写这个文件，
  // 所以日志文件存在本身就能排除「重启了但加载的是旧 bundle」。
  bootLog('=== apply-enter ===', {
    pid: process.pid,
    node: process.version,
    hasInject: typeof (ctx as unknown as { inject?: unknown }).inject === 'function',
    hasGet: typeof (ctx as unknown as { get?: unknown }).get === 'function',
    hasEffect: typeof (ctx as unknown as { effect?: unknown }).effect === 'function',
  })
  bootLog('curl-probe', {
    resolved: resolveCurl(),
    pathHasSystem32: (process.env.PATH ?? '').toLowerCase().includes('system32'),
    systemRoot: process.env.SystemRoot ?? '(未设置)',
  })

  try {
    registerImageTool(ctx)
  } catch (cause) {
    bootLog('register-tool-threw', cause instanceof Error ? cause.message : String(cause))
    console.warn('[session-gallery] generate_image 工具注册失败（已忽略）', cause)
  }

  try {
    const anyCtx = ctx as unknown as {
      inject?(services: string[], callback: (owner: {
        get(name: string): unknown
        effect(fn: () => unknown, label?: string): void
      }) => void): void
    }

    if (typeof anyCtx.inject !== 'function') {
      // 宿主代次不提供 inject：退化为「无路由」模式，客户端仍可运行（会提示服务不可用）
      console.warn('[session-gallery] 当前宿主不提供 ctx.inject，宿主侧路由不注册')
      return
    }

    anyCtx.inject(['webServer', 'attachments'], (owner) => {
      try {
        const server = owner.get('webServer') as {
          register(entry: { kind: 'exact', path: string, handler: (req: never, res: never) => void }): () => void
        } | undefined
        const attachments = owner.get('attachments') as {
          readImage(ref: unknown): Promise<{ ref?: { mediaType?: string }, data: Uint8Array }>
        } | undefined

        if (server === undefined || typeof server.register !== 'function') {
          console.warn('[session-gallery] webServer 不可用，跳过路由注册')
          return
        }

        /** 注册一条路由；失败只记日志，不抛出。 */
        const registerRoute = (
          path: string,
          handler: (req: any, res: any) => void,
          label: string,
        ): void => {
          try {
            owner.effect(() => server.register({
              kind: 'exact',
              path,
              handler: (req: never, res: never) => {
                try {
                  handler(req, res)
                } catch (cause) {
                  console.warn(`[session-gallery] ${label} 处理失败`, cause)
                  sendJsonSafely(res, 500, { error: 'internal' })
                }
              },
            }), label)
          } catch (cause) {
            console.warn(`[session-gallery] ${label} 注册失败`, cause)
          }
        }

        registerRoute(EXPORT_ROUTE, (req, res) => {
          if (attachments === undefined) {
            sendJson(res, 503, { error: 'attachments-unavailable' })
            return
          }
          void handleExport(req, res, attachments).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: export route')

        registerRoute(CLEAR_ROUTE, (req, res) => {
          void handleClear(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: clear route')

        registerRoute(SETTINGS_ROUTE, (req, res) => {
          void handleSettings(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: settings route')

        registerRoute(SCAN_ROUTE, (req, res) => {
          void handleScan(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: scan route')

        registerRoute(IMAGE_ROUTE, (req, res) => {
          void handleImage(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: image route')

        registerRoute(DELETE_ROUTE, (req, res) => {
          void handleDelete(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: delete route')

        registerRoute(REVEAL_ROUTE, (req, res) => {
          void handleReveal(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: reveal route')

        // 客户端渲染崩溃的上报口：只写日志，不碰业务数据。
        // 面板有错误边界后会把 message + 组件栈 POST 过来，
        // 这样即使不打开 DevTools，也能在 boot-diag.log 里看到为什么白屏。
        registerRoute(CLIENT_LOG_ROUTE, (req, res) => {
          void (async () => {
            if (req.method !== 'POST') {
              sendJson(res, 405, { error: 'method-not-allowed' })
              return
            }
            try {
              const raw = await readBody(req)
              bootLog('client-error', raw.slice(0, 6000))
            } catch {
              // 上报失败无所谓，别让诊断反过来影响面板
            }
            sendJson(res, 200, { ok: true })
          })()
        }, 'session-gallery: client log route')

        registerRoute(GEN_PROBE_ROUTE, (req, res) => {
          void handleGenProbe(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: gen probe route')

        // 诊断：出图工具到底注册上没有。浏览器直接开这个地址就能看，
        // 不用去翻桌面版根本不落盘的宿主日志。
        registerRoute(GEN_DIAG_ROUTE, (req, res) => {
          if (req.method !== 'GET') {
            sendJson(res, 405, { error: 'method-not-allowed' })
            return
          }
          // cordis 的 ctx 是 Proxy：访问**未声明的服务属性会抛错**，不会返回 undefined。
          // 上一版直接写 `typeof ctx.tools` 把这条路由打成了 500，所以这里必须包 try。
          let rootCtxHasTools = false
          try {
            rootCtxHasTools = typeof (ctx as unknown as { tools?: unknown }).tools !== 'undefined'
          } catch {
            rootCtxHasTools = false
          }
          sendJson(res, 200, { ...genToolDiag, rootCtxHasTools })
        }, 'session-gallery: gen diag route')

        registerRoute(GEN_CONFIG_ROUTE, (req, res) => {
          void handleGenSave(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: gen config route')

        registerRoute(GEN_LOGS_ROUTE, (req, res) => {
          void handleGenLogs(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: gen logs route')

        registerRoute(IMPORT_ROUTE, (req, res) => {
          void handleManualImport(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: manual import route')

        registerRoute(ARCHIVE_ROUTE, (req, res) => {
          if (attachments === undefined) {
            sendJson(res, 503, { error: 'attachments-unavailable' })
            return
          }
          void handleArchive(req, res, attachments).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: archive route')

        registerRoute(WORKBENCH_SAVE_ROUTE, (req, res) => {
          void handleWorkbenchSave(req, res).catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: workbench save route')

        registerRoute(WORKBENCH_CACHE_ROUTE, (req, res) => {
          void handleCache(req, res, 'workbench').catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: workbench cache route')

        registerRoute(GEN_CACHE_ROUTE, (req, res) => {
          void handleCache(req, res, 'gen').catch(() => sendJsonSafely(res, 500, { error: 'internal' }))
        }, 'session-gallery: gen cache route')

      } catch (cause) {
        // 宿主侧初始化失败也要让插件继续以「无路由」模式存在，绝不阻断启动
        console.warn('[session-gallery] 宿主侧初始化失败，插件以无路由模式运行', cause)
      }
    })
  } catch (cause) {
    console.warn('[session-gallery] 宿主侧 apply 失败（已忽略）', cause)
  }
}

/** 安全地发 JSON（响应可能已结束）。 */
function sendJsonSafely(res: any, status: number, payload: unknown): void {
  try {
    sendJson(res, status, payload)
  } catch {
    // 忽略
  }
}

// ------------------------------------------------------------------ 设置

/** 插件设置文件。 */
function settingsFile(): string {
  return join(homedir(), '.dsh', 'cache', 'session-gallery', 'settings.json')
}

interface GallerySettings {
  /** 图片库根目录（绝对路径）。 */
  root: string
  /** 额外扫描的旧图目录。 */
  legacyRoots: string[]
  /**
   * 工作台导出图（标注图 / 蒙版图）的保留天数。
   * 0 表示不自动清理。默认 3 天 —— 这些图只在对被引用的那一次有用，
   * 但对话可能跨天继续，删太早会让引用失效。
   */
  workbenchRetentionDays: number
  /**
   * 脚本出图暂存目录（`~/.dsh/cache/session-gallery/gen`）的保留天数。
   * 0 表示不自动清理。默认 7 天 —— 比工作台缓存长，因为成品图可能隔几天才回头挑。
   * 注意：图进过会话后 DSH 在 attachments 里另有副本，删这里不影响会话里的图，
   * 只会丢掉「未归档期复制提示词」需要的 sidecar。
   */
  genRetentionDays: number
  /**
   * 与「AI 参考库站点」共用同一个素材库目录。
   *
   * 打开后插件会做两件额外的事：出图落盘时发 `G-` 编号、把 sidecar 当成
   * 与站点共写的文件（合并写本来就一直在做，无需开关）。
   * 默认关：单机用插件时编号只是多余字段，还要每次落盘前扫一遍库。
   */
  shareWithSite: boolean
}

/** 默认设置。 */
function defaultSettings(): GallerySettings {
  return {
    root: join(homedir(), 'Pictures', 'DSH图片库'),
    legacyRoots: [],
    workbenchRetentionDays: 3,
    genRetentionDays: 7,
    shareWithSite: false,
  }
}

/** 读取设置。 */
async function readSettings(): Promise<GallerySettings> {
  const fallback = defaultSettings()
  try {
    const raw = await readFile(settingsFile(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<GallerySettings>
    return {
      root: typeof parsed.root === 'string' && isAbsolute(parsed.root) ? parsed.root : fallback.root,
      legacyRoots: Array.isArray(parsed.legacyRoots)
        ? parsed.legacyRoots.filter((p): p is string => typeof p === 'string' && isAbsolute(p))
        : [],
      workbenchRetentionDays: typeof parsed.workbenchRetentionDays === 'number'
        && Number.isFinite(parsed.workbenchRetentionDays)
        && parsed.workbenchRetentionDays >= 0
        ? Math.round(parsed.workbenchRetentionDays)
        : fallback.workbenchRetentionDays,
      genRetentionDays: typeof parsed.genRetentionDays === 'number'
        && Number.isFinite(parsed.genRetentionDays)
        && parsed.genRetentionDays >= 0
        ? Math.round(parsed.genRetentionDays)
        : fallback.genRetentionDays,
      shareWithSite: parsed.shareWithSite === true,
    }
  } catch {
    return fallback
  }
}

/** 写入设置。 */
async function writeSettings(next: GallerySettings): Promise<void> {
  await mkdir(dirname(settingsFile()), { recursive: true })
  await writeFile(settingsFile(), JSON.stringify(next, null, 2), 'utf8')
}

/** 处理设置读写。 */
async function handleSettings(
  req: { method?: string, headers: Record<string, string | string[] | undefined>, on(event: string, cb: (chunk?: unknown) => void): void, url?: string },
  res: { writeHead(status: number, headers: Record<string, string>): void, end(body?: string): void },
): Promise<void> {
  if (req.method === 'GET') {
    sendJson(res, 200, await readSettings())
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }
  let body: {
    root?: unknown
    legacyRoots?: unknown
    workbenchRetentionDays?: unknown
    genRetentionDays?: unknown
    shareWithSite?: unknown
  }
  try {
    body = JSON.parse(await readBody(req)) as {
      root?: unknown
      legacyRoots?: unknown
      workbenchRetentionDays?: unknown
      genRetentionDays?: unknown
      shareWithSite?: unknown
    }
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }
  const fallback = defaultSettings()
  const root = typeof body.root === 'string' && isAbsolute(body.root) ? resolve(body.root) : fallback.root
  const legacyRoots = Array.isArray(body.legacyRoots)
    ? body.legacyRoots
      .filter((p): p is string => typeof p === 'string' && isAbsolute(p))
      .map((p) => resolve(p))
    : []
  const retentionRaw = Number(body.workbenchRetentionDays)
  const workbenchRetentionDays = Number.isFinite(retentionRaw) && retentionRaw >= 0
    ? Math.round(retentionRaw)
    : fallback.workbenchRetentionDays
  const genRaw = Number(body.genRetentionDays)
  const genRetentionDays = Number.isFinite(genRaw) && genRaw >= 0
    ? Math.round(genRaw)
    : fallback.genRetentionDays
  // 没带这个字段就沿用原值（老客户端保存时不发它，别把开关顺手关掉）
  const prev = await readSettings()
  const shareWithSite = typeof body.shareWithSite === 'boolean' ? body.shareWithSite : prev.shareWithSite
  await writeSettings({ root, legacyRoots, workbenchRetentionDays, genRetentionDays, shareWithSite })
  sendJson(res, 200, { root, legacyRoots, workbenchRetentionDays, genRetentionDays, shareWithSite })
}

// ------------------------------------------------------------------ 扫描

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])

interface ScannedImage {
  path: string
  name: string
  dir: string
  rel: string
  root: string
  source: 'library' | 'legacy'
  mtime: number
  bytes: number
  /** 内容哈希前 12 位（用于跨路径去重；按 path+mtime+size 缓存）。 */
  hash?: string
  meta?: Record<string, unknown>
}

/** 内容哈希缓存：`path|mtime|size` → hash（进程内）。 */
const fileHashCache = new Map<string, string>()

function hashOfFile(path: string, mtime: number, size: number): Promise<string> {
  const key = `${path}|${mtime}|${size}`
  const cached = fileHashCache.get(key)
  if (cached !== undefined) return Promise.resolve(cached)
  return readFile(path).then((data) => {
    const hash = createHash('sha256').update(data).digest('hex').slice(0, 12)
    fileHashCache.set(key, hash)
    return hash
  }).catch(() => '')
}

/** 递归扫描一个根目录（限深度与总数）。
 *  `baseRoot` 是这一轮的基准根（分组与相对路径都基于它），`dir` 是当前遍历目录。 */
async function scanRoot(
  baseRoot: string,
  dir: string,
  source: 'library' | 'legacy',
  out: ScannedImage[],
  budget: { left: number },
  depth = 0,
): Promise<void> {
  if (depth > 8 || budget.left <= 0) return
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (budget.left <= 0) return
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await scanRoot(baseRoot, full, source, out, budget, depth + 1)
      continue
    }
    if (!entry.isFile()) continue
    const ext = extname(entry.name).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    const info = await stat(full).catch(() => null)
    if (info === null) continue
    let meta: Record<string, unknown> | undefined
    try {
      const raw = await readFile(full.slice(0, -ext.length) + '.json', 'utf8')
      const parsed = JSON.parse(raw) as unknown
      if (parsed !== null && typeof parsed === 'object') meta = parsed as Record<string, unknown>
    } catch {
      // 没有 sidecar 是正常的（旧图）
    }
    budget.left -= 1
    const hash = await hashOfFile(full, info.mtimeMs, info.size)
    out.push({
      path: full,
      name: entry.name,
      dir: dirname(full),
      rel: relative(baseRoot, full),
      root: baseRoot,
      source,
      mtime: info.mtimeMs,
      bytes: info.size,
      ...(hash === '' ? {} : { hash }),
      ...(meta === undefined ? {} : { meta }),
    })
  }
}

/** 处理扫描请求。 */
async function handleScan(
  req: { method?: string, headers: Record<string, string | string[] | undefined> },
  res: { writeHead(status: number, headers: Record<string, string>): void, end(body?: string): void },
): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'GET') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }
  const settings = await readSettings()
  const items: ScannedImage[] = []
  const budget = { left: 5000 }
  await scanRoot(settings.root, settings.root, 'library', items, budget)
  for (const legacy of settings.legacyRoots) {
    await scanRoot(legacy, legacy, 'legacy', items, budget)
  }
  /** 排序时间：优先 sidecar 的生成时间（createdAt），没有才退回文件修改时间。 */
  const timeOf = (item: ScannedImage): number => {
    const created = item.meta?.createdAt
    if (typeof created === 'string') {
      const parsed = Date.parse(created)
      if (!Number.isNaN(parsed)) return parsed
    }
    return item.mtime
  }
  items.sort((a, b) => timeOf(b) - timeOf(a))
  // 「脚本产物」未勾选时，不在插件里显示脚本写入库里的图
  sendJson(res, 200, {
    items,
    settings,
    truncated: budget.left <= 0,
    // 图片库之外那一份「脚本刚出的图」的元数据，只用来给未归档大图显示参数/提示词
    pendingMeta: await readGenSidecars(),
  })
}

// ------------------------------------------------------------------ sidecar（与 AI 参考库站点共用同一份 json）

/**
 * 读已有 sidecar；没有文件或内容坏了都返回空对象（按新建处理）。
 */
async function readSidecar(jsonPath: string): Promise<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(await readFile(jsonPath, 'utf8')) as unknown
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // 没有 sidecar 是常见的（旧图）；内容坏了也不该挡住落盘
  }
  return {}
}

/**
 * 合并写 sidecar：`{ ...旧内容, ...本次字段 }` —— **站点字段原样保留，本次有值的字段覆盖**。
 *
 * 为什么不能整文件覆盖：`个人素材` 目录和 AI 参考库站点共用同一份 json，
 * 站点会在里面写 `no` / `groups` / `labels` / `title`。整覆盖会把用户刚整理好的
 * 分组和标签一次性抹掉，而且两边都不会报错 —— 属于最难查的那种丢数据。
 *
 * 为什么旧的插件字段也一并保留、而不是"只留站点字段"：可选参数（`costUsd` /
 * `quality` / `referenceCount`）站点偶尔不返回，只留对方字段会把上次记下的值
 * 抹成空。保留旧值的代价是字段可能略微过时，比丢数据轻。
 *
 * `no` 单独处理：旧的号（不管插件发的 `G-` 还是站点发的 `U-`）先沿用，
 * 旧文件里确实没有号才调用 `assignNo` 发新号。
 *
 * 先写临时文件再 rename：绿联云同步可能正在传这个 json，
 * 直接覆盖会让对方读到写了一半的内容。
 *
 * @param next - 插件这次要写的字段
 * @param assignNo - 旧文件里没有编号时，用这个发新号（`G-`）
 */
async function writeSidecarMerged(
  jsonPath: string,
  next: Record<string, unknown>,
  assignNo?: () => string,
): Promise<void> {
  const prev = await readSidecar(jsonPath)
  const merged: Record<string, unknown> = { ...prev, ...next }
  if (typeof merged.no !== 'string' || merged.no === '') {
    const fresh = assignNo?.()
    if (fresh !== undefined && fresh !== '') merged.no = fresh
  }
  const text = `${JSON.stringify(merged, null, 2)}\n`
  const tmp = `${jsonPath}.tmp-${process.pid}`
  try {
    await writeFile(tmp, text, 'utf8')
    await rename(tmp, jsonPath)
  } catch {
    await unlink(tmp).catch(() => undefined)
    await writeFile(jsonPath, text, 'utf8')
  }
}

/**
 * 扫图片库取指定前缀（`G-` / `U-`）的最大编号。
 *
 * 只读 sidecar、不读图片内容，成本跟库里 json 的数量成正比。
 * **不能缓存**：站点在另一个进程（甚至另一台电脑上经同步写入）也会发号，
 * 缓存的值随时可能过期，所以每次落盘前现扫一次。
 */
async function maxGalleryNo(prefix: string): Promise<number> {
  const settings = await readSettings()
  const pattern = new RegExp(`^${prefix}(\\d+)$`)
  let max = 0
  const walk = async (dir: string, depth: number): Promise<void> => {
    if (depth > 8) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full, depth + 1)
        continue
      }
      if (!entry.name.toLowerCase().endsWith('.json')) continue
      const meta = await readSidecar(full)
      const matched = pattern.exec(typeof meta.no === 'string' ? meta.no : '')
      if (matched === null) continue
      const value = Number(matched[1])
      if (Number.isFinite(value) && value > max) max = value
    }
  }
  await walk(settings.root, 0)
  return max
}

/** 发号器：先扫一次取最大号，之后每调用一次 +1（一批多张图不重复扫库）。 */
async function makeNoAllocator(prefix: string): Promise<() => string> {
  let current = await maxGalleryNo(prefix)
  return () => {
    current += 1
    return `${prefix}${String(current).padStart(3, '0')}`
  }
}

/**
 * 只有在「与 AI 参考库站点共用素材库」打开时才返回发号器，否则返回 undefined 表示不发号。
 *
 * 编号（`G-` / `U-`）是素材库那套编号体系的一部分：单机用插件时它只是个多余字段，
 * 还要每次落盘前扫一遍库。所以默认关闭，跟着设置项走。
 */
async function noAllocatorIfShared(): Promise<(() => string) | undefined> {
  const settings = await readSettings()
  if (!settings.shareWithSite) return undefined
  return makeNoAllocator('G-')
}

/** 路径是否落在允许的根目录内。 */
function isUnder(target: string, root: string): boolean {
  const normalizedRoot = resolve(root)
  const normalizedTarget = resolve(target)
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(normalizedRoot + sep)
}

/** 处理图片字节请求（只允许图片库与旧图目录内的文件）。 */
async function handleImage(
  req: { method?: string, headers: Record<string, string | string[] | undefined>, url?: string },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: unknown): void
  },
): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  const parsed = new URL(req.url ?? '', 'http://localhost')
  const rawPath = parsed.searchParams.get('path')
  if (rawPath === null || rawPath === '') {
    sendJson(res, 400, { error: 'missing-path' })
    return
  }
  const settings = await readSettings()
  const roots = [settings.root, ...settings.legacyRoots]
  const target = resolve(rawPath)
  if (!roots.some((root) => isUnder(target, root))) {
    sendJson(res, 403, { error: 'outside-library' })
    return
  }
  const ext = extname(target).toLowerCase()
  if (!IMAGE_EXT.has(ext)) {
    sendJson(res, 415, { error: 'unsupported-type' })
    return
  }
  let data: Buffer
  try {
    data = await readFile(target)
  } catch {
    sendJson(res, 404, { error: 'not-found' })
    return
  }
  const mime = ext === '.jpg' || ext === '.jpeg'
    ? 'image/jpeg'
    : ext === '.webp'
      ? 'image/webp'
      : ext === '.gif'
        ? 'image/gif'
        : ext === '.bmp'
          ? 'image/bmp'
          : 'image/png'
  res.writeHead(200, {
    'content-type': mime,
    'content-length': String(data.length),
    'cache-control': 'private, max-age=60',
  })
  res.end(data)
}

/** 清理导出缓存（保留目录本身）。 */
async function handleClear(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }
  const dir = exportDir()
  let removed = 0
  try {
    const names = await readdir(dir)
    for (const name of names) {
      try {
        await unlink(join(dir, name))
        removed += 1
      } catch {
        // 单个文件删除失败不影响其余
      }
    }
  } catch {
    // 目录不存在视为已清空
  }
  sendJson(res, 200, { removed, dir })
}

// ------------------------------------------------------------------ 工作台导出

/** 脚本出图的临时目录（**在图片库之外**，脚本产物不是作品）。 */
function genDir(): string {
  return join(homedir(), '.dsh', 'cache', 'session-gallery', 'gen')
}

/**
 * 读脚本输出目录里的 sidecar，供「未归档」大图显示参数和提示词。
 *
 * 这些图不属于图片库（用户还没决定要不要），但元数据得能借出来 ——
 * 否则未归档期只剩一张裸图，连提示词都拿不到，没法「复制提示词再抽一版」。
 */
async function readGenSidecars(): Promise<{ hash: string, meta: Record<string, unknown> }[]> {
  let names: string[]
  try {
    names = await readdir(genDir())
  } catch {
    return []
  }
  const out: { hash: string, meta: Record<string, unknown> }[] = []
  for (const name of names) {
    if (!name.toLowerCase().endsWith('.json')) continue
    try {
      const meta = JSON.parse(await readFile(join(genDir(), name), 'utf8')) as Record<string, unknown>
      const raw = typeof meta.hash === 'string' && meta.hash !== ''
        ? meta.hash
        : (name.replace(/\.json$/i, '').split('-').pop() ?? '')
      if (raw.length < 8) continue
      out.push({ hash: raw.slice(0, 12).toLowerCase(), meta })
    } catch {
      // 单个 sidecar 坏了就跳过，不影响其它
    }
  }
  return out
}


/**
 * 扫一个缓存目录：统计占用，顺带删掉过期文件。
 *
 * `retentionDays <= 0` 表示不按时间删（只统计）；
 * `clearAll` 优先于时间判断，全部删掉。
 */
async function sweepCacheDir(
  dir: string,
  retentionDays: number,
  clearAll = false,
): Promise<{ removed: number, files: number, bytes: number }> {
  const cutoff = retentionDays > 0 ? Date.now() - retentionDays * 24 * 60 * 60 * 1000 : -Infinity
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return { removed: 0, files: 0, bytes: 0 }
  }
  let removed = 0
  let files = 0
  let bytes = 0
  for (const name of names) {
    const full = join(dir, name)
    const info = await stat(full).catch(() => null)
    if (info === null || !info.isFile()) continue
    if (clearAll || info.mtimeMs < cutoff) {
      try {
        await unlink(full)
        removed += 1
        continue
      } catch {
        // 删不掉就仍算占用，别假装干净
      }
    }
    files += 1
    bytes += info.size
  }
  return { removed, files, bytes }
}

/** 工作台导出缓存（`<图片库>\.workbench`）。 */
function sweepWorkbenchCache(
  root: string,
  retentionDays: number,
  clearAll = false,
): Promise<{ removed: number, files: number, bytes: number }> {
  return sweepCacheDir(join(root, WORKBENCH_DIR_NAME), retentionDays, clearAll)
}

/**
 * 保存工作台导出的标注图 / 蒙版图。
 *
 * 客户端在浏览器里用 canvas 合成好 PNG（base64），这里只负责落盘，
 * 写到 `<图片库>\.workbench\`（点开头，不参与图片库扫描，也不会被当成作品）。
 * 文件名由客户端给（含时间戳避免覆盖），只保留安全字符。
 */
async function handleWorkbenchSave(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }
  let body: { name?: unknown, dataBase64?: unknown }
  try {
    // 这条路由要收整张图的 base64（标注图 = 原图大小），默认 256KB 上限根本不够，
    // 表现是「蒙版图存下来了、标注图却凭空消失」
    body = JSON.parse(await readBody(req, 64 * 1024 * 1024)) as { name?: unknown, dataBase64?: unknown }
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }
  const encoded = typeof body.dataBase64 === 'string' ? body.dataBase64 : ''
  if (encoded === '') {
    sendJson(res, 400, { error: 'missing-data' })
    return
  }
  const data = Buffer.from(encoded, 'base64')
  if (data.length === 0 || data.length > 64 * 1024 * 1024) {
    sendJson(res, 400, { error: 'size-out-of-range' })
    return
  }
  const settings = await readSettings()
  const dir = join(settings.root, WORKBENCH_DIR_NAME)
  await mkdir(dir, { recursive: true })
  const rawName = typeof body.name === 'string' ? body.name : 'export'
  const safe = rawName.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 80)
  // 保留调用方给的扩展名（标注图是 jpg，蒙版图必须是 png）
  const fileName = safe === '' ? 'export.png' : (/\.(png|jpe?g|webp)$/i.test(safe) ? safe : `${safe}.png`)
  const filePath = join(dir, fileName)
  try {
    await writeFile(filePath, data)
  } catch (cause) {
    sendJson(res, 500, { error: 'write-failed', message: cause instanceof Error ? cause.message : String(cause) })
    return
  }
  sendJson(res, 200, { path: filePath })
  // 顺手清理过期缓存：不 await，避免拖慢这一张图的保存
  if (settings.workbenchRetentionDays > 0) {
    void sweepWorkbenchCache(settings.root, settings.workbenchRetentionDays).catch(() => undefined)
  }
}

/** 缓存统计（GET）与清理（POST { clear?: true }）。scope 决定管哪个目录。 */
async function handleCache(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
  scope: 'workbench' | 'gen',
): Promise<void> {
  const settings = await readSettings()
  const dir = scope === 'gen' ? genDir() : join(settings.root, WORKBENCH_DIR_NAME)
  const retentionDays = scope === 'gen' ? settings.genRetentionDays : settings.workbenchRetentionDays
  if (req.method === 'GET') {
    const stats = await sweepCacheDir(dir, 0)
    sendJson(res, 200, { ...stats, retentionDays, dir })
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }
  let body: { clear?: unknown } = {}
  try {
    body = JSON.parse(await readBody(req)) as { clear?: unknown }
  } catch {
    body = {}
  }
  const clearAll = body.clear === true
  const result = await sweepCacheDir(dir, retentionDays, clearAll)
  sendJson(res, 200, { ...result, retentionDays, dir })
}

// ------------------------------------------------------------------ 删除

// ==================================================================
// 出图配置：探测中转站 / 保存配置
// ==================================================================

/** 出图结果文件。 */
interface GenFile {
  path: string
  width: number
  height: number
  bytes: number
  hash: string
}

/** 出图路由。 */
const GEN_PROBE_ROUTE = '/plugins/dsh-session-gallery/gen-probe'
const GEN_CONFIG_ROUTE = '/plugins/dsh-session-gallery/gen-config'
/** 出图日志路由（GET 列表 / POST 清理）。 */
const GEN_LOGS_ROUTE = '/plugins/dsh-session-gallery/gen-logs'

/**
 * 出图配置（独立文件，不塞进 settings.json）。
 *
 * 为什么只有 `defaultModel`、没有「可用模型清单」：
 * 插件是面向所有用户的，绝大多数人不会装「提示词优化」那类技能。
 * 他们只会说「画只猫」——AI 不知道这家中转站有哪些模型，也不该猜。
 * 所以插件的契约是：**传了 model 就原样用，没传就用默认模型**。
 * 白名单那套会把决策权从中枢（技能/用户）抢到执行端，还会挡住技能推荐的模型，
 * 已废弃。
 */
interface GenSettings {
  baseURL: string
  protocol: 'apimart-async' | 'openai-compat'
  proxy: string
  credentialKey: string
  /** AI 没指定 model 时用的模型；空串表示没配，出图会报错让用户去设置。 */
  defaultModel: string
}

const GEN_DEFAULTS: GenSettings = {
  baseURL: '',
  protocol: 'apimart-async',
  /**
   * 代理默认留空：不是每个人都挂着本地代理，也不该替使用者预设某个端口。
   * 需要代理的（国外中转站）在设置里自己填，比如 `http://127.0.0.1:7897`。
   */
  proxy: '',
  /** 凭据名默认留空：绑死某个中转站的变量名会把别人的配置挡在门外。 */
  credentialKey: '',
  defaultModel: '',
}

function genConfigFile(): string {
  return join(exportDir(), 'gen-config.json')
}

/**
 * 从旧版配置的 `models` 勾选清单里挑一个当默认模型（迁移用）。
 * 旧版把模型存成 `{ id, note, enabled }[]`，取第一个启用的即可。
 */
function legacyDefaultModel(models: unknown): string {
  if (!Array.isArray(models)) return ''
  for (const entry of models) {
    if (entry === null || typeof entry !== 'object') continue
    const item = entry as { id?: unknown, enabled?: unknown }
    if (typeof item.id === 'string' && item.id !== '' && item.enabled !== false) return item.id
  }
  return ''
}

async function readGenConfig(): Promise<GenSettings> {
  try {
    const parsed = JSON.parse(await readFile(genConfigFile(), 'utf8')) as Record<string, unknown>
    return {
      baseURL: typeof parsed.baseURL === 'string' ? parsed.baseURL : GEN_DEFAULTS.baseURL,
      protocol: parsed.protocol === 'openai-compat' ? 'openai-compat' : 'apimart-async',
      proxy: typeof parsed.proxy === 'string' ? parsed.proxy : GEN_DEFAULTS.proxy,
      credentialKey: typeof parsed.credentialKey === 'string' && parsed.credentialKey !== ''
        ? parsed.credentialKey
        : GEN_DEFAULTS.credentialKey,
      defaultModel: typeof parsed.defaultModel === 'string'
        ? parsed.defaultModel
        : legacyDefaultModel(parsed.models),
    }
  } catch {
    return { ...GEN_DEFAULTS }
  }
}

async function writeGenConfig(next: GenSettings): Promise<void> {
  await mkdir(exportDir(), { recursive: true })
  await writeFile(genConfigFile(), `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}

/** `~/.dsh/.credentials.yaml` 里的某个键。 */
function credentialsFile(): string {
  return join(homedir(), '.dsh', '.credentials.yaml')
}

async function readCredential(key: string): Promise<string> {
  try {
    const text = await readFile(credentialsFile(), 'utf8')
    const match = new RegExp(`^\\s*${key}\\s*:\\s*(\\S+)`, 'm').exec(text)
    return match?.[1] ?? ''
  } catch {
    return ''
  }
}

async function writeCredential(key: string, value: string): Promise<void> {
  let text = ''
  try {
    text = await readFile(credentialsFile(), 'utf8')
  } catch {
    text = ''
  }
  const line = `${key}: ${value}`
  const pattern = new RegExp(`^\\s*${key}\\s*:.*$`, 'm')
  const next = pattern.test(text)
    ? text.replace(pattern, line)
    : `${text === '' ? '' : `${text.replace(/\s+$/, '')}\n`}${line}\n`
  await writeFile(credentialsFile(), next, 'utf8')
}

/**
 * 用 curl 发一次请求。
 *
 * 为什么不用 fetch：Node 的 `fetch` **不读系统代理**，而国内中转站基本都要走代理
 * （APIMart 直连超时）。`NODE_USE_ENV_PROXY` 只在进程启动时读，插件进程里改没用。
 * DSH 的 Node 子进程能跑 curl（Windows 10+ 自带），用它最省事。
 */
/**
 * curl.exe 的绝对路径。
 *
 * 为什么不能直接写 `'curl.exe'`：`execFile` 靠宿主进程的 PATH 找可执行文件，
 * 而 DSH 桌面版宿主是 Electron 启动的，PATH 不一定含 System32。
 * 实测现象刚好对上：设置页「检测」一直报「连不上」，可同一串参数在命令行里
 * 返回 200、313 个模型——差别只在「谁来拼这个可执行文件路径」。
 * 按 SystemRoot 拼绝对路径，PATH 里找不到也照样能跑。
 */
let cachedCurlPath: string | null = null

function resolveCurl(): string {
  if (cachedCurlPath !== null) return cachedCurlPath
  const candidates = [
    join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'curl.exe'),
    'C:\\Windows\\System32\\curl.exe',
    'curl.exe',
  ]
  for (const candidate of candidates) {
    if (candidate === 'curl.exe') {
      cachedCurlPath = candidate
      break
    }
    try {
      if (existsSync(candidate)) {
        cachedCurlPath = candidate
        break
      }
    } catch {
      // existsSync 理论上不抛，保险
    }
  }
  cachedCurlPath ??= 'curl.exe'
  return cachedCurlPath
}

async function curlRequest(
  url: string,
  init: {
    method?: string
    headers?: Record<string, string>
    body?: string
    proxy?: string
    timeoutSec?: number
  },
): Promise<{ status: number, text: string }> {
  const args = ['-sS', '--max-time', String(init.timeoutSec ?? 25), '-X', init.method ?? 'GET']
  if (typeof init.proxy === 'string' && init.proxy !== '') args.push('-x', init.proxy)
  for (const [key, value] of Object.entries(init.headers ?? {})) args.push('-H', `${key}: ${value}`)

  // 请求体走命令行还是临时文件：
  // Windows 的单个命令行上限约 32767 字符，而垫图的请求体是 base64 图片，
  // 动辄几 MB —— 塞进参数里必定失败（`execFile` 直接 ENOENT/ENAMETOOLONG）。
  // 超过阈值就写临时文件，用 `curl --data-binary @文件` 读。
  let bodyFile: string | null = null
  if (init.body !== undefined) {
    if (init.body.length > 8000) {
      bodyFile = join(tmpdir(), `dshsg-body-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.json`)
      await writeFile(bodyFile, init.body, 'utf8')
      args.push('--data-binary', `@${bodyFile}`)
    } else {
      args.push('--data-binary', init.body)
    }
  }
  args.push('-w', '\n__STATUS__%{http_code}', url)
  try {
    const { stdout } = await execFileP(resolveCurl(), args, { maxBuffer: 32 * 1024 * 1024 })
    const marker = stdout.lastIndexOf('\n__STATUS__')
    if (marker < 0) return { status: 0, text: stdout }
    return {
      status: Number(stdout.slice(marker + 11).trim()) || 0,
      text: stdout.slice(0, marker),
    }
  } catch (cause) {
    // execFile 抛错时，curl 真正的原因在 error.stderr 里（比如
    // "Connection timed out" / "Could not resolve host" / ENOENT）。
    // 只回 cause.message 等于把线索丢了——上次「检测连不上」就是这样，
    // 界面上只说「连不上」，我们无从判断到底是代理没生效还是 curl 没找到。
    const err = cause as { code?: unknown, message?: unknown, stderr?: unknown }
    const parts = [
      typeof err.code === 'string' ? err.code : '',
      typeof err.message === 'string' ? err.message : '',
      typeof err.stderr === 'string' ? err.stderr.trim().slice(0, 500) : '',
    ].filter((part) => part !== '')
    return { status: 0, text: parts.join(' | ') }
  } finally {
    if (bodyFile !== null) await unlink(bodyFile).catch(() => {})
  }
}

/** 从模型 id 里认出图模型；把视频/语音/文本类的排除掉。 */
function looksLikeImageModel(id: string): boolean {
  const lower = id.toLowerCase()
  if (/(video|tts|whisper|embed|rerank|audio|chat|vision-preview$)/.test(lower)) return false
  return /(image|dall-e|flux|seedream|banana|midjourney|sdxl|stable-diffusion|imagen)/.test(lower)
}

/** 处理「检测中转站」：拉模型列表 + 判断协议。 */
async function handleGenProbe(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: { writeHead(status: number, headers: Record<string, string>): void, end(body?: string): void },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: { baseURL?: unknown, apiKey?: unknown, proxy?: unknown, credentialKey?: unknown }
  try {
    body = JSON.parse(await readBody(req)) as typeof body
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }

  const saved = await readGenConfig()
  const rawBase = typeof body.baseURL === 'string' ? body.baseURL.trim() : saved.baseURL
  const credentialKey = typeof body.credentialKey === 'string' && body.credentialKey !== ''
    ? body.credentialKey
    : saved.credentialKey
  const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim() !== ''
    ? body.apiKey.trim()
    : await readCredential(credentialKey)
  const proxy = typeof body.proxy === 'string' ? body.proxy.trim() : saved.proxy

  if (rawBase === '') {
    sendJson(res, 400, { error: 'no-base-url', message: '先填中转站地址' })
    return
  }
  if (apiKey === '') {
    sendJson(res, 400, { error: 'no-key', message: '先填 API Key' })
    return
  }

  // 去掉末尾的 /v1，统一拼
  const root = rawBase.replace(/\/+$/, '').replace(/\/v1$/i, '')
  const headers = { Authorization: `Bearer ${apiKey}` }

  const models = await curlRequest(`${root}/v1/models`, { headers, proxy })
  bootLog('gen-probe', { root, proxy, status: models.status, text: models.text.slice(0, 300) })
  if (models.status === 401 || models.status === 403) {
    sendJson(res, 200, { ok: false, error: 'bad-key', message: 'Key 不被接受（401/403）' })
    return
  }
  if (models.status === 0) {
    const why = models.text.trim().slice(0, 300)
    sendJson(res, 200, {
      ok: false,
      error: 'network',
      // 把 curl 的真实报错直接摊在界面上，别再让人猜「连不上」是什么连不上。
      message: why === '' ? '连不上：检查地址是否正确、要不要挂代理' : `连不上：${why}`,
      detail: why,
      proxy,
      root,
    })
    return
  }

  let ids: string[] = []
  try {
    const parsed = JSON.parse(models.text) as { data?: { id?: unknown }[] }
    ids = (parsed.data ?? [])
      .map((row) => (typeof row?.id === 'string' ? row.id : ''))
      .filter((id) => id !== '')
  } catch {
    ids = []
  }

  // 协议：有 /v1/tasks/* 就是异步任务制（APIMart 这类）
  const tasks = await curlRequest(`${root}/v1/tasks/connectivity-probe`, { headers, proxy })
  const protocol: GenSettings['protocol'] = tasks.status === 400 || tasks.status === 401 || tasks.status === 405
    ? 'apimart-async'
    : 'openai-compat'

  const imageModels = ids.filter(looksLikeImageModel).sort()

  sendJson(res, 200, {
    ok: true,
    protocol,
    total: ids.length,
    models: imageModels,
    message: ids.length === 0
      ? '连上了，但没拿到模型列表（这个中转站可能不支持 /v1/models），请手动填模型名'
      : `连上了，共 ${ids.length} 个模型，其中 ${imageModels.length} 个看起来能出图`,
  })
}

/** 处理「保存出图配置」。 */
async function handleGenSave(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: { writeHead(status: number, headers: Record<string, string>): void, end(body?: string): void },
): Promise<void> {
  if (req.method === 'GET') {
    const current = await readGenConfig()
    sendJson(res, 200, {
      ...current,
      // 只回报有没有 key，不回传明文
      hasKey: (await readCredential(current.credentialKey)) !== '',
    })
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: {
    baseURL?: unknown
    protocol?: unknown
    proxy?: unknown
    credentialKey?: unknown
    apiKey?: unknown
    defaultModel?: unknown
  }
  try {
    body = JSON.parse(await readBody(req)) as typeof body
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }

  const credentialKey = typeof body.credentialKey === 'string' && body.credentialKey.trim() !== ''
    ? body.credentialKey.trim()
    : GEN_DEFAULTS.credentialKey

  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
  if (apiKey !== '') await writeCredential(credentialKey, apiKey)

  const next: GenSettings = {
    baseURL: typeof body.baseURL === 'string' ? body.baseURL.trim() : '',
    protocol: body.protocol === 'openai-compat' ? 'openai-compat' : 'apimart-async',
    proxy: typeof body.proxy === 'string' ? body.proxy.trim() : '',
    credentialKey,
    defaultModel: typeof body.defaultModel === 'string' ? body.defaultModel.trim() : '',
  }
  await writeGenConfig(next)
  sendJson(res, 200, { ok: true, config: next, hasKey: (await readCredential(credentialKey)) !== '' })
}

/** 从图片字节里读宽高（只认 PNG / JPEG / WebP，读不出就返回 0）。 */
function imageSizeOf(bytes: Buffer): { width: number, height: number, ext: string } {
  // PNG: 89 50 4E 47，IHDR 在 16..24
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), ext: '.png' }
  }
  // JPEG: 逐段找 SOFn
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue }
      const marker = bytes[offset + 1] ?? 0
      const length = bytes.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), ext: '.jpg' }
      }
      offset += 2 + length
    }
  }
  // WebP (VP8X): "RIFF"…"WEBP" 后面 24..30 是画布宽高减一
  if (bytes.length > 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const width = 1 + (bytes.readUIntLE(24, 3))
    const height = 1 + (bytes.readUIntLE(27, 3))
    return { width, height, ext: '.webp' }
  }
  return { width: 0, height: 0, ext: '.png' }
}

/** mask 上限（严格值，见 APIMart gpt-image-2.5 文档：mask 参数参考值 4MB）。 */
const MASK_MAX_BYTES = 4 * 1024 * 1024

/**
 * 这个模型支持 mask（局部重绘）吗？
 *
 * 2026-11-06 核对 APIMart 文档：只有 `gpt-image-2.5-*`（flare / sunburst）和
 * `gpt-image-2-official` 有 `mask_url`；普通 `gpt-image-2` 没有。
 * 不支持时**明确报错**，不静默忽略（静默忽略 = 用户以为改了，其实全图重画）。
 */
function modelSupportsMask(model: string): boolean {
  const lower = model.toLowerCase()
  return lower.includes('gpt-image-2.5') || lower.includes('gpt-image-2-official')
}

/** 读 PNG 的宽高与「有没有 alpha 通道」。非 PNG 返回 null。 */
function readPngInfo(bytes: Buffer): { width: number, height: number, hasAlpha: boolean } | null {
  if (bytes.length < 33) return null
  if (!(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)) return null
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  const colorType = bytes[25] ?? 0
  // colorType：4 = 灰度+alpha，6 = RGBA；调色板（3）可能靠 tRNS 表达透明
  let hasAlpha = colorType === 4 || colorType === 6
  if (!hasAlpha) hasAlpha = bytes.includes(Buffer.from('tRNS', 'ascii'))
  return { width, height, hasAlpha }
}

/**
 * 读取并校验 mask，返回 base64 data URI 与元信息。
 *
 * 校验项与 APIMart 文档一致：PNG、有 alpha、与原图同尺寸、<4MB。
 * 它会替你省掉一次「提交了才发现被拒」的来回。
 */
async function loadMask(
  maskPath: string,
  firstRefPath: string | undefined,
): Promise<{ dataUrl: string, bytes: number, width: number, height: number }> {
  const info = await stat(maskPath).catch(() => null)
  if (info === null || !info.isFile()) throw new Error(`mask 文件不存在：${maskPath}`)
  if (info.size > MASK_MAX_BYTES) {
    throw new Error(`mask 太大（${(info.size / 1024 / 1024).toFixed(1)}MB），上限 4MB：${maskPath}`)
  }
  const bytes = await readFile(maskPath)
  const png = readPngInfo(bytes)
  if (png === null) throw new Error(`mask 必须是 PNG（带 alpha 通道）：${maskPath}`)
  if (!png.hasAlpha) {
    throw new Error(`mask 没有 alpha 通道：${maskPath}。纯黑白图不能当 mask，必须用带透明区域的 PNG（透明 = 允许重绘）`)
  }
  if (firstRefPath === undefined) throw new Error('传 mask 时必须同时传 images（第一张为原图）')
  const refBytes = await readFile(firstRefPath).catch(() => null)
  if (refBytes === null) throw new Error(`第一张参考图读不到：${firstRefPath}`)
  const ref = imageSizeOf(refBytes)
  if (ref.width > 0 && ref.height > 0 && (ref.width !== png.width || ref.height !== png.height)) {
    throw new Error(`mask 尺寸 ${png.width}×${png.height} 与原图 ${ref.width}×${ref.height} 不一致（必须同尺寸）`)
  }
  return {
    dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
    bytes: bytes.length,
    width: png.width,
    height: png.height,
  }
}

/**
 * 下载一张图到磁盘（走代理）。
 *
 * 返回 `null` 表示成功，否则返回**失败原因**。
 * 以前这里返回 boolean 且把 cause 全吞掉，导致「两张图都出图、都扣钱了，
 * 但只下载到一张」时毫无线索——2026-11-02 实测 n=2 就是这么丢掉一张的。
 */
async function downloadTo(url: string, outPath: string, proxy: string): Promise<string | null> {
  const args = ['-sS', '--max-time', '180', '-L', '-w', '%{http_code}']
  if (proxy !== '') args.push('-x', proxy)
  args.push('-o', outPath, url)
  try {
    const { stdout } = await execFileP(resolveCurl(), args, { maxBuffer: 8 * 1024 * 1024 })
    const code = Number(String(stdout).trim())
    const info = await stat(outPath).catch(() => null)
    if (info === null || !info.isFile() || info.size === 0) {
      return `下载后文件为空（HTTP ${Number.isFinite(code) ? code : '未知'}）`
    }
    if (Number.isFinite(code) && code !== 0 && (code < 200 || code >= 300)) {
      return `下载返回 HTTP ${code}`
    }
    return null
  } catch (cause) {
    const err = cause as { stderr?: unknown, message?: unknown }
    if (typeof err.stderr === 'string' && err.stderr.trim() !== '') {
      return err.stderr.trim().slice(0, 200)
    }
    return err.message !== undefined ? String(err.message) : String(cause)
  }
}

/**
 * 从各种形态的 JSON 里抠出图片 URL。
 *
 * 实测 APIMart 每张图长这样（`url` 是**数组**，不是字符串，别想当然）：
 *   {"url":["https://...png"],"expires_at":1793711160}
 * 而 OpenAI 兼容的同步站一般直接回 `{"url":"https://..."}`。
 * 早先只认字符串，于是异步任务明明跑完了也拿不到地址。
 */
function collectImageUrls(rows: unknown): string[] {
  if (!Array.isArray(rows)) return []
  const out: string[] = []
  for (const row of rows) {
    if (row === null || typeof row !== 'object') continue
    const url = (row as { url?: unknown }).url
    if (typeof url === 'string') {
      if (url !== '') out.push(url)
      continue
    }
    if (Array.isArray(url)) {
      for (const one of url) {
        if (typeof one === 'string' && one !== '') out.push(one)
      }
    }
  }
  return out
}

/**
 * 比例 × 档位 → 像素。
 *
 * 用途：openai 兼容的中转站普遍只认像素 `size`（如 `1536x1024`），不认比例。
 * 这张表取自 APIMart 官方 `gpt-image-2` 文档（`size × resolution → 实际像素`），
 * 标准 OpenAI 兼容站也能直接吃。
 */
const PIXEL_TABLE: Record<string, Record<string, string>> = {
  '1:1': { '1k': '1024x1024', '2k': '2048x2048', '4k': '2880x2880' },
  '3:2': { '1k': '1536x1024', '2k': '2048x1360', '4k': '3520x2336' },
  '2:3': { '1k': '1024x1536', '2k': '1360x2048', '4k': '2336x3520' },
  '4:3': { '1k': '1024x768', '2k': '2048x1536', '4k': '3312x2480' },
  '3:4': { '1k': '768x1024', '2k': '1536x2048', '4k': '2480x3312' },
  '5:4': { '1k': '1280x1024', '2k': '2560x2048', '4k': '3216x2576' },
  '4:5': { '1k': '1024x1280', '2k': '2048x2560', '4k': '2576x3216' },
  '16:9': { '1k': '1536x864', '2k': '2048x1152', '4k': '3840x2160' },
  '9:16': { '1k': '864x1536', '2k': '1152x2048', '4k': '2160x3840' },
  '2:1': { '1k': '2048x1024', '2k': '2688x1344', '4k': '3840x1920' },
  '1:2': { '1k': '1024x2048', '2k': '1344x2688', '4k': '1920x3840' },
  '3:1': { '1k': '1881x836', '2k': '3072x1024', '4k': '3840x1280' },
  '1:3': { '1k': '887x1774', '2k': '1024x3072', '4k': '1280x3840' },
  '21:9': { '1k': '2016x864', '2k': '2688x1152', '4k': '3840x1648' },
  '9:21': { '1k': '864x2016', '2k': '1152x2688', '4k': '1648x3840' },
}

/** 参考图允许的扩展名 → MIME。只收这四种，别的格式中转站基本也不吃。 */
const REF_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

/** 单张参考图上限（APIMart 文档：单张 ≤20MB）。 */
const MAX_REF_BYTES = 20 * 1024 * 1024
/** 参考图张数上限（APIMart 各家模型 10–16 张，取最保守的 10）。 */
const MAX_REFS = 10

/**
 * 把本地图片读成 data URI。
 *
 * 为什么不用 `POST /v1/uploads/images` 换公网 URL：APIMart 文档明确写了
 * `image_urls` 支持 base64 data URI（URL 和 base64 可混用），
 * 直接内联就不用多一条上传链路、也不用管短效链接过期。
 */
async function imageFileToDataUrl(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  const mime = REF_MIME[ext]
  if (mime === undefined) {
    throw new Error(`参考图格式不支持（只收 png / jpg / webp / gif）：${filePath}`)
  }
  let info
  try {
    info = await stat(filePath)
  } catch {
    throw new Error(`参考图不存在或读不到：${filePath}`)
  }
  if (!info.isFile()) throw new Error(`参考图不是文件：${filePath}`)
  if (info.size > MAX_REF_BYTES) {
    throw new Error(`参考图超过 20MB：${filePath}（${(info.size / 1024 / 1024).toFixed(1)}MB）`)
  }
  const bytes = await readFile(filePath)
  return `data:${mime};base64,${bytes.toString('base64')}`
}

/**
 * 把站点的错误响应压成一句人话。
 *
 * APIMart 的错误形如 `{"error":{"code":400,"message":"Invalid parameters: …"}}`；
 * 标准 OpenAI 兼容站形如 `{"error":{"message":"…"}}`。都尽量抠出 message，
 * 抠不到就退回原始文本片段——总比只有「HTTP 400」强。
 */
function describeSubmitError(status: number, text: string): string {
  const snippet = text.replace(/\s+/g, ' ').trim()
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: unknown } | string
      message?: unknown
    }
    const fromObject = typeof parsed.error === 'object' && parsed.error !== null
      ? parsed.error.message
      : undefined
    const message = typeof fromObject === 'string'
      ? fromObject
      : (typeof parsed.error === 'string' ? parsed.error : (typeof parsed.message === 'string' ? parsed.message : ''))
    if (message !== '') return `HTTP ${status}：${message}`
  } catch {
    // 不是 JSON，走下面
  }
  return `HTTP ${status}：${snippet.slice(0, 240) || '（无响应体）'}`
}

// ==================================================================
// 出图日志：每次 generate_image 一条，按天落盘 `<图片库>\.gen-tasks\YYYYMMDD.jsonl`
// ==================================================================
//
// 为什么单独存一份：中转站后台的任务日志有保留上限、会滚掉；
// 要事后分析「某类图为什么失败」（尤其审核拦截），必须自己留完整链路。
//
// 与图片旁边的 sidecar 分工不同（不能互相替代）：
//   sidecar  = 一张**产物**的身份证（随图走、永久）
//   出图日志 = 一次**任务**的病历（成功失败都记、可清理、含请求/响应原文）
//
// 体积控制：绝不写图片二进制（base64）；轮询的连续相同状态合并成一条带 repeat 计数。

/** 一次轮询采样（连续相同状态会合并）。 */
interface GenLogPoll {
  at: string
  status: string
  progress?: number
  httpStatus?: number
  /** 被合并的连续心跳次数（默认 1）。 */
  repeat?: number
}

/** 一个子任务（n 张 = n 个并发提交）。 */
interface GenLogChild {
  index: number
  status: 'submitted' | 'processing' | 'completed' | 'failed' | 'timeout' | 'submit-error'
  taskId?: string
  submitHttpStatus?: number
  /** 提交响应原文（截断，仅文本）。 */
  submitRaw?: string
  /**
   * 失败/超时前**最后一轮轮询的响应原文**。
   *
   * 为什么要存：站点的 `error.code` / `error.message` / `error.type` 都在里面，
   * 事后不用再拿 task_id 去 `/v1/tasks/{id}` 查一遍（而且任务过期就查不到了）。
   */
  failRaw?: string
  polls?: GenLogPoll[]
  costUsd?: number
  urls?: string[]
  error?: string
}

interface GenLogRecord {
  id: string
  startedAt: string
  finishedAt?: string
  elapsedMs?: number
  status: 'running' | 'completed' | 'partial' | 'failed'
  /** 记录来源：live=插件运行时；sidecar/apimart=以后补历史时标注 */
  source?: 'live' | 'sidecar' | 'apimart'
  /** 机器名（hostname），多台电脑日志合并时用于区分 */
  machine?: string
  sessionId?: string
  request: {
    baseURL: string
    protocol: string
    prompt: string
    model: string
    size?: string
    resolution?: string
    quality?: string
    n: number
    references?: { name: string, bytes: number }[]
    /** 局部重绘用的蒙版（只在传了 mask 时出现）。 */
    mask?: { name: string, bytes: number, width: number, height: number }
    extra?: Record<string, unknown>
  }
  children: GenLogChild[]
  result?: {
    dir?: string
    files?: { hash: string, width: number, height: number, bytes: number, costUsd?: number }[]
    costUsd?: number
  }
  failures?: string[]
  error?: string
}

/**
 * 日志目录：**固定**在插件缓存里（不跟图片库走）。
 *
 * 为什么不放图片库里：日志是「插件运行记录」，不是图片资产。
 * 跟着图片库走会导致——换图片库地址后，历史日志"消失"（其实还在旧目录）。
 */
function genLogsDir(): string {
  return join(exportDir(), 'gen-tasks')
}

/** 追加一条任务记录（任务结束时调用；写失败绝不影响出图）。 */
async function appendGenLog(record: GenLogRecord): Promise<void> {
  try {
    const dir = genLogsDir()
    await mkdir(dir, { recursive: true })
    const day = record.startedAt.slice(0, 10).replace(/-/g, '')
    await appendFile(join(dir, `${day}.jsonl`), `${JSON.stringify(record)}\n`, 'utf8')
  } catch (cause) {
    console.warn('[session-gallery] 出图日志写入失败（不影响出图）', cause)
  }
}

/** 读最近若干条日志（最新在前）+ 目录统计。 */
async function readGenLogs(limit: number): Promise<{
  records: GenLogRecord[]
  stats: { days: number, bytes: number, records: number, dir: string }
}> {
  const dir = genLogsDir()
  const files = (await readdir(dir).catch(() => [] as string[]))
    .filter((file) => file.endsWith('.jsonl'))
    .sort()
    .reverse()
  const records: GenLogRecord[] = []
  let bytes = 0
  let total = 0
  for (const file of files) {
    const full = join(dir, file)
    const info = await stat(full).catch(() => null)
    if (info !== null) bytes += info.size
    if (records.length >= limit) continue
    const text = await readFile(full, 'utf8').catch(() => '')
    for (const line of text.split('\n')) {
      if (line === '') continue
      total += 1
      try {
        records.push(JSON.parse(line) as GenLogRecord)
      } catch {
        // 坏行跳过
      }
    }
  }
  records.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
  return {
    records: records.slice(0, limit),
    stats: { days: files.length, bytes, records: total, dir },
  }
}

/** 清理日志：传 day 删某天，不传删全部。返回删除的文件数。 */
async function clearGenLogs(day?: string): Promise<number> {
  const dir = genLogsDir()
  if (day !== undefined && day !== '') {
    const target = join(dir, `${day.replace(/[^0-9]/g, '')}.jsonl`)
    if (!isUnder(target, dir)) return 0
    await unlink(target).catch(() => undefined)
    return 1
  }
  const files = (await readdir(dir).catch(() => [] as string[])).filter((file) => file.endsWith('.jsonl'))
  for (const file of files) await unlink(join(dir, file)).catch(() => undefined)
  return files.length
}

/** 处理出图日志：GET 列表 / POST 清理（`{ day }` 删某天，不传删全部）。 */
async function handleGenLogs(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: { writeHead(status: number, headers: Record<string, string>): void, end(body?: string): void },
): Promise<void> {
  if (req.method === 'GET' || req.method === undefined) {
    const { records, stats } = await readGenLogs(300)
    sendJson(res, 200, { records, stats })
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }
  let body: { day?: unknown } = {}
  try {
    body = JSON.parse(await readBody(req)) as { day?: unknown }
  } catch {
    body = {}
  }
  const day = typeof body.day === 'string' ? body.day : undefined
  const removed = await clearGenLogs(day)
  sendJson(res, 200, { removed })
}

/** 新建一条运行中的日志记录。 */
function newGenLog(
  args: { prompt: string, model?: string, size?: string, resolution?: string, quality?: string, n?: number, images?: string[], extra?: Record<string, unknown> },
  sessionId: string,
  gen: GenSettings,
  model: string,
  refs: { name: string, bytes: number }[],
): GenLogRecord {
  const count = Math.min(6, Math.max(1, Math.round(args.n ?? 1)))
  return {
    id: `gen-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
    startedAt: new Date().toISOString(),
    status: 'running',
    ...(sessionId === '' ? {} : { sessionId }),
    request: {
      baseURL: gen.baseURL,
      protocol: gen.protocol,
      prompt: args.prompt,
      model,
      ...(args.size === undefined ? {} : { size: args.size }),
      ...(args.resolution === undefined ? {} : { resolution: args.resolution }),
      ...(args.quality === undefined ? {} : { quality: args.quality }),
      n: count,
      ...(refs.length === 0 ? {} : { references: refs }),
      ...(args.extra === undefined ? {} : { extra: args.extra }),
    },
    children: Array.from({ length: count }, (_, index) => ({ index, status: 'submitted' as const })),
  }
}

/**
 * 调中转站出图，并**直接写进图片库**（`<图片库>\脚本产出\` + sidecar）。
 *
 * 落点由插件决定，用户改不了 —— 这样图一定会出现在「图片库」和「会话图片」里。
 */
async function generateImagesInner(
  args: {
    prompt: string
    model?: string
    size?: string
    /** 分辨率档：1k / 1.5k / 2k / 4k（各模型支持范围不同，不支持的由站点拒绝）。 */
    resolution?: string
    /**
     * 质量档：low / medium / high / xhigh / max（2.5 独有 xhigh / max）。
     *
     * 实测 2026-11-02：gpt-image-2.5-sunburst 同 prompt 同尺寸，
     * `low` = $0.004768、`high` = $0.042208，差 8.85 倍。
     * 不传时站点默认 `auto`，而 `auto` 会**按 max 档预扣资金**（结算按实际用，
     * 但余额会被占）——所以能用就显式指定。
     */
    quality?: string
    /** 张数 1–6，内部并发提交（耗时接近一张，花 n 倍钱）。 */
    n?: number
    /** 参考图本地绝对路径（垫图 / 改图）。 */
    images?: string[]
    /** 局部重绘的蒙版（本地 png 绝对路径；透明 = 允许重绘）。 */
    mask?: string
    /** 模型专有参数（background / layer_decomposition …），原样合并进请求体。 */
    extra?: Record<string, unknown>
  },
  sessionId: string,
  log: GenLogRecord,
): Promise<{ files: GenFile[], dir: string, model: string, cost?: number, failures: string[] }> {
  const gen = await readGenConfig()
  if (gen.baseURL === '') throw new Error('还没配置出图中转站，请到插件设置里填写')
  if (gen.credentialKey === '') {
    throw new Error('还没填凭据名（环境变量名，或 .credentials.yaml 里的键名），请到插件设置里填写')
  }
  const apiKey = await readCredential(gen.credentialKey)
  if (apiKey === '') throw new Error(`凭据里没有 ${gen.credentialKey}，请到插件设置里填 API Key`)

  // 传了 model 就原样用（技能/用户已经选好了），没传才用默认。
  // 这里**不做白名单校验**：白名单会把决策权从中枢抢到执行端，
  // 还会挡住「提示词优化」技能推荐的模型——技能里记的模型清单是权威的。
  const model = args.model !== undefined && args.model !== ''
    ? args.model
    : gen.defaultModel
  if (model === '') {
    throw new Error('没有指定模型，插件设置里也没设默认模型。请到插件设置「出图」区选一个默认模型')
  }

  const root = gen.baseURL.replace(/\/+$/, '').replace(/\/v1$/i, '')
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

  // 参考图 → data URI。数量、格式、大小都在这里就把关，别等站点拒。
  const refPaths = args.images ?? []
  if (refPaths.length > MAX_REFS) {
    throw new Error(`参考图最多 ${MAX_REFS} 张，这次给了 ${refPaths.length} 张`)
  }
  const refs: string[] = []
  const refMeta: { name: string, bytes: number }[] = []
  for (const filePath of refPaths) {
    refs.push(await imageFileToDataUrl(filePath))
    const info = await stat(filePath).catch(() => null)
    refMeta.push({ name: basename(filePath), bytes: info?.size ?? 0 })
  }

  // mask（局部重绘）：只在支持的协议/模型上启用，失败在提交前就报出来
  let maskInfo: { dataUrl: string, bytes: number, width: number, height: number } | undefined
  if (args.mask !== undefined && args.mask !== '') {
    if (gen.protocol === 'openai-compat') {
      throw new Error(
        'mask 只支持 APIMart 异步协议（apimart-async）；当前通道是 openai-compat（OpenAI 兼容），'
        + '它的 /v1/images/generations 没有 mask 字段。请换成 apimart-async 通道再试',
      )
    }
    if (!modelSupportsMask(model)) {
      throw new Error(
        `当前线路不支持 mask：模型 "${model}" 没有局部重绘能力。`
        + '请换成 gpt-image-2.5-flare / gpt-image-2.5-sunburst / gpt-image-2-official',
      )
    }
    if (refPaths.length === 0) throw new Error('传 mask 时必须同时传 images（第一张为原图）')
    maskInfo = await loadMask(args.mask, refPaths[0])
  }

  // 日志：补全请求信息（只有这里才知道实际用的 model / 协议 / 参考图）
  const count = Math.min(6, Math.max(1, Math.round(args.n ?? 1)))
  log.request = {
    baseURL: gen.baseURL,
    protocol: gen.protocol,
    prompt: args.prompt,
    model,
    ...(args.size === undefined ? {} : { size: args.size }),
    ...(args.resolution === undefined ? {} : { resolution: args.resolution }),
    ...(args.quality === undefined ? {} : { quality: args.quality }),
    n: count,
    ...(refMeta.length === 0 ? {} : { references: refMeta }),
    ...(maskInfo === undefined ? {} : {
      mask: {
        name: args.mask === undefined ? '' : basename(args.mask),
        bytes: maskInfo.bytes,
        width: maskInfo.width,
        height: maskInfo.height,
      },
    }),
    ...(args.extra === undefined ? {} : { extra: args.extra }),
  }
  log.children = Array.from({ length: count }, (_, index) => ({ index, status: 'submitted' as const }))

  /**
   * 拼请求体。
   *
   * **不按模型分表**：同一个中转站里 `gpt-image-2` 支持 15 种比例 / 1k-2k-4k，
   * `Seedream-5.0-Pro` 只有 10 种比例 / 1k-1.5k-2k，传超范围直接 400。
   * 插件在这里**当通道、不当守门人**：参数原样传，让站点用自己的文档校验，
   * 错误原话透回去，AI 自己就能纠正。「哪个模型支持什么」这条知识归技能文档，
   * 插件永远不追它。
   */
  const buildBody = (): string => {
    const body: Record<string, unknown> = {
      model,
      prompt: args.prompt,
      // 两个主流模型都只支持一次请求出 1 张（gpt-image-2 静默忽略还照扣钱，
      // Seedream 直接 400），所以多张由下面并发提交来补，n 字段永远传 1。
      n: 1,
    }
    if (gen.protocol === 'openai-compat') {
      // 标准 OpenAI 只认像素 size，没有 resolution 字段。
      const ratio = args.size ?? '1:1'
      const tier = (args.resolution ?? '1k').toLowerCase()
      body.size = PIXEL_TABLE[ratio]?.[tier] ?? PIXEL_TABLE[ratio]?.['1k'] ?? '1024x1024'
      if (refs.length > 0) body.image = refs
    } else {
      if (args.size !== undefined) body.size = args.size
      if (args.resolution !== undefined) body.resolution = args.resolution
      if (refs.length > 0) body.image_urls = refs
      // 局部重绘：mask_url 接受 base64 data URI（2026-11-06 实测通过）
      if (maskInfo !== undefined) body.mask_url = maskInfo.dataUrl
    }
    // quality 两种协议都放顶层（2.5 支持；gpt-image-2 不支持时由站点忽略或拒绝）
    if (args.quality !== undefined) body.quality = args.quality
    // 专有参数原样并进去（background / layer_decomposition / official_fallback …）
    if (args.extra !== undefined) Object.assign(body, args.extra)
    return JSON.stringify(body)
  }

  /** 一次提交 + 轮询，返回这一张的结果 URL。 */
  const submitOnce = async (index: number): Promise<{ urls: string[], cost?: number, taskId: string }> => {
    const child = log.children[index]
    const submit = await curlRequest(`${root}/v1/images/generations`, {
      method: 'POST',
      headers,
      body: buildBody(),
      proxy: gen.proxy,
      timeoutSec: 120,
    })
    if (child !== undefined) {
      child.submitHttpStatus = submit.status
      child.submitRaw = submit.text.slice(0, 8000)
    }
    if (submit.status === 0) throw new Error('连不上中转站：检查地址，或设置里的代理')
    if (submit.status === 401 || submit.status === 403) throw new Error('API Key 不被接受（401/403）')
    if (submit.status === 429) throw new Error('中转站限流（HTTP 429）：这次请求被站点拒绝了')
    if (submit.status !== 200) throw new Error(describeSubmitError(submit.status, submit.text))

    // 提交返回（实测 APIMart）：
    //   {"code":200,"data":[{"status":"submitted","task_id":"task_01M6..."}]}
    // task_id 在 data[0] 里、**不在顶层**。同步站则直出 {"data":[{"url":"..."}]}。
    let parsed: {
      task_id?: unknown
      data?: { task_id?: unknown, url?: unknown, b64_json?: unknown }[]
    }
    try {
      parsed = JSON.parse(submit.text) as typeof parsed
    } catch {
      throw new Error(`提交返回的不是 JSON：${submit.text.slice(0, 200)}`)
    }

    const taskId = typeof parsed.task_id === 'string'
      ? parsed.task_id
      : (Array.isArray(parsed.data) && typeof parsed.data[0]?.task_id === 'string' ? parsed.data[0].task_id : '')
    if (child !== undefined && taskId !== '') child.taskId = taskId

    if (taskId === '') {
      const found = collectImageUrls(parsed.data)
      if (found.length === 0) {
        const snippet = submit.text.replace(/\s+/g, ' ').trim().slice(0, 200)
        throw new Error(`中转站既没给任务号、也没给图片地址，返回是：${snippet}`)
      }
      if (child !== undefined) {
        child.status = 'completed'
        child.urls = found
      }
      return { urls: found, taskId: '' }
    }

    const deadline = Date.now() + 10 * 60 * 1000
    let lastError = ''
    /** 最后一轮轮询的响应原文（失败/超时时写进日志，省得事后还要再查）。 */
    let lastPollRaw = ''
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2500))
      const poll = await curlRequest(`${root}/v1/tasks/${taskId}`, { headers, proxy: gen.proxy })
      lastPollRaw = poll.text.slice(0, 8000)
      if (poll.status !== 200) { lastError = `HTTP ${poll.status}`; continue }
      // 轮询返回（实测 APIMart）：
      //   {"code":200,"data":{"status":"completed","progress":100,"cost":0.0085,
      //     "result":{"images":[{"url":["https://..."],"expires_at":...}]}}}
      // 注意 url 是**数组**，不是字符串。
      let task: {
        status?: unknown
        data?: {
          status?: unknown
          progress?: unknown
          cost?: unknown
          result?: { images?: unknown }
          images?: unknown
        }
      }
      try {
        task = JSON.parse(poll.text) as typeof task
      } catch {
        lastError = '返回不是 JSON'
        continue
      }
      const state = String(task.status ?? task.data?.status ?? '')
      const progress = typeof task.data?.progress === 'number' ? task.data.progress : undefined
      // 记轮询轨迹：连续相同（状态 + 进度）合并成一条 repeat 计数，信息不丢、体积小
      if (child !== undefined) {
        const polls = child.polls ?? (child.polls = [])
        const prev = polls[polls.length - 1]
        if (prev !== undefined && prev.status === state && prev.progress === progress) {
          prev.repeat = (prev.repeat ?? 1) + 1
        } else {
          polls.push({
            at: new Date().toISOString(),
            status: state,
            ...(progress === undefined ? {} : { progress }),
            httpStatus: poll.status,
          })
        }
        if (state !== '') child.status = /fail|error/i.test(state) ? 'failed' : 'processing'
      }
      const found = collectImageUrls(task.data?.result?.images ?? task.data?.images)
      if (found.length > 0) {
        if (child !== undefined) {
          child.status = 'completed'
          child.urls = found
          if (typeof task.data?.cost === 'number') child.costUsd = task.data.cost
        }
        return {
          urls: found,
          ...(typeof task.data?.cost === 'number' ? { cost: task.data.cost } : {}),
          taskId,
        }
      }
      if (/fail|error/i.test(state)) {
        // 站点在 failed 时把真实原因放在 error.message（APIMart 文档：
        // "failed → check error.message"）。必须原样透传——否则上层只能看到
        // 「任务失败」，会误判成超时/拥堵，进而擅自换模型（2026-11-03 实际事故）。
        const failMessage = String(
          (task as { error?: { message?: unknown }, data?: { error?: { message?: unknown } } }).error?.message
          ?? (task as { data?: { error?: { message?: unknown } } }).data?.error?.message
          ?? '',
        ).trim()
        lastError = failMessage !== '' ? `任务失败：${failMessage}` : `任务失败（${state}）`
        break
      }
    }
    // 失败（轮询里给出 failed 状态）和超时是两回事：失败有明确的失败原因
    // （已原样透传到 lastError 里），超时则是任务可能还在跑、钱可能已经花了。
    // 两种都**只报事实**，不推断「重试有没有用」——2026-11-05 实测：站点回
    // 「内容安全审核拒绝」之后，原样重试一次就成功了。插件没有依据下这种结论。
    if (lastError.startsWith('任务失败：')) {
      if (child !== undefined) {
        child.status = 'failed'
        if (lastPollRaw !== '') child.failRaw = lastPollRaw
      }
      throw new Error(lastError)
    }
    // 超时时任务很可能还在跑，钱也早就花了。把任务号给出来，
    // 别写成「失败」让人以为图丢了、钱白花了。
    if (child !== undefined) {
      child.status = 'timeout'
      if (lastPollRaw !== '') child.failRaw = lastPollRaw
    }
    throw new Error(
      `出图任务超时（${lastError === '' ? '还停在处理中' : lastError}）。`
      + `任务号 ${taskId}，图可能仍在生成，稍后可以查回（GET /v1/tasks/${taskId}）。`,
    )
  }

  // 2. 并发提交 n 次（不是传 n 个——站点不认，还会扣错钱），再并发等结果。
  //    生成时间才是瓶颈（20–45 秒），提交本身只要 1–2 秒，
  //    所以 n 张的总耗时≈最长那张，而不是 n 倍。
  const settled = await Promise.allSettled(
    Array.from({ length: count }, (_, index) => submitOnce(index)),
  )

  /** 待下载的图，带着自己那个任务的 cost 与 taskId —— 不能全写总额，否则 n 张图里
   *  每张 sidecar 都记一遍总花费，看起来像花了 n 倍钱。 */
  const pending: { url: string, cost?: number, taskId?: string }[] = []
  const failures: string[] = []
  let cost: number | undefined
  for (const [index, outcome] of settled.entries()) {
    const child = log.children[index]
    if (outcome.status === 'fulfilled') {
      for (const url of outcome.value.urls) {
        pending.push({
          url,
          ...(outcome.value.cost === undefined ? {} : { cost: outcome.value.cost }),
          ...(outcome.value.taskId === '' ? {} : { taskId: outcome.value.taskId }),
        })
      }
      if (outcome.value.cost !== undefined) cost = (cost ?? 0) + outcome.value.cost
      if (child !== undefined) child.status = 'completed'
    } else {
      const message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)
      failures.push(message)
      if (child !== undefined) {
        child.status = message.includes('超时') ? 'timeout' : 'failed'
        child.error = message
      }
    }
  }
  if (pending.length === 0) {
    throw new Error(failures.length > 0 ? failures.join('；') : '没有拿到任何图片地址')
  }

  // 3. 下载并入库
  const settings = await readSettings()
  const dir = join(settings.root, '脚本产出')
  await mkdir(dir, { recursive: true })

  const files: GenFile[] = []
  // 发号器：扫一次库取当前 `G-` 最大号，这批图逐张 +1
  const allocNo = await noAllocatorIfShared()
  // n 上限 6；同步站一个任务可能回多张，给到 12 兜住
  for (const { url, cost: itemCost, taskId: itemTaskId } of pending.slice(0, 12)) {
    const tmp = join(dir, `.dl-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`)
    // 下载失败重试一次：任务刚 completed 时 CDN 偶尔还没就绪，第二次通常就通。
    // 两次都失败才记进 failures —— 不能再静默丢掉（那样钱花了、图没了、
    // 用户还以为只出了一张）。
    let reason = await downloadTo(url, tmp, gen.proxy)
    if (reason !== null) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      reason = await downloadTo(url, tmp, gen.proxy)
    }
    if (reason !== null) {
      failures.push(`图片下载失败（${reason}）：${url}`)
      await unlink(tmp).catch(() => {})
      continue
    }
    const bytes = await readFile(tmp)
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
    const size = imageSizeOf(bytes)
    const target = join(dir, `${hash}${size.ext}`)
    await rename(tmp, target).catch(async () => {
      await writeFile(target, bytes)
      await unlink(tmp).catch(() => {})
    })
    const now = new Date().toISOString()
    const sidecar = {
      schemaVersion: 2,
      origin: 'script',
      ...(sessionId === '' ? {} : { sessionId }),
      prompt: args.prompt,
      model,
      channel: 'plugin',
      // 没传 size 就不写这个字段：站点会自己挑比例（实测 1:1 的请求回了
      // 1536×1024），写死 '1:1' 等于记一个假值。准确尺寸看 width/height。
      ...(args.size === undefined ? {} : { size: args.size }),
      ...(args.resolution === undefined ? {} : { resolution: args.resolution }),
      // quality 是 2.5 系列按质量计费的档位；gpt-image-2 传了也会被站点忽略，
      // 所以原样记录请求值 —— 大图「质量」一栏要能对上当时发的是哪一档。
      ...(args.quality === undefined || args.quality === '' ? {} : { quality: args.quality }),
      ...(refPaths.length === 0 ? {} : { referenceCount: refPaths.length }),
      // 局部重绘：记下用过蒙版，方便回看「这张是 mask 改出来的」
      ...(maskInfo === undefined ? {} : {
        mask: {
          name: args.mask === undefined ? '' : basename(args.mask),
          bytes: maskInfo.bytes,
          width: maskInfo.width,
          height: maskInfo.height,
        },
      }),
      width: size.width,
      height: size.height,
      bytes: bytes.length,
      hash,
      // 这张图自己那次任务的花费与任务号（不是本批总额）。
      ...(itemCost === undefined ? {} : { costUsd: itemCost }),
      ...(itemTaskId === undefined ? {} : { taskId: itemTaskId }),
      createdAt: now,
      importedAt: now,
    }
    // 合并写：同一 hash 重复出图时，保留站点已经写进去的分组 / 标签 / 编号
    await writeSidecarMerged(join(dir, `${hash}.json`), sidecar, allocNo)
    files.push({ path: target, width: size.width, height: size.height, bytes: bytes.length, hash })
  }

  if (files.length === 0) throw new Error('图片下载失败（地址可能已过期）')
  log.result = {
    dir,
    files: files.map((file) => ({
      hash: file.hash,
      width: file.width,
      height: file.height,
      bytes: file.bytes,
    })),
    ...(cost === undefined ? {} : { costUsd: cost }),
  }
  log.failures = failures
  return { files, dir, model, failures, ...(cost === undefined ? {} : { cost }) }
}

/**
 * 出图入口（带日志）。
 *
 * 包一层的原因：无论成功、失败、提交错误还是超时，都要落一条完整日志。
 * `generateImagesInner` 只负责出图；这里负责计时、状态与写盘。
 */
async function generateImages(
  args: {
    prompt: string
    model?: string
    size?: string
    resolution?: string
    quality?: string
    n?: number
    images?: string[]
    /** 局部重绘的蒙版（本地 png 绝对路径；透明 = 允许重绘）。 */
    mask?: string
    extra?: Record<string, unknown>
  },
  sessionId: string,
): Promise<{ files: GenFile[], dir: string, model: string, cost?: number, failures: string[] }> {
  const started = Date.now()
  const log: GenLogRecord = {
    id: `gen-${started.toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
    startedAt: new Date(started).toISOString(),
    status: 'running',
    source: 'live',
    machine: MACHINE_NAME,
    ...(sessionId === '' ? {} : { sessionId }),
    request: {
      baseURL: '',
      protocol: '',
      prompt: args.prompt,
      model: args.model ?? '',
      n: Math.min(6, Math.max(1, Math.round(args.n ?? 1))),
    },
    children: [],
  }
  try {
    const result = await generateImagesInner(args, sessionId, log)
    log.status = result.failures.length > 0 ? 'partial' : 'completed'
    return result
  } catch (cause) {
    log.status = 'failed'
    log.error = cause instanceof Error ? cause.message : String(cause)
    // 子任务状态可能还没标（比如提交就抛错），统一补一次
    for (const child of log.children) {
      if (child.status === 'submitted' || child.status === 'processing') {
        child.status = log.error.includes('超时') ? 'timeout' : 'failed'
        if (child.error === undefined) child.error = log.error
      }
    }
    throw cause
  } finally {
    log.finishedAt = new Date().toISOString()
    log.elapsedMs = Date.now() - started
    await appendGenLog(log)
  }
}

/**
 * 在系统文件管理器里定位这张图（资源管理器里选中它）。
 *
 * 浏览器侧没有「打开所在文件夹」的能力，只能由宿主进程起一个 explorer。
 * 安全边界与删除一致：只接受图片库根 / 旧图目录内**确实存在**的文件。
 *
 * 2026-11-03 修：`execFile('explorer.exe')` 依赖宿主 PATH，而 DSH 桌面版宿主
 * 由 Electron 启动，PATH 里不一定含 System32 —— 表现就是「提示已定位、但没窗口」。
 * 和 curl 一样改用 `%SystemRoot%\explorer.exe` 绝对路径，并把失败原因回给前端。
 */
function resolveExplorer(): string {
  const systemRoot = process.env.SystemRoot ?? process.env.windir ?? 'C:\\Windows'
  const full = join(systemRoot, 'explorer.exe')
  return existsSync(full) ? full : 'explorer.exe'
}

function revealInFileManager(target: string): void {
  if (process.platform === 'win32') {
    // /select, 后面紧跟路径；explorer 的退出码不可靠（正常也常返回 1），这里不因退出码判失败
    const explorer = resolveExplorer()
    execFile(explorer, [`/select,${target}`], { windowsHide: false }, (cause) => {
      // 只有「根本起不来」才打日志（找不到可执行文件等），退出码 1 是正常现象
      if (cause !== null && cause !== undefined) {
        console.warn('[session-gallery] 打开文件夹失败', cause)
      }
    })
    return
  }
  if (process.platform === 'darwin') {
    execFile('open', ['-R', target], () => {})
    return
  }
  execFile('xdg-open', [dirname(target)], () => {})
}

/**
 * 启动资源管理器并等它真正 spawn 起来（只等启动，不等窗口）。
 *
 * 区分三种结果，前端据此给不同提示：
 *   - started  : 进程起来了（窗口是否前置不确定，但不会「点了没反应」）
 *   - not-found: explorer.exe 不存在
 *   - failed   : 其他启动失败（权限等）
 */
async function revealAndWait(target: string): Promise<{ ok: boolean, detail?: string }> {
  if (process.platform !== 'win32') {
    revealInFileManager(target)
    return { ok: true }
  }
  const explorer = resolveExplorer()
  return await new Promise((resolve) => {
    let settled = false
    const finish = (value: { ok: boolean, detail?: string }): void => {
      if (settled) return
      settled = true
      resolve(value)
    }
    const child = execFile(explorer, [`/select,${target}`], { windowsHide: false }, (cause) => {
      // 能跑起来就算成功；退出码非 0 是 explorer 的常态
      if (cause === null || cause === undefined) {
        finish({ ok: true })
        return
      }
      const code = (cause as NodeJS.ErrnoException).code
      finish(code === 'ENOENT'
        ? { ok: false, detail: `找不到 ${explorer}` }
        : { ok: true, detail: `explorer 退出码非 0（通常无影响）：${code ?? 'unknown'}` })
    })
    child.on('error', (cause) => {
      const code = (cause as NodeJS.ErrnoException).code
      finish(code === 'ENOENT'
        ? { ok: false, detail: '找不到 explorer.exe' }
        : { ok: false, detail: `启动 explorer 失败：${code ?? cause.message}` })
    })
  })
}

/** 处理「打开所在文件夹」请求。 */
async function handleReveal(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: { path?: unknown }
  try {
    body = JSON.parse(await readBody(req)) as { path?: unknown }
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }

  const raw = body.path
  if (typeof raw !== 'string' || raw === '') {
    sendJson(res, 400, { error: 'no-path' })
    return
  }

  const target = resolve(raw)
  const settings = await readSettings()
  const roots = [settings.root, ...settings.legacyRoots]
  if (!roots.some((root) => isUnder(target, root))) {
    sendJson(res, 403, { error: 'outside-library' })
    return
  }
  const info = await stat(target).catch(() => null)
  if (info === null || !info.isFile()) {
    sendJson(res, 404, { error: 'not-found' })
    return
  }

  const result = await revealAndWait(target)
  sendJson(res, 200, {
    ok: result.ok,
    path: target,
    ...(result.detail === undefined ? {} : { detail: result.detail }),
  })
}

/**
 * 删除图片库里的图。
 *
 * 默认**移到回收站**（`<root>\.dshsg-trash\`，可恢复）；
 * `permanent: true` 才真删。同名 sidecar 一并处理。
 * 只接受图片库根 / 旧图目录内的图片文件，其余一律拒绝。
 */
async function handleDelete(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: { paths?: unknown, permanent?: unknown }
  try {
    body = JSON.parse(await readBody(req)) as { paths?: unknown, permanent?: unknown }
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }

  const rawPaths = Array.isArray(body.paths) ? body.paths : []
  const paths = rawPaths.filter((p): p is string => typeof p === 'string' && p !== '')
  if (paths.length === 0) {
    sendJson(res, 400, { error: 'no-paths' })
    return
  }
  const permanent = body.permanent === true

  const settings = await readSettings()
  const roots = [settings.root, ...settings.legacyRoots]
  const trashDir = join(settings.root, TRASH_DIR_NAME)
  const failed: { path: string, error: string }[] = []
  const targets: { target: string, sidecar: string }[] = []

  for (const raw of paths) {
    const target = resolve(raw)
    const ext = extname(target).toLowerCase()
    if (!IMAGE_EXT.has(ext)) {
      failed.push({ path: raw, error: 'not-an-image' })
      continue
    }
    if (!roots.some((root) => isUnder(target, root))) {
      failed.push({ path: raw, error: 'outside-library' })
      continue
    }
    const sidecar = target.slice(0, -ext.length) + '.json'
    const info = await stat(target).catch(() => null)
    if (info === null || !info.isFile()) {
      failed.push({ path: raw, error: 'not-found' })
      continue
    }
    targets.push({ target, sidecar })
  }

  const succeeded: string[] = []
  let mode: 'permanent' | 'recycle-bin' | 'trash' = permanent ? 'permanent' : 'recycle-bin'

  if (permanent) {
    for (const { target, sidecar } of targets) {
      try {
        await unlink(target)
        await unlink(sidecar).catch(() => undefined)
        succeeded.push(target)
      } catch (cause) {
        failed.push({ path: target, error: cause instanceof Error ? cause.message : String(cause) })
      }
    }
  } else {
    // ① 优先把图片与 sidecar 一起送进 Windows 回收站
    const allFiles: string[] = []
    for (const { target, sidecar } of targets) {
      allFiles.push(target)
      const exists = await stat(sidecar).catch(() => null)
      if (exists !== null && exists.isFile()) allFiles.push(sidecar)
    }
    const recycled = await recycleToWindowsBin(allFiles)
    if (recycled.ok) {
      for (const { target } of targets) succeeded.push(target)
      const bad = new Set(recycled.failedPaths.map((p) => resolve(p)))
      for (const path of bad) failed.push({ path, error: 'recycle-failed' })
    } else {
      // ② 非 Windows 或回收站不可用：回退到插件自建回收站目录
      mode = 'trash'
      for (const { target, sidecar } of targets) {
        try {
          await mkdir(trashDir, { recursive: true })
          const stamp = Date.now().toString(36)
          await rename(target, join(trashDir, `${stamp}-${basename(target)}`))
          await rename(sidecar, join(trashDir, `${stamp}-${basename(sidecar)}`)).catch(() => undefined)
          succeeded.push(target)
        } catch (cause) {
          failed.push({ path: target, error: cause instanceof Error ? cause.message : String(cause) })
        }
      }
    }
  }

  sendJson(res, 200, {
    mode,
    deleted: succeeded.length,
    failed,
    trashDir: mode === 'trash' ? trashDir : undefined,
  })
}

/**
 * 用 Windows 回收站删除一批文件（通过 PowerShell 的 Microsoft.VisualBasic）。
 * 非 Windows 直接返回不可用，由调用方回退。
 */
function recycleToWindowsBin(paths: string[]): Promise<{ ok: boolean, failedPaths: string[] }> {
  if (process.platform !== 'win32' || paths.length === 0) {
    return Promise.resolve({ ok: false, failedPaths: [] })
  }
  // 单次命令控制长度
  const batch = paths.slice(0, 50)
  const list = batch.map((p) => `'${p.replace(/'/g, "''")}'`).join(',')
  const script = [
    'Add-Type -AssemblyName Microsoft.VisualBasic;',
    `$paths = @(${list});`,
    '$bad = @();',
    'foreach ($p in $paths) {',
    '  try { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, "OnlyErrorDialogs", "SendToRecycleBin") }',
    '  catch { $bad += $p }',
    '};',
    'if ($bad.Count -gt 0) { Write-Output ("FAILED:" + ($bad -join "|")) }',
  ].join(' ')
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 120000, windowsHide: true },
      (error, stdout) => {
        const text = String(stdout ?? '')
        const marker = text.indexOf('FAILED:')
        if (error !== null) {
          resolve({ ok: false, failedPaths: [] })
          return
        }
        if (marker >= 0) {
          const rest = text.slice(marker + 7).trim()
          resolve({ ok: true, failedPaths: rest === '' ? [] : rest.split('|') })
          return
        }
        resolve({ ok: true, failedPaths: [] })
      },
    )
  })
}

// ==================================================================
// 归档：手动「存入图片库」用的去重索引
// ==================================================================

/** 媒体类型 → 扩展名（与导出逻辑一致）。 */
function extOfMedia(mediaType: string | undefined): string {
  switch (mediaType) {
    case 'image/jpeg': return '.jpg'
    case 'image/webp': return '.webp'
    case 'image/gif': return '.gif'
    case 'image/bmp': return '.bmp'
    case 'image/svg+xml': return '.svg'
    default: return '.png'
  }
}

/** 文件名里的时间戳：YYYYMMDD-HHmmss（本地时间）。 */
function stampOf(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** 会话短目录名。 */
function sessionFolderName(sessionId: string): string {
  const short = sessionId.replace(/^session-/, '').replace(/[^a-zA-Z0-9]+/g, '').slice(0, 8)
  return short === '' ? 'unknown' : short
}

/** 归档去重索引（attachmentId → 已入库的相对路径）。 */
function importedIndexFile(): string {
  return join(exportDir(), 'imported.json')
}

type ImportedIndex = Record<string, string>

async function readImportedIndex(): Promise<ImportedIndex> {
  try {
    const raw = await readFile(importedIndexFile(), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: ImportedIndex = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

async function saveImportedIndex(index: ImportedIndex): Promise<void> {
  try {
    await mkdir(exportDir(), { recursive: true })
    await writeFile(importedIndexFile(), JSON.stringify(index), 'utf8')
  } catch {
    // 索引写失败只影响去重，不影响已成文件
  }
}


// ==================================================================
// 手动导入（反向进入：本地图片 → 图片库）
// ==================================================================

interface ManualImportItem {
  name?: unknown
  dataBase64?: unknown
  mediaType?: unknown
}

/** 处理手动导入请求（base64 传输，单文件上限 32 MB，单次最多 20 张）。 */
async function handleManualImport(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string): void
  },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: { sessionId?: unknown, files?: unknown }
  try {
    body = JSON.parse(await readBody(req, 96 * 1024 * 1024)) as { sessionId?: unknown, files?: unknown }
  } catch (cause) {
    sendJson(res, 400, {
      error: cause instanceof Error && cause.message === 'body-too-large' ? 'payload-too-large' : 'invalid-request',
    })
    return
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  const rawFiles = Array.isArray(body.files) ? body.files : []
  const files = rawFiles.slice(0, 20) as ManualImportItem[]
  if (files.length === 0) {
    sendJson(res, 400, { error: 'no-files' })
    return
  }

  const settings = await readSettings()
  const dir = join(settings.root, MANUAL_IMPORT_DIR)
  try {
    await mkdir(dir, { recursive: true })
  } catch {
    sendJson(res, 500, { error: 'mkdir-failed' })
    return
  }

  const saved: { path: string, name: string }[] = []
  const failed: { name: string, error: string }[] = []
  // 手动导入的图也由插件产出入库，同样发 `G-` 号
  const allocNo = await noAllocatorIfShared()

  for (const file of files) {
    const name = typeof file.name === 'string' && file.name !== '' ? file.name : 'image.png'
    const encoded = typeof file.dataBase64 === 'string' ? file.dataBase64 : ''
    if (encoded === '') {
      failed.push({ name, error: 'empty' })
      continue
    }
    try {
      const data = Buffer.from(encoded, 'base64')
      if (data.length === 0 || data.length > 32 * 1024 * 1024) {
        failed.push({ name, error: 'size-out-of-range' })
        continue
      }
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 12)
      const mediaType = typeof file.mediaType === 'string' ? file.mediaType : undefined
      const ext = extOfMedia(mediaType)
      const fileName = `${stampOf(Date.now())}-${hash}${ext}`
      const filePath = join(dir, fileName)
      await writeFile(filePath, data)
      const now = new Date().toISOString()
      const sidecar = {
        schemaVersion: 2,
        origin: 'manual',
        originalName: name,
        ...(sessionId === '' ? {} : { sessionId }),
        mediaType,
        createdAt: now,
        importedAt: now,
      }
      await writeSidecarMerged(filePath.slice(0, -ext.length) + '.json', sidecar, allocNo)
      saved.push({ path: filePath, name: fileName })
    } catch (cause) {
      failed.push({ name, error: cause instanceof Error ? cause.message : String(cause) })
    }
  }

  sendJson(res, 200, { files: saved, failed, dir })
}

/**
 * 把会话附件「存入图片库」（C 方案：会话图片里选中未归档的图 → 一键归档）。
 * 写入 `<图片库>\会话导入\<会话短id>\`，sidecar 带 sessionId / sourceAttachmentId / origin。
 */
async function handleArchive(
  req: {
    method?: string
    headers: Record<string, string | string[] | undefined>
    on(event: string, cb: (chunk?: unknown) => void): void
  },
  res: { writeHead(status: number, headers: Record<string, string>): void, end(body?: string): void },
  attachments: { readImage(ref: unknown): Promise<{ ref?: { mediaType?: string }, data: Uint8Array }> },
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method-not-allowed' })
    return
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: 'origin-rejected' })
    return
  }

  let body: { sessionId?: unknown, items?: unknown }
  try {
    body = JSON.parse(await readBody(req, 4 * 1024 * 1024)) as { sessionId?: unknown, items?: unknown }
  } catch {
    sendJson(res, 400, { error: 'invalid-request' })
    return
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : []
  if (rawItems.length === 0) {
    sendJson(res, 400, { error: 'no-items' })
    return
  }

  const settings = await readSettings()
  const folder = join(settings.root, SESSION_IMPORT_DIR, sessionFolderName(sessionId))
  const index = await readImportedIndex()
  const saved: { path: string }[] = []
  const failed: { error: string }[] = []
  let changed = false
  // 归档进来的图也由插件产出入库，同样发 `G-` 号
  const allocNo = await noAllocatorIfShared()

  /**
   * 出图脚本刚出的图：gen 目录里有同 hash 的 sidecar，归档时把创作元数据（提示词 / 模型 /
   * 渠道 / 成本 …）一起带过来。不带的话，归档后的 sidecar 只剩「像素 / 体积」，
   * 左浮条的提示词与模型永久丢失 —— 而这恰恰是用户归档后最想回头看的东西。
   */
  const genMeta = new Map<string, Record<string, unknown>>()
  for (const entry of await readGenSidecars()) {
    if (!genMeta.has(entry.hash)) genMeta.set(entry.hash, entry.meta)
  }

  for (const raw of rawItems) {
    const item = raw as { attachment?: unknown, origin?: unknown }
    const origin = item.origin === 'user' ? 'user' : 'tool'
    if (item.attachment === undefined || item.attachment === null || typeof item.attachment !== 'object') {
      failed.push({ error: 'invalid-attachment' })
      continue
    }
    const attachmentId = (item.attachment as { attachmentId?: unknown }).attachmentId
    if (typeof attachmentId === 'string' && index[attachmentId] !== undefined) {
      // 已归档过：直接复用
      saved.push({ path: join(settings.root, index[attachmentId] as string) })
      continue
    }
    try {
      const stored = await attachments.readImage(item.attachment)
      const data = Buffer.from(stored.data)
      if (data.length === 0 || data.length > 64 * 1024 * 1024) {
        failed.push({ error: 'size-out-of-range' })
        continue
      }
      const mediaType = stored.ref?.mediaType ?? (item.attachment as { mediaType?: string }).mediaType
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 12)
      const fileName = `${stampOf(Date.now())}-${hash}${extOfMedia(mediaType)}`
      await mkdir(folder, { recursive: true })
      const filePath = join(folder, fileName)
      await writeFile(filePath, data)
      const now = new Date().toISOString()
      const source = item.attachment as {
        attachmentId?: string
        mediaType?: string
        width?: number
        height?: number
        bytes?: number
      }
      const borrowed = genMeta.get(hash) ?? {}
      const sidecar = {
        // 先铺脚本 sidecar 的创作元数据（prompt / model / channel / size / costUsd / taskId …）
        ...borrowed,
        schemaVersion: 2,
        // 来源保留脚本标记，图片库按「脚本产物」筛时仍能筛到
        origin: typeof borrowed.origin === 'string' ? borrowed.origin : origin,
        sessionId,
        ...(typeof attachmentId === 'string' ? { sourceAttachmentId: attachmentId } : {}),
        ...(mediaType === undefined ? {} : { mediaType }),
        ...(source.width === undefined ? {} : { width: source.width }),
        ...(source.height === undefined ? {} : { height: source.height }),
        // 出图时间优先保留原值，否则排序会按「归档时间」走，图会排到最后
        createdAt: typeof borrowed.createdAt === 'string' ? borrowed.createdAt : now,
        importedAt: now,
      }
      // 合并写：`borrowed` 里可能带着 `no`，同一张图归档后不该换号
      await writeSidecarMerged(
        filePath.slice(0, -extname(filePath).length) + '.json',
        sidecar,
        allocNo,
      )
      if (typeof attachmentId === 'string') index[attachmentId] = relative(settings.root, filePath)
      saved.push({ path: filePath })
      changed = true
    } catch (cause) {
      failed.push({ error: cause instanceof Error ? cause.message : String(cause) })
    }
  }

  if (changed) await saveImportedIndex(index)
  sendJson(res, 200, { files: saved, failed, dir: folder })
}
