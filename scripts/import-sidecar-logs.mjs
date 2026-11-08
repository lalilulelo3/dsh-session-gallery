#!/usr/bin/env node
/**
 * 从图片旁的 sidecar 反推出图日志（补历史用）。
 *
 * 为什么需要：出图日志 2026-11-03 才实现，之前的出图没有日志。
 * sidecar 里记着 prompt / model / 参数 / 成本 / 时间，足以还原"摘要级"记录。
 *
 * 与真实运行记录的区别：
 *   - 标 `source: "sidecar"`（真实记录是 `live`）
 *   - 没有提交响应、轮询轨迹、失败原因（那些只在插件运行时才有）
 *
 * 用法：
 *   node scripts/import-sidecar-logs.mjs --date 2026-11-03
 *   node scripts/import-sidecar-logs.mjs --date 2026-11-03 --dry-run
 *   node scripts/import-sidecar-logs.mjs            # 全部历史
 *
 * 去重：日志里已有同 hash 的产物则跳过；同一 hash 只写一次。
 */
import { readdir, readFile, mkdir, appendFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { homedir, hostname } from 'node:os'

const args = process.argv.slice(2)
const argOf = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback
}
const dateArg = argOf('--date', '')
const dryRun = args.includes('--dry-run')

const cacheDir = join(homedir(), '.dsh', 'cache', 'session-gallery')
const logDir = join(cacheDir, 'gen-tasks')
const settings = JSON.parse(await readFile(join(cacheDir, 'settings.json'), 'utf8').catch(() => '{}'))
const root = argOf('--root', settings.root)
if (root === undefined || root === '') {
  console.error('找不到图片库路径：用 --root 指定')
  process.exit(1)
}

/** 递归收集 .json（跳过点目录）。 */
async function collectSidecars(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectSidecars(full, out)
    } else if (entry.name.endsWith('.json')) {
      out.push(full)
    }
  }
  return out
}

/** 已写入日志的产物 hash（去重用）。 */
async function existingHashes() {
  const out = new Set()
  const files = (await readdir(logDir).catch(() => [])).filter((file) => file.endsWith('.jsonl'))
  for (const file of files) {
    const text = await readFile(join(logDir, file), 'utf8').catch(() => '')
    for (const line of text.split('\n')) {
      if (line === '') continue
      try {
        const record = JSON.parse(line)
        for (const item of record.result?.files ?? []) {
          if (typeof item.hash === 'string') out.add(item.hash)
        }
      } catch {
        // 坏行跳过
      }
    }
  }
  return out
}

/** ISO 时间 → 本地日期（+08:00，中国无夏令时）。 */
function localDateOf(iso) {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return ''
  return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

const already = await existingHashes()
const sidecars = await collectSidecars(root)
const records = []

for (const file of sidecars) {
  let meta
  try {
    meta = JSON.parse(await readFile(file, 'utf8'))
  } catch {
    continue
  }
  if (meta === null || typeof meta !== 'object') continue
  if (meta.origin !== 'script') continue
  if (typeof meta.prompt !== 'string' || meta.prompt === '') continue
  if (typeof meta.hash !== 'string' || meta.hash === '') continue
  if (already.has(meta.hash)) continue

  const createdIso = String(meta.createdAt ?? meta.importedAt ?? '')
  const day = localDateOf(createdIso)
  if (day === '') continue
  if (dateArg !== '' && day !== dateArg) continue

  const startedAt = new Date(Date.parse(createdIso)).toISOString()
  records.push({
    id: `gen-sidecar-${meta.hash}`,
    startedAt,
    finishedAt: startedAt,
    status: 'completed',
    source: 'sidecar',
    machine: hostname(),
    ...(typeof meta.sessionId === 'string' && meta.sessionId !== '' ? { sessionId: meta.sessionId } : {}),
    request: {
      baseURL: '',
      protocol: '',
      prompt: meta.prompt,
      model: typeof meta.model === 'string' ? meta.model : '',
      ...(typeof meta.size === 'string' ? { size: meta.size } : {}),
      ...(typeof meta.resolution === 'string' ? { resolution: meta.resolution } : {}),
      ...(typeof meta.quality === 'string' ? { quality: meta.quality } : {}),
      n: 1,
      ...(typeof meta.referenceCount === 'number' ? { references: new Array(meta.referenceCount).fill({ name: '(sidecar 未记录)', bytes: 0 }) } : {}),
    },
    children: [{ index: 0, status: 'completed', ...(typeof meta.costUsd === 'number' ? { costUsd: meta.costUsd } : {}) }],
    result: {
      dir: dirname(file),
      files: [{
        hash: meta.hash,
        width: typeof meta.width === 'number' ? meta.width : 0,
        height: typeof meta.height === 'number' ? meta.height : 0,
        bytes: typeof meta.bytes === 'number' ? meta.bytes : 0,
        ...(typeof meta.costUsd === 'number' ? { costUsd: meta.costUsd } : {}),
      }],
      ...(typeof meta.costUsd === 'number' ? { costUsd: meta.costUsd } : {}),
    },
  })
  already.add(meta.hash)
}

records.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))

if (records.length === 0) {
  console.log('没有可反推的记录（可能已全部写入，或该日期没有脚本产物）')
  process.exit(0)
}

if (dryRun) {
  console.log(`[dry-run] 将写入 ${records.length} 条：`)
  for (const record of records) {
    console.log(`  ${record.startedAt} · ${record.request.model} · ${(record.request.prompt ?? '').slice(0, 40)}…`)
  }
  process.exit(0)
}

await mkdir(logDir, { recursive: true })
for (const record of records) {
  const day = record.startedAt.slice(0, 10).replace(/-/g, '')
  // 日期按本地时区重新算（startedAt 是 UTC）
  const localDay = localDateOf(record.startedAt).replace(/-/g, '')
  await appendFile(join(logDir, `${localDay || day}.jsonl`), `${JSON.stringify(record)}\n`, 'utf8')
}

console.log(`已写入 ${records.length} 条到 ${logDir}`)
for (const record of records) {
  console.log(`  ${record.startedAt} · ${record.request.model} · ${(record.request.prompt ?? '').slice(0, 50)}`)
}
