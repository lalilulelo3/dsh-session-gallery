/**
 * 手动导入（反向进入）：本地图片 → 图片库。
 *
 * 用系统文件选择框（隐藏的 <input type="file">），把图读成 base64 交给宿主侧写入
 * `<图片库>\手动导入\`，sidecar 记 `origin: "manual"` 与当前会话 id。
 */

const IMPORT_ROUTE = '/plugins/dsh-session-gallery/import'
/** 单文件上限（与宿主侧一致：32 MB）。 */
const MAX_FILE_BYTES = 32 * 1024 * 1024
/** 单次最多张数（与宿主侧一致）。 */
const MAX_FILES = 20

/** File → 纯 base64（去掉 data URL 前缀）。 */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export interface ImportResult {
  saved: number
  failed: number
  message: string
}

/**
 * 弹出系统文件选择框并导入到图片库。
 * @param sessionId - 当前会话 id（写入 sidecar，便于出现在「会话图片」）
 * @returns 无选择时返回 null
 */
export async function pickAndImport(sessionId: string): Promise<ImportResult | null> {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true

  const files = await new Promise<File[]>((resolve) => {
    input.onchange = () => resolve(Array.from(input.files ?? []))
    input.click()
  })
  if (files.length === 0) return null

  const tooBig = files.filter((file) => file.size > MAX_FILE_BYTES)
  const usable = files.filter((file) => file.size <= MAX_FILE_BYTES).slice(0, MAX_FILES)
  if (usable.length === 0) {
    return { saved: 0, failed: files.length, message: `文件超过 ${MAX_FILE_BYTES / 1024 / 1024} MB，未导入` }
  }

  const payload = await Promise.all(usable.map(async (file) => ({
    name: file.name,
    mediaType: file.type,
    dataBase64: await toBase64(file),
  })))

  const response = await fetch(IMPORT_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, files: payload }),
  })
  const text = await response.text()
  let body: { files?: unknown[], failed?: unknown[], error?: unknown }
  try {
    body = JSON.parse(text) as typeof body
  } catch {
    return { saved: 0, failed: files.length, message: `导入失败：HTTP ${response.status}（响应为空，可能未重启）` }
  }
  if (!response.ok) {
    return { saved: 0, failed: files.length, message: `导入失败：${String(body.error ?? response.status)}` }
  }
  const saved = Array.isArray(body.files) ? body.files.length : 0
  const failed = (Array.isArray(body.failed) ? body.failed.length : 0) + tooBig.length + (files.length - usable.length)
  const message = failed > 0
    ? `已导入 ${saved} 张，${failed} 张失败`
    : `已导入 ${saved} 张到图片库`
  return { saved, failed, message }
}
