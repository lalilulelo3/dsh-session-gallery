// 构建脚本：产出 DSH 官方约定的两个半侧
//   宿主半侧 lib/index.js —— 普通 ESM（本插件宿主侧为空壳，只用于进入 Loader 图）
//   客户端半侧 lib/client.js —— 自注册懒式 CJS：
//     window.__ModuleLoader__.load({ id: "<包名>", factory: (require) => { ... } })
import { build } from 'esbuild'
import { mkdirSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]scripts$/, '')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const outdir = join(root, 'lib')

// 平台共享模块表：必须 external，由 DSH 的 ModuleLoader 提供，不能打进 bundle。
const PLATFORM_MODULES = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

rmSync(outdir, { recursive: true, force: true })
mkdirSync(outdir, { recursive: true })

// ---------- 宿主半侧 ----------
await build({
  entryPoints: [join(root, 'src/index.ts')],
  outfile: join(outdir, 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: ['@deepseek-ai/cordis'],
  logLevel: 'warning',
})

// ---------- 客户端半侧 ----------
const CLIENT_BANNER = `window.__ModuleLoader__.load({
	id: ${JSON.stringify(pkg.name)},
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
`
const CLIENT_FOOTER = `
		return module.exports;
	}
});
`

const result = await build({
  entryPoints: [join(root, 'src/client/index.tsx')],
  outfile: join(outdir, 'client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'chrome110',
  jsx: 'automatic',
  external: PLATFORM_MODULES,
  // .css 一律当文本读入，再由 JS 插 <head>；直接 import 会产出没人加载的 client.css。
  loader: { '.css': 'text' },
  banner: { js: CLIENT_BANNER },
  footer: { js: CLIENT_FOOTER },
  minify: false,
  sourcemap: false,
  logLevel: 'warning',
  metafile: true,
})

const clientPath = join(outdir, 'client.js')
const size = readFileSync(clientPath).length
const head = readFileSync(clientPath, 'utf8').slice(0, 200)
if (!head.includes('__ModuleLoader__.load')) {
  throw new Error('客户端 bundle 没有正确的自注册包装，检查 banner/footer')
}
console.log(`index.js  -> 宿主半侧`)
console.log(`client.js -> ${(size / 1024).toFixed(1)} KB (自注册懒式 CJS)`)
