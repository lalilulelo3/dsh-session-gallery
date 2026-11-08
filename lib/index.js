// src/index.ts
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { homedir, hostname, tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
var execFileP = promisify(execFile);
var MACHINE_NAME = hostname();
var name = "session-gallery";
var EXPORT_ROUTE = "/plugins/dsh-session-gallery/export";
var CLEAR_ROUTE = "/plugins/dsh-session-gallery/clear-cache";
var SETTINGS_ROUTE = "/plugins/dsh-session-gallery/settings";
var SCAN_ROUTE = "/plugins/dsh-session-gallery/scan";
var IMAGE_ROUTE = "/plugins/dsh-session-gallery/image";
var DELETE_ROUTE = "/plugins/dsh-session-gallery/delete";
var REVEAL_ROUTE = "/plugins/dsh-session-gallery/reveal";
var IMPORT_ROUTE = "/plugins/dsh-session-gallery/import";
var ARCHIVE_ROUTE = "/plugins/dsh-session-gallery/archive";
var WORKBENCH_SAVE_ROUTE = "/plugins/dsh-session-gallery/workbench-save";
var WORKBENCH_CACHE_ROUTE = "/plugins/dsh-session-gallery/workbench-cache";
var GEN_CACHE_ROUTE = "/plugins/dsh-session-gallery/gen-cache";
var GEN_DIAG_ROUTE = "/plugins/dsh-session-gallery/gen-diag";
var CLIENT_LOG_ROUTE = "/plugins/dsh-session-gallery/client-log";
var TRASH_DIR_NAME = ".dshsg-trash";
var WORKBENCH_DIR_NAME = ".workbench";
var SESSION_IMPORT_DIR = "\u4F1A\u8BDD\u5BFC\u5165";
var MANUAL_IMPORT_DIR = "\u624B\u52A8\u5BFC\u5165";
var MAX_BODY_BYTES = 256 * 1024;
function exportDir() {
  return join(homedir(), ".dsh", "cache", "session-gallery");
}
async function readIndex(dir) {
  try {
    const raw = await readFile(join(dir, "index.json"), "utf8");
    const parsed = JSON.parse(raw);
    const names = {};
    if (parsed.names !== void 0 && typeof parsed.names === "object") {
      for (const [hash, name2] of Object.entries(parsed.names)) {
        if (typeof name2 === "string") names[hash] = name2;
      }
    }
    const next = typeof parsed.next === "number" && parsed.next > 0 ? parsed.next : 1;
    return { next, names };
  } catch {
    return { next: 1, names: {} };
  }
}
async function writeIndex(dir, index) {
  try {
    await writeFile(join(dir, "index.json"), JSON.stringify(index), "utf8");
  } catch {
  }
}
async function readBody(req, maxBytes = MAX_BODY_BYTES) {
  return await new Promise((resolve2, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk ?? ""));
      total += buf.length;
      if (total > maxBytes) {
        reject(new Error("body-too-large"));
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => resolve2(Buffer.concat(chunks).toString("utf8")));
    req.on("error", (err) => reject(err instanceof Error ? err : new Error(String(err))));
  });
}
function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (typeof origin !== "string" || typeof host !== "string") return true;
  return origin === `http://${host}` || origin === `https://${host}`;
}
function extOf(mediaType) {
  switch (mediaType) {
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/bmp":
      return ".bmp";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".png";
  }
}
async function handleExport(req, res, attachments) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const dir = exportDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    sendJson(res, 500, { error: "mkdir-failed" });
    return;
  }
  const index = await readIndex(dir);
  const items = Array.isArray(body.items) ? body.items : [];
  const files = [];
  const failures = [];
  for (const raw of items) {
    const item = raw;
    const attachment = item?.attachment;
    if (attachment === void 0 || typeof attachment.attachmentId !== "string") {
      failures.push({ name: "unknown", error: "bad-item" });
      continue;
    }
    const displayName = typeof attachment.name === "string" && attachment.name !== "" ? attachment.name : `image-${attachment.attachmentId.slice(0, 8)}`;
    try {
      const stored = await attachments.readImage(attachment);
      const mediaType = stored.ref?.mediaType ?? (typeof attachment.mediaType === "string" ? attachment.mediaType : void 0);
      const data = Buffer.from(stored.data);
      const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
      const existing = index.names[hash];
      const reused = existing !== void 0;
      let fileName;
      if (existing !== void 0) {
        fileName = existing;
      } else {
        fileName = `\u56FE\u7247${index.next}${extOf(mediaType)}`;
        index.next += 1;
        index.names[hash] = fileName;
        await writeIndex(dir, index);
      }
      const filePath = join(dir, fileName);
      if (!reused) await writeFile(filePath, data);
      files.push({
        path: filePath,
        fileName,
        short: fileName.replace(/\.[^.]+$/, ""),
        reused
      });
    } catch (cause) {
      failures.push({
        name: displayName,
        error: cause instanceof Error ? cause.message : String(cause)
      });
    }
  }
  sendJson(res, 200, { files, failures, dir });
}
function pickSessionId(exec) {
  const execLike = exec;
  const candidates = [
    execLike?.agent?.session?.id,
    execLike?.session?.id,
    execLike?.sessionId,
    execLike?.agent?.sessionId
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate !== "") return candidate;
  }
  return "";
}
var genToolDiag = { at: null, via: "none", registered: false, hasToolsService: false };
var BOOT_LOG_DIR = join(homedir(), ".dsh", "cache", "session-gallery");
var BOOT_LOG_FILE = join(BOOT_LOG_DIR, "boot-diag.log");
function bootLog(step, extra) {
  let suffix = "";
  if (extra !== void 0) {
    try {
      suffix = ` ${JSON.stringify(extra)}`;
    } catch {
      suffix = ` ${String(extra)}`;
    }
  }
  const line = `${(/* @__PURE__ */ new Date()).toISOString()} ${step}${suffix}
`;
  void appendFile(BOOT_LOG_FILE, line, "utf8").catch(() => {
    void mkdir(BOOT_LOG_DIR, { recursive: true }).then(() => appendFile(BOOT_LOG_FILE, line, "utf8")).catch(() => {
    });
  });
}
function registerImageTool(ctx) {
  const anyCtx = ctx;
  const definition = {
    name: "generate_image",
    description: [
      "\u7528\u7528\u6237\u5728\u300C\u56FE\u7247\u5E93\u63D2\u4EF6\u8BBE\u7F6E\u300D\u91CC\u914D\u7F6E\u7684\u4E2D\u8F6C\u7AD9\u751F\u6210\u56FE\u7247\u3002",
      "\u751F\u6210\u7684\u56FE\u4F1A\u81EA\u52A8\u5B58\u5165\u56FE\u7247\u5E93\uFF0C\u5E76\u7ACB\u523B\u51FA\u73B0\u5728\u53F3\u4FA7\u680F\u7684\u300C\u4F1A\u8BDD\u56FE\u7247\u300D\u91CC\u3002",
      "\u4E0D\u9700\u8981\u5199\u811A\u672C\u3001\u4E0D\u9700\u8981\u6307\u5B9A\u8F93\u51FA\u8DEF\u5F84\u3002",
      "\u7528\u6237\u6216\u6280\u80FD\u660E\u786E\u8BF4\u4E86\u8981\u7528\u54EA\u4E2A\u6A21\u578B\uFF0C\u5C31\u586B\u5230 model\uFF1B\u6CA1\u8BF4\u5C31\u7559\u7A7A\uFF0C\u63D2\u4EF6\u4F1A\u7528\u8BBE\u7F6E\u91CC\u7684\u9ED8\u8BA4\u6A21\u578B\u3002",
      "\u8981\u57AB\u56FE / \u6539\u56FE\uFF08\u62FF\u73B0\u6709\u56FE\u7247\u5F53\u53C2\u8003\uFF09\u5C31\u628A\u672C\u5730\u56FE\u7247\u8DEF\u5F84\u653E\u8FDB images\u3002",
      "gpt-image-2.5 \u8FD9\u7C7B\u6309\u8D28\u91CF\u8BA1\u8D39\u7684\u6A21\u578B\uFF0C\u7528 quality \u6307\u5B9A\u6863\u4F4D\uFF08\u4E0D\u6307\u5B9A\u4F1A\u6309\u6700\u9AD8\u6863\u9884\u6263\u8D44\u91D1\uFF09\u3002",
      "\u51FA\u56FE\u4F1A\u82B1\u94B1\uFF0C\u8C03\u7528\u524D\u5148\u786E\u8BA4\u7528\u6237\u786E\u5B9E\u8981\u751F\u6210\u3002"
    ].join(" "),
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "\u56FE\u7247\u63CF\u8FF0\uFF08\u4E2D\u6587\u53EF\u4EE5\uFF09" },
        model: { type: "string", description: "\u6A21\u578B\u540D\u3002\u7528\u6237\u6216\u6280\u80FD\u6307\u5B9A\u4E86\u6A21\u578B\u5C31\u586B\u8FD9\u91CC\uFF1B\u7559\u7A7A\u7528\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u7684\u9ED8\u8BA4\u6A21\u578B" },
        size: { type: "string", description: "\u6BD4\u4F8B\uFF0C\u5982 1:1 / 16:9 / 9:16 / 3:4\uFF1B\u4E0D\u786E\u5B9A\u5C31\u7559\u7A7A" },
        resolution: {
          type: "string",
          description: "\u5206\u8FA8\u7387\u6863\uFF1A1k / 1.5k / 2k / 4k\u3002\u5404\u6A21\u578B\u652F\u6301\u8303\u56F4\u4E0D\u540C\uFF08\u5982 Seedream-5.0-Pro \u6CA1\u6709 4k\uFF09\uFF0C\u4E0D\u652F\u6301\u7684\u4F1A\u88AB\u7AD9\u70B9\u62D2\u7EDD"
        },
        quality: {
          type: "string",
          description: "\u8D28\u91CF\u6863\uFF1Alow / medium / high / xhigh / max\u3002\u53EA\u6709 gpt-image-2.5 \u652F\u6301\uFF08xhigh\u3001max \u662F\u5B83\u72EC\u6709\uFF09\u3002\u4E0D\u4F20\u65F6\u7AD9\u70B9\u9ED8\u8BA4 auto\uFF0C\u800C auto \u4F1A\u6309 max \u6863\u9884\u6263\u8D44\u91D1\uFF0C\u6240\u4EE5\u80FD\u7528\u5C31\u663E\u5F0F\u6307\u5B9A"
        },
        n: {
          type: "number",
          description: "\u5F20\u6570 1-6\uFF0C\u9ED8\u8BA4 1\u3002\u63D2\u4EF6\u5185\u90E8\u5E76\u53D1\u63D0\u4EA4\uFF0C\u8017\u65F6\u63A5\u8FD1\u4E00\u5F20\uFF0C\u4F46\u4F1A\u82B1 n \u500D\u94B1"
        },
        images: {
          type: "array",
          items: { type: "string" },
          description: "\u53C2\u8003\u56FE\uFF1A\u672C\u5730\u56FE\u7247\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u6700\u591A 10 \u5F20\uFF08png/jpg/webp/gif\uFF09\u3002\u7528\u4E8E\u57AB\u56FE\u3001\u6539\u56FE\u3001\u591A\u56FE\u878D\u5408"
        },
        mask: {
          type: "string",
          description: "\u5C40\u90E8\u91CD\u7ED8\u7528\u7684\u8499\u7248\uFF1A\u672C\u5730 png \u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u5FC5\u987B\u5E26 alpha \u901A\u9053\uFF0C\u5C3A\u5BF8\u4E0E images \u7B2C\u4E00\u5F20\u4E00\u81F4\uFF0C<4MB\u3002\u900F\u660E\u533A\u57DF = \u5141\u8BB8\u91CD\u7ED8\u3002\u53EA\u6709 gpt-image-2.5-* \u548C gpt-image-2-official \u652F\u6301\uFF1Bgpt-image-2 \u4F1A\u660E\u786E\u62A5\u9519"
        },
        extra: {
          type: "object",
          description: "\u6A21\u578B\u4E13\u6709\u53C2\u6570\uFF0C\u539F\u6837\u5408\u5E76\u8FDB\u8BF7\u6C42\u4F53\uFF08\u5982 background\u3001layer_decomposition\u3001official_fallback\uFF09\u3002\u4E0D\u786E\u5B9A\u5C31\u522B\u4F20"
        }
      },
      required: ["prompt"],
      additionalProperties: false
    },
    output: {
      schema: { type: "object" },
      render: (_args, value) => {
        const result = value;
        if (result !== null && result.ok === false) {
          return [{ type: "text", text: `\u51FA\u56FE\u5931\u8D25\uFF1A${result.error ?? "\u672A\u77E5\u9519\u8BEF"}` }];
        }
        const files = result?.files ?? [];
        const sizes = result?.sizes ?? [];
        const lines = [`\u5DF2\u751F\u6210 ${files.length} \u5F20\uFF0C\u5DF2\u5B58\u5165\u56FE\u7247\u5E93\uFF1A`];
        files.forEach((file, index) => {
          const size = sizes[index];
          lines.push(size === void 0 ? file : `${file}\uFF08${size.width}\xD7${size.height}\uFF09`);
        });
        if (typeof result?.costUsd === "number") lines.push(`\u672C\u6B21\u5171\u82B1 $${result.costUsd.toFixed(4)}`);
        const failures = result?.failures ?? [];
        if (failures.length > 0) lines.push(`\u53E6\u6709 ${failures.length} \u5F20\u5931\u8D25\uFF1A${failures.join("\uFF1B")}`);
        return [{ type: "text", text: lines.join("\n") }];
      }
    },
    async execute(args, exec) {
      const prompt = typeof args.prompt === "string" ? args.prompt.trim() : "";
      if (prompt === "") return { ok: false, error: "prompt \u4E0D\u80FD\u4E3A\u7A7A" };
      const sessionId = pickSessionId(exec);
      if (sessionId === "") {
        console.warn("[session-gallery] \u51FA\u56FE\u6CA1\u53D6\u5230\u4F1A\u8BDD id\uFF1A\u8FD9\u5F20\u56FE\u53EA\u4F1A\u8FDB\u56FE\u7247\u5E93\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u5728\u300C\u4F1A\u8BDD\u56FE\u7247\u300D\u680F");
      }
      try {
        const result = await generateImages({
          prompt,
          ...typeof args.model === "string" && args.model !== "" ? { model: args.model } : {},
          ...typeof args.size === "string" && args.size !== "" ? { size: args.size } : {},
          ...typeof args.resolution === "string" && args.resolution !== "" ? { resolution: args.resolution } : {},
          ...typeof args.quality === "string" && args.quality !== "" ? { quality: args.quality } : {},
          ...typeof args.n === "number" ? { n: Math.min(6, Math.max(1, Math.round(args.n))) } : {},
          ...Array.isArray(args.images) ? { images: args.images.filter((one) => typeof one === "string" && one !== "") } : {},
          ...typeof args.mask === "string" && args.mask !== "" ? { mask: args.mask } : {},
          ...args.extra !== null && typeof args.extra === "object" && !Array.isArray(args.extra) ? { extra: args.extra } : {}
        }, sessionId);
        return {
          ok: true,
          files: result.files.map((file) => file.path),
          sizes: result.files.map((file) => ({ width: file.width, height: file.height })),
          dir: result.dir,
          model: result.model,
          ...result.cost === void 0 ? {} : { costUsd: result.cost },
          ...result.failures.length === 0 ? {} : { failures: result.failures }
        };
      } catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
      }
    }
  };
  const install = (holder) => {
    if (genToolDiag.registered) {
      bootLog("install-skip-already-registered");
      return;
    }
    let tools;
    try {
      tools = holder.get("tools");
    } catch (cause) {
      bootLog("install-get-tools-threw", cause instanceof Error ? cause.message : String(cause));
      tools = void 0;
    }
    genToolDiag.hasToolsService = tools !== void 0 && tools !== null;
    bootLog("install-probe", {
      hasTools: tools !== void 0 && tools !== null,
      hasRegister: typeof tools?.register === "function",
      toolsType: typeof tools
    });
    if (typeof tools?.register !== "function") {
      console.warn("[session-gallery] tools \u670D\u52A1\u6CA1\u6709 register\uFF0Cgenerate_image \u4E0D\u53EF\u7528");
      return;
    }
    const service = tools;
    try {
      holder.effect(() => service.register(definition), "session-gallery: generate_image tool");
      genToolDiag.registered = true;
      bootLog("install-ok");
      console.log("[session-gallery] \u5DF2\u6CE8\u518C generate_image \u5DE5\u5177");
    } catch (cause) {
      genToolDiag.error = cause instanceof Error ? cause.message : String(cause);
      bootLog("install-threw", genToolDiag.error);
      console.warn("[session-gallery] generate_image \u6CE8\u518C\u629B\u9519", cause);
    }
  };
  genToolDiag.at = (/* @__PURE__ */ new Date()).toISOString();
  bootLog("register-start", {
    hasInject: typeof anyCtx.inject === "function",
    hasEffect: typeof anyCtx.effect === "function",
    ctxType: typeof ctx
  });
  if (typeof anyCtx.inject === "function") {
    genToolDiag.via = "inject";
    anyCtx.inject(["tools"], (owner) => {
      bootLog("inject-fired");
      install(owner);
    });
    bootLog("inject-declared");
    const fallback = setTimeout(() => {
      if (genToolDiag.registered) return;
      bootLog("fallback-timer-fired");
      const viaGet = () => {
        const getter = ctx.get;
        if (typeof getter !== "function") throw new Error("ctx.get \u4E0D\u662F\u51FD\u6570");
        return getter.call(ctx, "tools");
      };
      install({
        get: (name2) => {
          if (name2 !== "tools") throw new Error(`\u4E0D\u652F\u6301\u7684\u6CE8\u5165\u540D ${name2}`);
          return viaGet();
        },
        effect: (fn, label) => {
          const effectFn = ctx.effect;
          if (typeof effectFn === "function") effectFn.call(ctx, fn, label);
          else fn();
        }
      });
    }, 3e3);
    fallback.unref?.();
    return;
  }
  genToolDiag.via = "root";
  let rootTools;
  try {
    rootTools = anyCtx.tools;
  } catch {
    rootTools = void 0;
  }
  genToolDiag.hasToolsService = rootTools !== void 0 && rootTools !== null;
  if (typeof rootTools?.register !== "function") {
    console.warn("[session-gallery] \u5BBF\u4E3B\u6CA1\u6709 ctx.tools.register\uFF0Cgenerate_image \u4E0D\u53EF\u7528");
    return;
  }
  const rootService = rootTools;
  if (typeof anyCtx.effect === "function") {
    anyCtx.effect(() => rootService.register(definition), "session-gallery: generate_image tool");
  } else {
    rootService.register(definition);
  }
  genToolDiag.registered = true;
  bootLog("install-ok-root");
  console.log("[session-gallery] \u5DF2\u6CE8\u518C generate_image \u5DE5\u5177");
}
function apply(ctx) {
  bootLog("=== apply-enter ===", {
    pid: process.pid,
    node: process.version,
    hasInject: typeof ctx.inject === "function",
    hasGet: typeof ctx.get === "function",
    hasEffect: typeof ctx.effect === "function"
  });
  bootLog("curl-probe", {
    resolved: resolveCurl(),
    pathHasSystem32: (process.env.PATH ?? "").toLowerCase().includes("system32"),
    systemRoot: process.env.SystemRoot ?? "(\u672A\u8BBE\u7F6E)"
  });
  try {
    registerImageTool(ctx);
  } catch (cause) {
    bootLog("register-tool-threw", cause instanceof Error ? cause.message : String(cause));
    console.warn("[session-gallery] generate_image \u5DE5\u5177\u6CE8\u518C\u5931\u8D25\uFF08\u5DF2\u5FFD\u7565\uFF09", cause);
  }
  try {
    const anyCtx = ctx;
    if (typeof anyCtx.inject !== "function") {
      console.warn("[session-gallery] \u5F53\u524D\u5BBF\u4E3B\u4E0D\u63D0\u4F9B ctx.inject\uFF0C\u5BBF\u4E3B\u4FA7\u8DEF\u7531\u4E0D\u6CE8\u518C");
      return;
    }
    anyCtx.inject(["webServer", "attachments"], (owner) => {
      try {
        const server = owner.get("webServer");
        const attachments = owner.get("attachments");
        if (server === void 0 || typeof server.register !== "function") {
          console.warn("[session-gallery] webServer \u4E0D\u53EF\u7528\uFF0C\u8DF3\u8FC7\u8DEF\u7531\u6CE8\u518C");
          return;
        }
        const registerRoute = (path, handler, label) => {
          try {
            owner.effect(() => server.register({
              kind: "exact",
              path,
              handler: (req, res) => {
                try {
                  handler(req, res);
                } catch (cause) {
                  console.warn(`[session-gallery] ${label} \u5904\u7406\u5931\u8D25`, cause);
                  sendJsonSafely(res, 500, { error: "internal" });
                }
              }
            }), label);
          } catch (cause) {
            console.warn(`[session-gallery] ${label} \u6CE8\u518C\u5931\u8D25`, cause);
          }
        };
        registerRoute(EXPORT_ROUTE, (req, res) => {
          if (attachments === void 0) {
            sendJson(res, 503, { error: "attachments-unavailable" });
            return;
          }
          void handleExport(req, res, attachments).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: export route");
        registerRoute(CLEAR_ROUTE, (req, res) => {
          void handleClear(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: clear route");
        registerRoute(SETTINGS_ROUTE, (req, res) => {
          void handleSettings(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: settings route");
        registerRoute(SCAN_ROUTE, (req, res) => {
          void handleScan(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: scan route");
        registerRoute(IMAGE_ROUTE, (req, res) => {
          void handleImage(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: image route");
        registerRoute(DELETE_ROUTE, (req, res) => {
          void handleDelete(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: delete route");
        registerRoute(REVEAL_ROUTE, (req, res) => {
          void handleReveal(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: reveal route");
        registerRoute(CLIENT_LOG_ROUTE, (req, res) => {
          void (async () => {
            if (req.method !== "POST") {
              sendJson(res, 405, { error: "method-not-allowed" });
              return;
            }
            try {
              const raw = await readBody(req);
              bootLog("client-error", raw.slice(0, 6e3));
            } catch {
            }
            sendJson(res, 200, { ok: true });
          })();
        }, "session-gallery: client log route");
        registerRoute(GEN_PROBE_ROUTE, (req, res) => {
          void handleGenProbe(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: gen probe route");
        registerRoute(GEN_DIAG_ROUTE, (req, res) => {
          if (req.method !== "GET") {
            sendJson(res, 405, { error: "method-not-allowed" });
            return;
          }
          let rootCtxHasTools = false;
          try {
            rootCtxHasTools = typeof ctx.tools !== "undefined";
          } catch {
            rootCtxHasTools = false;
          }
          sendJson(res, 200, { ...genToolDiag, rootCtxHasTools });
        }, "session-gallery: gen diag route");
        registerRoute(GEN_CONFIG_ROUTE, (req, res) => {
          void handleGenSave(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: gen config route");
        registerRoute(GEN_LOGS_ROUTE, (req, res) => {
          void handleGenLogs(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: gen logs route");
        registerRoute(IMPORT_ROUTE, (req, res) => {
          void handleManualImport(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: manual import route");
        registerRoute(ARCHIVE_ROUTE, (req, res) => {
          if (attachments === void 0) {
            sendJson(res, 503, { error: "attachments-unavailable" });
            return;
          }
          void handleArchive(req, res, attachments).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: archive route");
        registerRoute(WORKBENCH_SAVE_ROUTE, (req, res) => {
          void handleWorkbenchSave(req, res).catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: workbench save route");
        registerRoute(WORKBENCH_CACHE_ROUTE, (req, res) => {
          void handleCache(req, res, "workbench").catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: workbench cache route");
        registerRoute(GEN_CACHE_ROUTE, (req, res) => {
          void handleCache(req, res, "gen").catch(() => sendJsonSafely(res, 500, { error: "internal" }));
        }, "session-gallery: gen cache route");
      } catch (cause) {
        console.warn("[session-gallery] \u5BBF\u4E3B\u4FA7\u521D\u59CB\u5316\u5931\u8D25\uFF0C\u63D2\u4EF6\u4EE5\u65E0\u8DEF\u7531\u6A21\u5F0F\u8FD0\u884C", cause);
      }
    });
  } catch (cause) {
    console.warn("[session-gallery] \u5BBF\u4E3B\u4FA7 apply \u5931\u8D25\uFF08\u5DF2\u5FFD\u7565\uFF09", cause);
  }
}
function sendJsonSafely(res, status, payload) {
  try {
    sendJson(res, status, payload);
  } catch {
  }
}
function settingsFile() {
  return join(homedir(), ".dsh", "cache", "session-gallery", "settings.json");
}
function defaultSettings() {
  return {
    root: join(homedir(), "Pictures", "DSH\u56FE\u7247\u5E93"),
    legacyRoots: [],
    workbenchRetentionDays: 3,
    genRetentionDays: 7,
    shareWithSite: false
  };
}
async function readSettings() {
  const fallback = defaultSettings();
  try {
    const raw = await readFile(settingsFile(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      root: typeof parsed.root === "string" && isAbsolute(parsed.root) ? parsed.root : fallback.root,
      legacyRoots: Array.isArray(parsed.legacyRoots) ? parsed.legacyRoots.filter((p) => typeof p === "string" && isAbsolute(p)) : [],
      workbenchRetentionDays: typeof parsed.workbenchRetentionDays === "number" && Number.isFinite(parsed.workbenchRetentionDays) && parsed.workbenchRetentionDays >= 0 ? Math.round(parsed.workbenchRetentionDays) : fallback.workbenchRetentionDays,
      genRetentionDays: typeof parsed.genRetentionDays === "number" && Number.isFinite(parsed.genRetentionDays) && parsed.genRetentionDays >= 0 ? Math.round(parsed.genRetentionDays) : fallback.genRetentionDays,
      shareWithSite: parsed.shareWithSite === true
    };
  } catch {
    return fallback;
  }
}
async function writeSettings(next) {
  await mkdir(dirname(settingsFile()), { recursive: true });
  await writeFile(settingsFile(), JSON.stringify(next, null, 2), "utf8");
}
async function handleSettings(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, await readSettings());
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const fallback = defaultSettings();
  const root = typeof body.root === "string" && isAbsolute(body.root) ? resolve(body.root) : fallback.root;
  const legacyRoots = Array.isArray(body.legacyRoots) ? body.legacyRoots.filter((p) => typeof p === "string" && isAbsolute(p)).map((p) => resolve(p)) : [];
  const retentionRaw = Number(body.workbenchRetentionDays);
  const workbenchRetentionDays = Number.isFinite(retentionRaw) && retentionRaw >= 0 ? Math.round(retentionRaw) : fallback.workbenchRetentionDays;
  const genRaw = Number(body.genRetentionDays);
  const genRetentionDays = Number.isFinite(genRaw) && genRaw >= 0 ? Math.round(genRaw) : fallback.genRetentionDays;
  const prev = await readSettings();
  const shareWithSite = typeof body.shareWithSite === "boolean" ? body.shareWithSite : prev.shareWithSite;
  await writeSettings({ root, legacyRoots, workbenchRetentionDays, genRetentionDays, shareWithSite });
  sendJson(res, 200, { root, legacyRoots, workbenchRetentionDays, genRetentionDays, shareWithSite });
}
var IMAGE_EXT = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);
var fileHashCache = /* @__PURE__ */ new Map();
function hashOfFile(path, mtime, size) {
  const key = `${path}|${mtime}|${size}`;
  const cached = fileHashCache.get(key);
  if (cached !== void 0) return Promise.resolve(cached);
  return readFile(path).then((data) => {
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
    fileHashCache.set(key, hash);
    return hash;
  }).catch(() => "");
}
async function scanRoot(baseRoot, dir, source, out, budget, depth = 0) {
  if (depth > 8 || budget.left <= 0) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (budget.left <= 0) return;
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanRoot(baseRoot, full, source, out, budget, depth + 1);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const info = await stat(full).catch(() => null);
    if (info === null) continue;
    let meta;
    try {
      const raw = await readFile(full.slice(0, -ext.length) + ".json", "utf8");
      const parsed = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object") meta = parsed;
    } catch {
    }
    budget.left -= 1;
    const hash = await hashOfFile(full, info.mtimeMs, info.size);
    out.push({
      path: full,
      name: entry.name,
      dir: dirname(full),
      rel: relative(baseRoot, full),
      root: baseRoot,
      source,
      mtime: info.mtimeMs,
      bytes: info.size,
      ...hash === "" ? {} : { hash },
      ...meta === void 0 ? {} : { meta }
    });
  }
}
async function handleScan(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  const settings = await readSettings();
  const items = [];
  const budget = { left: 5e3 };
  await scanRoot(settings.root, settings.root, "library", items, budget);
  for (const legacy of settings.legacyRoots) {
    await scanRoot(legacy, legacy, "legacy", items, budget);
  }
  const timeOf = (item) => {
    const created = item.meta?.createdAt;
    if (typeof created === "string") {
      const parsed = Date.parse(created);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return item.mtime;
  };
  items.sort((a, b) => timeOf(b) - timeOf(a));
  sendJson(res, 200, {
    items,
    settings,
    truncated: budget.left <= 0,
    // 图片库之外那一份「脚本刚出的图」的元数据，只用来给未归档大图显示参数/提示词
    pendingMeta: await readGenSidecars()
  });
}
async function readSidecar(jsonPath) {
  try {
    const parsed = JSON.parse(await readFile(jsonPath, "utf8"));
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
  }
  return {};
}
async function writeSidecarMerged(jsonPath, next, assignNo) {
  const prev = await readSidecar(jsonPath);
  const merged = { ...prev, ...next };
  if (typeof merged.no !== "string" || merged.no === "") {
    const fresh = assignNo?.();
    if (fresh !== void 0 && fresh !== "") merged.no = fresh;
  }
  const text = `${JSON.stringify(merged, null, 2)}
`;
  const tmp = `${jsonPath}.tmp-${process.pid}`;
  try {
    await writeFile(tmp, text, "utf8");
    await rename(tmp, jsonPath);
  } catch {
    await unlink(tmp).catch(() => void 0);
    await writeFile(jsonPath, text, "utf8");
  }
}
async function maxGalleryNo(prefix) {
  const settings = await readSettings();
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  const walk = async (dir, depth) => {
    if (depth > 8) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, depth + 1);
        continue;
      }
      if (!entry.name.toLowerCase().endsWith(".json")) continue;
      const meta = await readSidecar(full);
      const matched = pattern.exec(typeof meta.no === "string" ? meta.no : "");
      if (matched === null) continue;
      const value = Number(matched[1]);
      if (Number.isFinite(value) && value > max) max = value;
    }
  };
  await walk(settings.root, 0);
  return max;
}
async function makeNoAllocator(prefix) {
  let current = await maxGalleryNo(prefix);
  return () => {
    current += 1;
    return `${prefix}${String(current).padStart(3, "0")}`;
  };
}
async function noAllocatorIfShared() {
  const settings = await readSettings();
  if (!settings.shareWithSite) return void 0;
  return makeNoAllocator("G-");
}
function isUnder(target, root) {
  const normalizedRoot = resolve(root);
  const normalizedTarget = resolve(target);
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(normalizedRoot + sep);
}
async function handleImage(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  const parsed = new URL(req.url ?? "", "http://localhost");
  const rawPath = parsed.searchParams.get("path");
  if (rawPath === null || rawPath === "") {
    sendJson(res, 400, { error: "missing-path" });
    return;
  }
  const settings = await readSettings();
  const roots = [settings.root, ...settings.legacyRoots];
  const target = resolve(rawPath);
  if (!roots.some((root) => isUnder(target, root))) {
    sendJson(res, 403, { error: "outside-library" });
    return;
  }
  const ext = extname(target).toLowerCase();
  if (!IMAGE_EXT.has(ext)) {
    sendJson(res, 415, { error: "unsupported-type" });
    return;
  }
  let data;
  try {
    data = await readFile(target);
  } catch {
    sendJson(res, 404, { error: "not-found" });
    return;
  }
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : ext === ".bmp" ? "image/bmp" : "image/png";
  res.writeHead(200, {
    "content-type": mime,
    "content-length": String(data.length),
    "cache-control": "private, max-age=60"
  });
  res.end(data);
}
async function handleClear(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  const dir = exportDir();
  let removed = 0;
  try {
    const names = await readdir(dir);
    for (const name2 of names) {
      try {
        await unlink(join(dir, name2));
        removed += 1;
      } catch {
      }
    }
  } catch {
  }
  sendJson(res, 200, { removed, dir });
}
function genDir() {
  return join(homedir(), ".dsh", "cache", "session-gallery", "gen");
}
async function readGenSidecars() {
  let names;
  try {
    names = await readdir(genDir());
  } catch {
    return [];
  }
  const out = [];
  for (const name2 of names) {
    if (!name2.toLowerCase().endsWith(".json")) continue;
    try {
      const meta = JSON.parse(await readFile(join(genDir(), name2), "utf8"));
      const raw = typeof meta.hash === "string" && meta.hash !== "" ? meta.hash : name2.replace(/\.json$/i, "").split("-").pop() ?? "";
      if (raw.length < 8) continue;
      out.push({ hash: raw.slice(0, 12).toLowerCase(), meta });
    } catch {
    }
  }
  return out;
}
async function sweepCacheDir(dir, retentionDays, clearAll = false) {
  const cutoff = retentionDays > 0 ? Date.now() - retentionDays * 24 * 60 * 60 * 1e3 : -Infinity;
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return { removed: 0, files: 0, bytes: 0 };
  }
  let removed = 0;
  let files = 0;
  let bytes = 0;
  for (const name2 of names) {
    const full = join(dir, name2);
    const info = await stat(full).catch(() => null);
    if (info === null || !info.isFile()) continue;
    if (clearAll || info.mtimeMs < cutoff) {
      try {
        await unlink(full);
        removed += 1;
        continue;
      } catch {
      }
    }
    files += 1;
    bytes += info.size;
  }
  return { removed, files, bytes };
}
function sweepWorkbenchCache(root, retentionDays, clearAll = false) {
  return sweepCacheDir(join(root, WORKBENCH_DIR_NAME), retentionDays, clearAll);
}
async function handleWorkbenchSave(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req, 64 * 1024 * 1024));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const encoded = typeof body.dataBase64 === "string" ? body.dataBase64 : "";
  if (encoded === "") {
    sendJson(res, 400, { error: "missing-data" });
    return;
  }
  const data = Buffer.from(encoded, "base64");
  if (data.length === 0 || data.length > 64 * 1024 * 1024) {
    sendJson(res, 400, { error: "size-out-of-range" });
    return;
  }
  const settings = await readSettings();
  const dir = join(settings.root, WORKBENCH_DIR_NAME);
  await mkdir(dir, { recursive: true });
  const rawName = typeof body.name === "string" ? body.name : "export";
  const safe = rawName.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80);
  const fileName = safe === "" ? "export.png" : /\.(png|jpe?g|webp)$/i.test(safe) ? safe : `${safe}.png`;
  const filePath = join(dir, fileName);
  try {
    await writeFile(filePath, data);
  } catch (cause) {
    sendJson(res, 500, { error: "write-failed", message: cause instanceof Error ? cause.message : String(cause) });
    return;
  }
  sendJson(res, 200, { path: filePath });
  if (settings.workbenchRetentionDays > 0) {
    void sweepWorkbenchCache(settings.root, settings.workbenchRetentionDays).catch(() => void 0);
  }
}
async function handleCache(req, res, scope) {
  const settings = await readSettings();
  const dir = scope === "gen" ? genDir() : join(settings.root, WORKBENCH_DIR_NAME);
  const retentionDays = scope === "gen" ? settings.genRetentionDays : settings.workbenchRetentionDays;
  if (req.method === "GET") {
    const stats = await sweepCacheDir(dir, 0);
    sendJson(res, 200, { ...stats, retentionDays, dir });
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    body = {};
  }
  const clearAll = body.clear === true;
  const result = await sweepCacheDir(dir, retentionDays, clearAll);
  sendJson(res, 200, { ...result, retentionDays, dir });
}
var GEN_PROBE_ROUTE = "/plugins/dsh-session-gallery/gen-probe";
var GEN_CONFIG_ROUTE = "/plugins/dsh-session-gallery/gen-config";
var GEN_LOGS_ROUTE = "/plugins/dsh-session-gallery/gen-logs";
var GEN_DEFAULTS = {
  baseURL: "",
  protocol: "apimart-async",
  /**
   * 代理默认留空：不是每个人都挂着本地代理，也不该替使用者预设某个端口。
   * 需要代理的（国外中转站）在设置里自己填，比如 `http://127.0.0.1:7897`。
   */
  proxy: "",
  /** 凭据名默认留空：绑死某个中转站的变量名会把别人的配置挡在门外。 */
  credentialKey: "",
  defaultModel: ""
};
function genConfigFile() {
  return join(exportDir(), "gen-config.json");
}
function legacyDefaultModel(models) {
  if (!Array.isArray(models)) return "";
  for (const entry of models) {
    if (entry === null || typeof entry !== "object") continue;
    const item = entry;
    if (typeof item.id === "string" && item.id !== "" && item.enabled !== false) return item.id;
  }
  return "";
}
async function readGenConfig() {
  try {
    const parsed = JSON.parse(await readFile(genConfigFile(), "utf8"));
    return {
      baseURL: typeof parsed.baseURL === "string" ? parsed.baseURL : GEN_DEFAULTS.baseURL,
      protocol: parsed.protocol === "openai-compat" ? "openai-compat" : "apimart-async",
      proxy: typeof parsed.proxy === "string" ? parsed.proxy : GEN_DEFAULTS.proxy,
      credentialKey: typeof parsed.credentialKey === "string" && parsed.credentialKey !== "" ? parsed.credentialKey : GEN_DEFAULTS.credentialKey,
      defaultModel: typeof parsed.defaultModel === "string" ? parsed.defaultModel : legacyDefaultModel(parsed.models)
    };
  } catch {
    return { ...GEN_DEFAULTS };
  }
}
async function writeGenConfig(next) {
  await mkdir(exportDir(), { recursive: true });
  await writeFile(genConfigFile(), `${JSON.stringify(next, null, 2)}
`, "utf8");
}
function credentialsFile() {
  return join(homedir(), ".dsh", ".credentials.yaml");
}
async function readCredential(key) {
  try {
    const text = await readFile(credentialsFile(), "utf8");
    const match = new RegExp(`^\\s*${key}\\s*:\\s*(\\S+)`, "m").exec(text);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}
async function writeCredential(key, value) {
  let text = "";
  try {
    text = await readFile(credentialsFile(), "utf8");
  } catch {
    text = "";
  }
  const line = `${key}: ${value}`;
  const pattern = new RegExp(`^\\s*${key}\\s*:.*$`, "m");
  const next = pattern.test(text) ? text.replace(pattern, line) : `${text === "" ? "" : `${text.replace(/\s+$/, "")}
`}${line}
`;
  await writeFile(credentialsFile(), next, "utf8");
}
var cachedCurlPath = null;
function resolveCurl() {
  if (cachedCurlPath !== null) return cachedCurlPath;
  const candidates = [
    join(process.env.SystemRoot ?? "C:\\Windows", "System32", "curl.exe"),
    "C:\\Windows\\System32\\curl.exe",
    "curl.exe"
  ];
  for (const candidate of candidates) {
    if (candidate === "curl.exe") {
      cachedCurlPath = candidate;
      break;
    }
    try {
      if (existsSync(candidate)) {
        cachedCurlPath = candidate;
        break;
      }
    } catch {
    }
  }
  cachedCurlPath ??= "curl.exe";
  return cachedCurlPath;
}
async function curlRequest(url, init) {
  const args = ["-sS", "--max-time", String(init.timeoutSec ?? 25), "-X", init.method ?? "GET"];
  if (typeof init.proxy === "string" && init.proxy !== "") args.push("-x", init.proxy);
  for (const [key, value] of Object.entries(init.headers ?? {})) args.push("-H", `${key}: ${value}`);
  let bodyFile = null;
  if (init.body !== void 0) {
    if (init.body.length > 8e3) {
      bodyFile = join(tmpdir(), `dshsg-body-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.json`);
      await writeFile(bodyFile, init.body, "utf8");
      args.push("--data-binary", `@${bodyFile}`);
    } else {
      args.push("--data-binary", init.body);
    }
  }
  args.push("-w", "\n__STATUS__%{http_code}", url);
  try {
    const { stdout } = await execFileP(resolveCurl(), args, { maxBuffer: 32 * 1024 * 1024 });
    const marker = stdout.lastIndexOf("\n__STATUS__");
    if (marker < 0) return { status: 0, text: stdout };
    return {
      status: Number(stdout.slice(marker + 11).trim()) || 0,
      text: stdout.slice(0, marker)
    };
  } catch (cause) {
    const err = cause;
    const parts = [
      typeof err.code === "string" ? err.code : "",
      typeof err.message === "string" ? err.message : "",
      typeof err.stderr === "string" ? err.stderr.trim().slice(0, 500) : ""
    ].filter((part) => part !== "");
    return { status: 0, text: parts.join(" | ") };
  } finally {
    if (bodyFile !== null) await unlink(bodyFile).catch(() => {
    });
  }
}
function looksLikeImageModel(id) {
  const lower = id.toLowerCase();
  if (/(video|tts|whisper|embed|rerank|audio|chat|vision-preview$)/.test(lower)) return false;
  return /(image|dall-e|flux|seedream|banana|midjourney|sdxl|stable-diffusion|imagen)/.test(lower);
}
async function handleGenProbe(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const saved = await readGenConfig();
  const rawBase = typeof body.baseURL === "string" ? body.baseURL.trim() : saved.baseURL;
  const credentialKey = typeof body.credentialKey === "string" && body.credentialKey !== "" ? body.credentialKey : saved.credentialKey;
  const apiKey = typeof body.apiKey === "string" && body.apiKey.trim() !== "" ? body.apiKey.trim() : await readCredential(credentialKey);
  const proxy = typeof body.proxy === "string" ? body.proxy.trim() : saved.proxy;
  if (rawBase === "") {
    sendJson(res, 400, { error: "no-base-url", message: "\u5148\u586B\u4E2D\u8F6C\u7AD9\u5730\u5740" });
    return;
  }
  if (apiKey === "") {
    sendJson(res, 400, { error: "no-key", message: "\u5148\u586B API Key" });
    return;
  }
  const root = rawBase.replace(/\/+$/, "").replace(/\/v1$/i, "");
  const headers = { Authorization: `Bearer ${apiKey}` };
  const models = await curlRequest(`${root}/v1/models`, { headers, proxy });
  bootLog("gen-probe", { root, proxy, status: models.status, text: models.text.slice(0, 300) });
  if (models.status === 401 || models.status === 403) {
    sendJson(res, 200, { ok: false, error: "bad-key", message: "Key \u4E0D\u88AB\u63A5\u53D7\uFF08401/403\uFF09" });
    return;
  }
  if (models.status === 0) {
    const why = models.text.trim().slice(0, 300);
    sendJson(res, 200, {
      ok: false,
      error: "network",
      // 把 curl 的真实报错直接摊在界面上，别再让人猜「连不上」是什么连不上。
      message: why === "" ? "\u8FDE\u4E0D\u4E0A\uFF1A\u68C0\u67E5\u5730\u5740\u662F\u5426\u6B63\u786E\u3001\u8981\u4E0D\u8981\u6302\u4EE3\u7406" : `\u8FDE\u4E0D\u4E0A\uFF1A${why}`,
      detail: why,
      proxy,
      root
    });
    return;
  }
  let ids = [];
  try {
    const parsed = JSON.parse(models.text);
    ids = (parsed.data ?? []).map((row) => typeof row?.id === "string" ? row.id : "").filter((id) => id !== "");
  } catch {
    ids = [];
  }
  const tasks = await curlRequest(`${root}/v1/tasks/connectivity-probe`, { headers, proxy });
  const protocol = tasks.status === 400 || tasks.status === 401 || tasks.status === 405 ? "apimart-async" : "openai-compat";
  const imageModels = ids.filter(looksLikeImageModel).sort();
  sendJson(res, 200, {
    ok: true,
    protocol,
    total: ids.length,
    models: imageModels,
    message: ids.length === 0 ? "\u8FDE\u4E0A\u4E86\uFF0C\u4F46\u6CA1\u62FF\u5230\u6A21\u578B\u5217\u8868\uFF08\u8FD9\u4E2A\u4E2D\u8F6C\u7AD9\u53EF\u80FD\u4E0D\u652F\u6301 /v1/models\uFF09\uFF0C\u8BF7\u624B\u52A8\u586B\u6A21\u578B\u540D" : `\u8FDE\u4E0A\u4E86\uFF0C\u5171 ${ids.length} \u4E2A\u6A21\u578B\uFF0C\u5176\u4E2D ${imageModels.length} \u4E2A\u770B\u8D77\u6765\u80FD\u51FA\u56FE`
  });
}
async function handleGenSave(req, res) {
  if (req.method === "GET") {
    const current = await readGenConfig();
    sendJson(res, 200, {
      ...current,
      // 只回报有没有 key，不回传明文
      hasKey: await readCredential(current.credentialKey) !== ""
    });
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const credentialKey = typeof body.credentialKey === "string" && body.credentialKey.trim() !== "" ? body.credentialKey.trim() : GEN_DEFAULTS.credentialKey;
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (apiKey !== "") await writeCredential(credentialKey, apiKey);
  const next = {
    baseURL: typeof body.baseURL === "string" ? body.baseURL.trim() : "",
    protocol: body.protocol === "openai-compat" ? "openai-compat" : "apimart-async",
    proxy: typeof body.proxy === "string" ? body.proxy.trim() : "",
    credentialKey,
    defaultModel: typeof body.defaultModel === "string" ? body.defaultModel.trim() : ""
  };
  await writeGenConfig(next);
  sendJson(res, 200, { ok: true, config: next, hasKey: await readCredential(credentialKey) !== "" });
}
function imageSizeOf(bytes) {
  if (bytes.length > 24 && bytes[0] === 137 && bytes[1] === 80) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), ext: ".png" };
  }
  if (bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 255) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1] ?? 0;
      const length = bytes.readUInt16BE(offset + 2);
      if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), ext: ".jpg" };
      }
      offset += 2 + length;
    }
  }
  if (bytes.length > 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const width = 1 + bytes.readUIntLE(24, 3);
    const height = 1 + bytes.readUIntLE(27, 3);
    return { width, height, ext: ".webp" };
  }
  return { width: 0, height: 0, ext: ".png" };
}
var MASK_MAX_BYTES = 4 * 1024 * 1024;
function modelSupportsMask(model) {
  const lower = model.toLowerCase();
  return lower.includes("gpt-image-2.5") || lower.includes("gpt-image-2-official");
}
function readPngInfo(bytes) {
  if (bytes.length < 33) return null;
  if (!(bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)) return null;
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25] ?? 0;
  let hasAlpha = colorType === 4 || colorType === 6;
  if (!hasAlpha) hasAlpha = bytes.includes(Buffer.from("tRNS", "ascii"));
  return { width, height, hasAlpha };
}
async function loadMask(maskPath, firstRefPath) {
  const info = await stat(maskPath).catch(() => null);
  if (info === null || !info.isFile()) throw new Error(`mask \u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${maskPath}`);
  if (info.size > MASK_MAX_BYTES) {
    throw new Error(`mask \u592A\u5927\uFF08${(info.size / 1024 / 1024).toFixed(1)}MB\uFF09\uFF0C\u4E0A\u9650 4MB\uFF1A${maskPath}`);
  }
  const bytes = await readFile(maskPath);
  const png = readPngInfo(bytes);
  if (png === null) throw new Error(`mask \u5FC5\u987B\u662F PNG\uFF08\u5E26 alpha \u901A\u9053\uFF09\uFF1A${maskPath}`);
  if (!png.hasAlpha) {
    throw new Error(`mask \u6CA1\u6709 alpha \u901A\u9053\uFF1A${maskPath}\u3002\u7EAF\u9ED1\u767D\u56FE\u4E0D\u80FD\u5F53 mask\uFF0C\u5FC5\u987B\u7528\u5E26\u900F\u660E\u533A\u57DF\u7684 PNG\uFF08\u900F\u660E = \u5141\u8BB8\u91CD\u7ED8\uFF09`);
  }
  if (firstRefPath === void 0) throw new Error("\u4F20 mask \u65F6\u5FC5\u987B\u540C\u65F6\u4F20 images\uFF08\u7B2C\u4E00\u5F20\u4E3A\u539F\u56FE\uFF09");
  const refBytes = await readFile(firstRefPath).catch(() => null);
  if (refBytes === null) throw new Error(`\u7B2C\u4E00\u5F20\u53C2\u8003\u56FE\u8BFB\u4E0D\u5230\uFF1A${firstRefPath}`);
  const ref = imageSizeOf(refBytes);
  if (ref.width > 0 && ref.height > 0 && (ref.width !== png.width || ref.height !== png.height)) {
    throw new Error(`mask \u5C3A\u5BF8 ${png.width}\xD7${png.height} \u4E0E\u539F\u56FE ${ref.width}\xD7${ref.height} \u4E0D\u4E00\u81F4\uFF08\u5FC5\u987B\u540C\u5C3A\u5BF8\uFF09`);
  }
  return {
    dataUrl: `data:image/png;base64,${bytes.toString("base64")}`,
    bytes: bytes.length,
    width: png.width,
    height: png.height
  };
}
async function downloadTo(url, outPath, proxy) {
  const args = ["-sS", "--max-time", "180", "-L", "-w", "%{http_code}"];
  if (proxy !== "") args.push("-x", proxy);
  args.push("-o", outPath, url);
  try {
    const { stdout } = await execFileP(resolveCurl(), args, { maxBuffer: 8 * 1024 * 1024 });
    const code = Number(String(stdout).trim());
    const info = await stat(outPath).catch(() => null);
    if (info === null || !info.isFile() || info.size === 0) {
      return `\u4E0B\u8F7D\u540E\u6587\u4EF6\u4E3A\u7A7A\uFF08HTTP ${Number.isFinite(code) ? code : "\u672A\u77E5"}\uFF09`;
    }
    if (Number.isFinite(code) && code !== 0 && (code < 200 || code >= 300)) {
      return `\u4E0B\u8F7D\u8FD4\u56DE HTTP ${code}`;
    }
    return null;
  } catch (cause) {
    const err = cause;
    if (typeof err.stderr === "string" && err.stderr.trim() !== "") {
      return err.stderr.trim().slice(0, 200);
    }
    return err.message !== void 0 ? String(err.message) : String(cause);
  }
}
function collectImageUrls(rows) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const row of rows) {
    if (row === null || typeof row !== "object") continue;
    const url = row.url;
    if (typeof url === "string") {
      if (url !== "") out.push(url);
      continue;
    }
    if (Array.isArray(url)) {
      for (const one of url) {
        if (typeof one === "string" && one !== "") out.push(one);
      }
    }
  }
  return out;
}
var PIXEL_TABLE = {
  "1:1": { "1k": "1024x1024", "2k": "2048x2048", "4k": "2880x2880" },
  "3:2": { "1k": "1536x1024", "2k": "2048x1360", "4k": "3520x2336" },
  "2:3": { "1k": "1024x1536", "2k": "1360x2048", "4k": "2336x3520" },
  "4:3": { "1k": "1024x768", "2k": "2048x1536", "4k": "3312x2480" },
  "3:4": { "1k": "768x1024", "2k": "1536x2048", "4k": "2480x3312" },
  "5:4": { "1k": "1280x1024", "2k": "2560x2048", "4k": "3216x2576" },
  "4:5": { "1k": "1024x1280", "2k": "2048x2560", "4k": "2576x3216" },
  "16:9": { "1k": "1536x864", "2k": "2048x1152", "4k": "3840x2160" },
  "9:16": { "1k": "864x1536", "2k": "1152x2048", "4k": "2160x3840" },
  "2:1": { "1k": "2048x1024", "2k": "2688x1344", "4k": "3840x1920" },
  "1:2": { "1k": "1024x2048", "2k": "1344x2688", "4k": "1920x3840" },
  "3:1": { "1k": "1881x836", "2k": "3072x1024", "4k": "3840x1280" },
  "1:3": { "1k": "887x1774", "2k": "1024x3072", "4k": "1280x3840" },
  "21:9": { "1k": "2016x864", "2k": "2688x1152", "4k": "3840x1648" },
  "9:21": { "1k": "864x2016", "2k": "1152x2688", "4k": "1648x3840" }
};
var REF_MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif"
};
var MAX_REF_BYTES = 20 * 1024 * 1024;
var MAX_REFS = 10;
async function imageFileToDataUrl(filePath) {
  const ext = extname(filePath).toLowerCase();
  const mime = REF_MIME[ext];
  if (mime === void 0) {
    throw new Error(`\u53C2\u8003\u56FE\u683C\u5F0F\u4E0D\u652F\u6301\uFF08\u53EA\u6536 png / jpg / webp / gif\uFF09\uFF1A${filePath}`);
  }
  let info;
  try {
    info = await stat(filePath);
  } catch {
    throw new Error(`\u53C2\u8003\u56FE\u4E0D\u5B58\u5728\u6216\u8BFB\u4E0D\u5230\uFF1A${filePath}`);
  }
  if (!info.isFile()) throw new Error(`\u53C2\u8003\u56FE\u4E0D\u662F\u6587\u4EF6\uFF1A${filePath}`);
  if (info.size > MAX_REF_BYTES) {
    throw new Error(`\u53C2\u8003\u56FE\u8D85\u8FC7 20MB\uFF1A${filePath}\uFF08${(info.size / 1024 / 1024).toFixed(1)}MB\uFF09`);
  }
  const bytes = await readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
function describeSubmitError(status, text) {
  const snippet = text.replace(/\s+/g, " ").trim();
  try {
    const parsed = JSON.parse(text);
    const fromObject = typeof parsed.error === "object" && parsed.error !== null ? parsed.error.message : void 0;
    const message = typeof fromObject === "string" ? fromObject : typeof parsed.error === "string" ? parsed.error : typeof parsed.message === "string" ? parsed.message : "";
    if (message !== "") return `HTTP ${status}\uFF1A${message}`;
  } catch {
  }
  return `HTTP ${status}\uFF1A${snippet.slice(0, 240) || "\uFF08\u65E0\u54CD\u5E94\u4F53\uFF09"}`;
}
function genLogsDir() {
  return join(exportDir(), "gen-tasks");
}
async function appendGenLog(record) {
  try {
    const dir = genLogsDir();
    await mkdir(dir, { recursive: true });
    const day = record.startedAt.slice(0, 10).replace(/-/g, "");
    await appendFile(join(dir, `${day}.jsonl`), `${JSON.stringify(record)}
`, "utf8");
  } catch (cause) {
    console.warn("[session-gallery] \u51FA\u56FE\u65E5\u5FD7\u5199\u5165\u5931\u8D25\uFF08\u4E0D\u5F71\u54CD\u51FA\u56FE\uFF09", cause);
  }
}
async function readGenLogs(limit) {
  const dir = genLogsDir();
  const files = (await readdir(dir).catch(() => [])).filter((file) => file.endsWith(".jsonl")).sort().reverse();
  const records = [];
  let bytes = 0;
  let total = 0;
  for (const file of files) {
    const full = join(dir, file);
    const info = await stat(full).catch(() => null);
    if (info !== null) bytes += info.size;
    if (records.length >= limit) continue;
    const text = await readFile(full, "utf8").catch(() => "");
    for (const line of text.split("\n")) {
      if (line === "") continue;
      total += 1;
      try {
        records.push(JSON.parse(line));
      } catch {
      }
    }
  }
  records.sort((a, b) => a.startedAt < b.startedAt ? 1 : -1);
  return {
    records: records.slice(0, limit),
    stats: { days: files.length, bytes, records: total, dir }
  };
}
async function clearGenLogs(day) {
  const dir = genLogsDir();
  if (day !== void 0 && day !== "") {
    const target = join(dir, `${day.replace(/[^0-9]/g, "")}.jsonl`);
    if (!isUnder(target, dir)) return 0;
    await unlink(target).catch(() => void 0);
    return 1;
  }
  const files = (await readdir(dir).catch(() => [])).filter((file) => file.endsWith(".jsonl"));
  for (const file of files) await unlink(join(dir, file)).catch(() => void 0);
  return files.length;
}
async function handleGenLogs(req, res) {
  if (req.method === "GET" || req.method === void 0) {
    const { records, stats } = await readGenLogs(300);
    sendJson(res, 200, { records, stats });
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    body = {};
  }
  const day = typeof body.day === "string" ? body.day : void 0;
  const removed = await clearGenLogs(day);
  sendJson(res, 200, { removed });
}
async function generateImagesInner(args, sessionId, log) {
  const gen = await readGenConfig();
  if (gen.baseURL === "") throw new Error("\u8FD8\u6CA1\u914D\u7F6E\u51FA\u56FE\u4E2D\u8F6C\u7AD9\uFF0C\u8BF7\u5230\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u586B\u5199");
  if (gen.credentialKey === "") {
    throw new Error("\u8FD8\u6CA1\u586B\u51ED\u636E\u540D\uFF08\u73AF\u5883\u53D8\u91CF\u540D\uFF0C\u6216 .credentials.yaml \u91CC\u7684\u952E\u540D\uFF09\uFF0C\u8BF7\u5230\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u586B\u5199");
  }
  const apiKey = await readCredential(gen.credentialKey);
  if (apiKey === "") throw new Error(`\u51ED\u636E\u91CC\u6CA1\u6709 ${gen.credentialKey}\uFF0C\u8BF7\u5230\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u586B API Key`);
  const model = args.model !== void 0 && args.model !== "" ? args.model : gen.defaultModel;
  if (model === "") {
    throw new Error("\u6CA1\u6709\u6307\u5B9A\u6A21\u578B\uFF0C\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u4E5F\u6CA1\u8BBE\u9ED8\u8BA4\u6A21\u578B\u3002\u8BF7\u5230\u63D2\u4EF6\u8BBE\u7F6E\u300C\u51FA\u56FE\u300D\u533A\u9009\u4E00\u4E2A\u9ED8\u8BA4\u6A21\u578B");
  }
  const root = gen.baseURL.replace(/\/+$/, "").replace(/\/v1$/i, "");
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const refPaths = args.images ?? [];
  if (refPaths.length > MAX_REFS) {
    throw new Error(`\u53C2\u8003\u56FE\u6700\u591A ${MAX_REFS} \u5F20\uFF0C\u8FD9\u6B21\u7ED9\u4E86 ${refPaths.length} \u5F20`);
  }
  const refs = [];
  const refMeta = [];
  for (const filePath of refPaths) {
    refs.push(await imageFileToDataUrl(filePath));
    const info = await stat(filePath).catch(() => null);
    refMeta.push({ name: basename(filePath), bytes: info?.size ?? 0 });
  }
  let maskInfo;
  if (args.mask !== void 0 && args.mask !== "") {
    if (gen.protocol === "openai-compat") {
      throw new Error(
        "mask \u53EA\u652F\u6301 APIMart \u5F02\u6B65\u534F\u8BAE\uFF08apimart-async\uFF09\uFF1B\u5F53\u524D\u901A\u9053\u662F openai-compat\uFF08OpenAI \u517C\u5BB9\uFF09\uFF0C\u5B83\u7684 /v1/images/generations \u6CA1\u6709 mask \u5B57\u6BB5\u3002\u8BF7\u6362\u6210 apimart-async \u901A\u9053\u518D\u8BD5"
      );
    }
    if (!modelSupportsMask(model)) {
      throw new Error(
        `\u5F53\u524D\u7EBF\u8DEF\u4E0D\u652F\u6301 mask\uFF1A\u6A21\u578B "${model}" \u6CA1\u6709\u5C40\u90E8\u91CD\u7ED8\u80FD\u529B\u3002\u8BF7\u6362\u6210 gpt-image-2.5-flare / gpt-image-2.5-sunburst / gpt-image-2-official`
      );
    }
    if (refPaths.length === 0) throw new Error("\u4F20 mask \u65F6\u5FC5\u987B\u540C\u65F6\u4F20 images\uFF08\u7B2C\u4E00\u5F20\u4E3A\u539F\u56FE\uFF09");
    maskInfo = await loadMask(args.mask, refPaths[0]);
  }
  const count = Math.min(6, Math.max(1, Math.round(args.n ?? 1)));
  log.request = {
    baseURL: gen.baseURL,
    protocol: gen.protocol,
    prompt: args.prompt,
    model,
    ...args.size === void 0 ? {} : { size: args.size },
    ...args.resolution === void 0 ? {} : { resolution: args.resolution },
    ...args.quality === void 0 ? {} : { quality: args.quality },
    n: count,
    ...refMeta.length === 0 ? {} : { references: refMeta },
    ...maskInfo === void 0 ? {} : {
      mask: {
        name: args.mask === void 0 ? "" : basename(args.mask),
        bytes: maskInfo.bytes,
        width: maskInfo.width,
        height: maskInfo.height
      }
    },
    ...args.extra === void 0 ? {} : { extra: args.extra }
  };
  log.children = Array.from({ length: count }, (_, index) => ({ index, status: "submitted" }));
  const buildBody = () => {
    const body = {
      model,
      prompt: args.prompt,
      // 两个主流模型都只支持一次请求出 1 张（gpt-image-2 静默忽略还照扣钱，
      // Seedream 直接 400），所以多张由下面并发提交来补，n 字段永远传 1。
      n: 1
    };
    if (gen.protocol === "openai-compat") {
      const ratio = args.size ?? "1:1";
      const tier = (args.resolution ?? "1k").toLowerCase();
      body.size = PIXEL_TABLE[ratio]?.[tier] ?? PIXEL_TABLE[ratio]?.["1k"] ?? "1024x1024";
      if (refs.length > 0) body.image = refs;
    } else {
      if (args.size !== void 0) body.size = args.size;
      if (args.resolution !== void 0) body.resolution = args.resolution;
      if (refs.length > 0) body.image_urls = refs;
      if (maskInfo !== void 0) body.mask_url = maskInfo.dataUrl;
    }
    if (args.quality !== void 0) body.quality = args.quality;
    if (args.extra !== void 0) Object.assign(body, args.extra);
    return JSON.stringify(body);
  };
  const submitOnce = async (index) => {
    const child = log.children[index];
    const submit = await curlRequest(`${root}/v1/images/generations`, {
      method: "POST",
      headers,
      body: buildBody(),
      proxy: gen.proxy,
      timeoutSec: 120
    });
    if (child !== void 0) {
      child.submitHttpStatus = submit.status;
      child.submitRaw = submit.text.slice(0, 8e3);
    }
    if (submit.status === 0) throw new Error("\u8FDE\u4E0D\u4E0A\u4E2D\u8F6C\u7AD9\uFF1A\u68C0\u67E5\u5730\u5740\uFF0C\u6216\u8BBE\u7F6E\u91CC\u7684\u4EE3\u7406");
    if (submit.status === 401 || submit.status === 403) throw new Error("API Key \u4E0D\u88AB\u63A5\u53D7\uFF08401/403\uFF09");
    if (submit.status === 429) throw new Error("\u4E2D\u8F6C\u7AD9\u9650\u6D41\uFF08HTTP 429\uFF09\uFF1A\u8FD9\u6B21\u8BF7\u6C42\u88AB\u7AD9\u70B9\u62D2\u7EDD\u4E86");
    if (submit.status !== 200) throw new Error(describeSubmitError(submit.status, submit.text));
    let parsed;
    try {
      parsed = JSON.parse(submit.text);
    } catch {
      throw new Error(`\u63D0\u4EA4\u8FD4\u56DE\u7684\u4E0D\u662F JSON\uFF1A${submit.text.slice(0, 200)}`);
    }
    const taskId = typeof parsed.task_id === "string" ? parsed.task_id : Array.isArray(parsed.data) && typeof parsed.data[0]?.task_id === "string" ? parsed.data[0].task_id : "";
    if (child !== void 0 && taskId !== "") child.taskId = taskId;
    if (taskId === "") {
      const found = collectImageUrls(parsed.data);
      if (found.length === 0) {
        const snippet = submit.text.replace(/\s+/g, " ").trim().slice(0, 200);
        throw new Error(`\u4E2D\u8F6C\u7AD9\u65E2\u6CA1\u7ED9\u4EFB\u52A1\u53F7\u3001\u4E5F\u6CA1\u7ED9\u56FE\u7247\u5730\u5740\uFF0C\u8FD4\u56DE\u662F\uFF1A${snippet}`);
      }
      if (child !== void 0) {
        child.status = "completed";
        child.urls = found;
      }
      return { urls: found, taskId: "" };
    }
    const deadline = Date.now() + 10 * 60 * 1e3;
    let lastError = "";
    let lastPollRaw = "";
    while (Date.now() < deadline) {
      await new Promise((resolve2) => setTimeout(resolve2, 2500));
      const poll = await curlRequest(`${root}/v1/tasks/${taskId}`, { headers, proxy: gen.proxy });
      lastPollRaw = poll.text.slice(0, 8e3);
      if (poll.status !== 200) {
        lastError = `HTTP ${poll.status}`;
        continue;
      }
      let task;
      try {
        task = JSON.parse(poll.text);
      } catch {
        lastError = "\u8FD4\u56DE\u4E0D\u662F JSON";
        continue;
      }
      const state = String(task.status ?? task.data?.status ?? "");
      const progress = typeof task.data?.progress === "number" ? task.data.progress : void 0;
      if (child !== void 0) {
        const polls = child.polls ?? (child.polls = []);
        const prev = polls[polls.length - 1];
        if (prev !== void 0 && prev.status === state && prev.progress === progress) {
          prev.repeat = (prev.repeat ?? 1) + 1;
        } else {
          polls.push({
            at: (/* @__PURE__ */ new Date()).toISOString(),
            status: state,
            ...progress === void 0 ? {} : { progress },
            httpStatus: poll.status
          });
        }
        if (state !== "") child.status = /fail|error/i.test(state) ? "failed" : "processing";
      }
      const found = collectImageUrls(task.data?.result?.images ?? task.data?.images);
      if (found.length > 0) {
        if (child !== void 0) {
          child.status = "completed";
          child.urls = found;
          if (typeof task.data?.cost === "number") child.costUsd = task.data.cost;
        }
        return {
          urls: found,
          ...typeof task.data?.cost === "number" ? { cost: task.data.cost } : {},
          taskId
        };
      }
      if (/fail|error/i.test(state)) {
        const failMessage = String(
          task.error?.message ?? task.data?.error?.message ?? ""
        ).trim();
        lastError = failMessage !== "" ? `\u4EFB\u52A1\u5931\u8D25\uFF1A${failMessage}` : `\u4EFB\u52A1\u5931\u8D25\uFF08${state}\uFF09`;
        break;
      }
    }
    if (lastError.startsWith("\u4EFB\u52A1\u5931\u8D25\uFF1A")) {
      if (child !== void 0) {
        child.status = "failed";
        if (lastPollRaw !== "") child.failRaw = lastPollRaw;
      }
      throw new Error(lastError);
    }
    if (child !== void 0) {
      child.status = "timeout";
      if (lastPollRaw !== "") child.failRaw = lastPollRaw;
    }
    throw new Error(
      `\u51FA\u56FE\u4EFB\u52A1\u8D85\u65F6\uFF08${lastError === "" ? "\u8FD8\u505C\u5728\u5904\u7406\u4E2D" : lastError}\uFF09\u3002\u4EFB\u52A1\u53F7 ${taskId}\uFF0C\u56FE\u53EF\u80FD\u4ECD\u5728\u751F\u6210\uFF0C\u7A0D\u540E\u53EF\u4EE5\u67E5\u56DE\uFF08GET /v1/tasks/${taskId}\uFF09\u3002`
    );
  };
  const settled = await Promise.allSettled(
    Array.from({ length: count }, (_, index) => submitOnce(index))
  );
  const pending = [];
  const failures = [];
  let cost;
  for (const [index, outcome] of settled.entries()) {
    const child = log.children[index];
    if (outcome.status === "fulfilled") {
      for (const url of outcome.value.urls) {
        pending.push({
          url,
          ...outcome.value.cost === void 0 ? {} : { cost: outcome.value.cost },
          ...outcome.value.taskId === "" ? {} : { taskId: outcome.value.taskId }
        });
      }
      if (outcome.value.cost !== void 0) cost = (cost ?? 0) + outcome.value.cost;
      if (child !== void 0) child.status = "completed";
    } else {
      const message = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      failures.push(message);
      if (child !== void 0) {
        child.status = message.includes("\u8D85\u65F6") ? "timeout" : "failed";
        child.error = message;
      }
    }
  }
  if (pending.length === 0) {
    throw new Error(failures.length > 0 ? failures.join("\uFF1B") : "\u6CA1\u6709\u62FF\u5230\u4EFB\u4F55\u56FE\u7247\u5730\u5740");
  }
  const settings = await readSettings();
  const dir = join(settings.root, "\u811A\u672C\u4EA7\u51FA");
  await mkdir(dir, { recursive: true });
  const files = [];
  const allocNo = await noAllocatorIfShared();
  for (const { url, cost: itemCost, taskId: itemTaskId } of pending.slice(0, 12)) {
    const tmp = join(dir, `.dl-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);
    let reason = await downloadTo(url, tmp, gen.proxy);
    if (reason !== null) {
      await new Promise((resolve2) => setTimeout(resolve2, 1500));
      reason = await downloadTo(url, tmp, gen.proxy);
    }
    if (reason !== null) {
      failures.push(`\u56FE\u7247\u4E0B\u8F7D\u5931\u8D25\uFF08${reason}\uFF09\uFF1A${url}`);
      await unlink(tmp).catch(() => {
      });
      continue;
    }
    const bytes = await readFile(tmp);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const size = imageSizeOf(bytes);
    const target = join(dir, `${hash}${size.ext}`);
    await rename(tmp, target).catch(async () => {
      await writeFile(target, bytes);
      await unlink(tmp).catch(() => {
      });
    });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const sidecar = {
      schemaVersion: 2,
      origin: "script",
      ...sessionId === "" ? {} : { sessionId },
      prompt: args.prompt,
      model,
      channel: "plugin",
      // 没传 size 就不写这个字段：站点会自己挑比例（实测 1:1 的请求回了
      // 1536×1024），写死 '1:1' 等于记一个假值。准确尺寸看 width/height。
      ...args.size === void 0 ? {} : { size: args.size },
      ...args.resolution === void 0 ? {} : { resolution: args.resolution },
      // quality 是 2.5 系列按质量计费的档位；gpt-image-2 传了也会被站点忽略，
      // 所以原样记录请求值 —— 大图「质量」一栏要能对上当时发的是哪一档。
      ...args.quality === void 0 || args.quality === "" ? {} : { quality: args.quality },
      ...refPaths.length === 0 ? {} : { referenceCount: refPaths.length },
      // 局部重绘：记下用过蒙版，方便回看「这张是 mask 改出来的」
      ...maskInfo === void 0 ? {} : {
        mask: {
          name: args.mask === void 0 ? "" : basename(args.mask),
          bytes: maskInfo.bytes,
          width: maskInfo.width,
          height: maskInfo.height
        }
      },
      width: size.width,
      height: size.height,
      bytes: bytes.length,
      hash,
      // 这张图自己那次任务的花费与任务号（不是本批总额）。
      ...itemCost === void 0 ? {} : { costUsd: itemCost },
      ...itemTaskId === void 0 ? {} : { taskId: itemTaskId },
      createdAt: now,
      importedAt: now
    };
    await writeSidecarMerged(join(dir, `${hash}.json`), sidecar, allocNo);
    files.push({ path: target, width: size.width, height: size.height, bytes: bytes.length, hash });
  }
  if (files.length === 0) throw new Error("\u56FE\u7247\u4E0B\u8F7D\u5931\u8D25\uFF08\u5730\u5740\u53EF\u80FD\u5DF2\u8FC7\u671F\uFF09");
  log.result = {
    dir,
    files: files.map((file) => ({
      hash: file.hash,
      width: file.width,
      height: file.height,
      bytes: file.bytes
    })),
    ...cost === void 0 ? {} : { costUsd: cost }
  };
  log.failures = failures;
  return { files, dir, model, failures, ...cost === void 0 ? {} : { cost } };
}
async function generateImages(args, sessionId) {
  const started = Date.now();
  const log = {
    id: `gen-${started.toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
    startedAt: new Date(started).toISOString(),
    status: "running",
    source: "live",
    machine: MACHINE_NAME,
    ...sessionId === "" ? {} : { sessionId },
    request: {
      baseURL: "",
      protocol: "",
      prompt: args.prompt,
      model: args.model ?? "",
      n: Math.min(6, Math.max(1, Math.round(args.n ?? 1)))
    },
    children: []
  };
  try {
    const result = await generateImagesInner(args, sessionId, log);
    log.status = result.failures.length > 0 ? "partial" : "completed";
    return result;
  } catch (cause) {
    log.status = "failed";
    log.error = cause instanceof Error ? cause.message : String(cause);
    for (const child of log.children) {
      if (child.status === "submitted" || child.status === "processing") {
        child.status = log.error.includes("\u8D85\u65F6") ? "timeout" : "failed";
        if (child.error === void 0) child.error = log.error;
      }
    }
    throw cause;
  } finally {
    log.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    log.elapsedMs = Date.now() - started;
    await appendGenLog(log);
  }
}
function resolveExplorer() {
  const systemRoot = process.env.SystemRoot ?? process.env.windir ?? "C:\\Windows";
  const full = join(systemRoot, "explorer.exe");
  return existsSync(full) ? full : "explorer.exe";
}
function revealInFileManager(target) {
  if (process.platform === "win32") {
    const explorer = resolveExplorer();
    execFile(explorer, [`/select,${target}`], { windowsHide: false }, (cause) => {
      if (cause !== null && cause !== void 0) {
        console.warn("[session-gallery] \u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25", cause);
      }
    });
    return;
  }
  if (process.platform === "darwin") {
    execFile("open", ["-R", target], () => {
    });
    return;
  }
  execFile("xdg-open", [dirname(target)], () => {
  });
}
async function revealAndWait(target) {
  if (process.platform !== "win32") {
    revealInFileManager(target);
    return { ok: true };
  }
  const explorer = resolveExplorer();
  return await new Promise((resolve2) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve2(value);
    };
    const child = execFile(explorer, [`/select,${target}`], { windowsHide: false }, (cause) => {
      if (cause === null || cause === void 0) {
        finish({ ok: true });
        return;
      }
      const code = cause.code;
      finish(code === "ENOENT" ? { ok: false, detail: `\u627E\u4E0D\u5230 ${explorer}` } : { ok: true, detail: `explorer \u9000\u51FA\u7801\u975E 0\uFF08\u901A\u5E38\u65E0\u5F71\u54CD\uFF09\uFF1A${code ?? "unknown"}` });
    });
    child.on("error", (cause) => {
      const code = cause.code;
      finish(code === "ENOENT" ? { ok: false, detail: "\u627E\u4E0D\u5230 explorer.exe" } : { ok: false, detail: `\u542F\u52A8 explorer \u5931\u8D25\uFF1A${code ?? cause.message}` });
    });
  });
}
async function handleReveal(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const raw = body.path;
  if (typeof raw !== "string" || raw === "") {
    sendJson(res, 400, { error: "no-path" });
    return;
  }
  const target = resolve(raw);
  const settings = await readSettings();
  const roots = [settings.root, ...settings.legacyRoots];
  if (!roots.some((root) => isUnder(target, root))) {
    sendJson(res, 403, { error: "outside-library" });
    return;
  }
  const info = await stat(target).catch(() => null);
  if (info === null || !info.isFile()) {
    sendJson(res, 404, { error: "not-found" });
    return;
  }
  const result = await revealAndWait(target);
  sendJson(res, 200, {
    ok: result.ok,
    path: target,
    ...result.detail === void 0 ? {} : { detail: result.detail }
  });
}
async function handleDelete(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const rawPaths = Array.isArray(body.paths) ? body.paths : [];
  const paths = rawPaths.filter((p) => typeof p === "string" && p !== "");
  if (paths.length === 0) {
    sendJson(res, 400, { error: "no-paths" });
    return;
  }
  const permanent = body.permanent === true;
  const settings = await readSettings();
  const roots = [settings.root, ...settings.legacyRoots];
  const trashDir = join(settings.root, TRASH_DIR_NAME);
  const failed = [];
  const targets = [];
  for (const raw of paths) {
    const target = resolve(raw);
    const ext = extname(target).toLowerCase();
    if (!IMAGE_EXT.has(ext)) {
      failed.push({ path: raw, error: "not-an-image" });
      continue;
    }
    if (!roots.some((root) => isUnder(target, root))) {
      failed.push({ path: raw, error: "outside-library" });
      continue;
    }
    const sidecar = target.slice(0, -ext.length) + ".json";
    const info = await stat(target).catch(() => null);
    if (info === null || !info.isFile()) {
      failed.push({ path: raw, error: "not-found" });
      continue;
    }
    targets.push({ target, sidecar });
  }
  const succeeded = [];
  let mode = permanent ? "permanent" : "recycle-bin";
  if (permanent) {
    for (const { target, sidecar } of targets) {
      try {
        await unlink(target);
        await unlink(sidecar).catch(() => void 0);
        succeeded.push(target);
      } catch (cause) {
        failed.push({ path: target, error: cause instanceof Error ? cause.message : String(cause) });
      }
    }
  } else {
    const allFiles = [];
    for (const { target, sidecar } of targets) {
      allFiles.push(target);
      const exists = await stat(sidecar).catch(() => null);
      if (exists !== null && exists.isFile()) allFiles.push(sidecar);
    }
    const recycled = await recycleToWindowsBin(allFiles);
    if (recycled.ok) {
      for (const { target } of targets) succeeded.push(target);
      const bad = new Set(recycled.failedPaths.map((p) => resolve(p)));
      for (const path of bad) failed.push({ path, error: "recycle-failed" });
    } else {
      mode = "trash";
      for (const { target, sidecar } of targets) {
        try {
          await mkdir(trashDir, { recursive: true });
          const stamp = Date.now().toString(36);
          await rename(target, join(trashDir, `${stamp}-${basename(target)}`));
          await rename(sidecar, join(trashDir, `${stamp}-${basename(sidecar)}`)).catch(() => void 0);
          succeeded.push(target);
        } catch (cause) {
          failed.push({ path: target, error: cause instanceof Error ? cause.message : String(cause) });
        }
      }
    }
  }
  sendJson(res, 200, {
    mode,
    deleted: succeeded.length,
    failed,
    trashDir: mode === "trash" ? trashDir : void 0
  });
}
function recycleToWindowsBin(paths) {
  if (process.platform !== "win32" || paths.length === 0) {
    return Promise.resolve({ ok: false, failedPaths: [] });
  }
  const batch = paths.slice(0, 50);
  const list = batch.map((p) => `'${p.replace(/'/g, "''")}'`).join(",");
  const script = [
    "Add-Type -AssemblyName Microsoft.VisualBasic;",
    `$paths = @(${list});`,
    "$bad = @();",
    "foreach ($p in $paths) {",
    '  try { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p, "OnlyErrorDialogs", "SendToRecycleBin") }',
    "  catch { $bad += $p }",
    "};",
    'if ($bad.Count -gt 0) { Write-Output ("FAILED:" + ($bad -join "|")) }'
  ].join(" ");
  return new Promise((resolve2) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout: 12e4, windowsHide: true },
      (error, stdout) => {
        const text = String(stdout ?? "");
        const marker = text.indexOf("FAILED:");
        if (error !== null) {
          resolve2({ ok: false, failedPaths: [] });
          return;
        }
        if (marker >= 0) {
          const rest = text.slice(marker + 7).trim();
          resolve2({ ok: true, failedPaths: rest === "" ? [] : rest.split("|") });
          return;
        }
        resolve2({ ok: true, failedPaths: [] });
      }
    );
  });
}
function extOfMedia(mediaType) {
  switch (mediaType) {
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/bmp":
      return ".bmp";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".png";
  }
}
function stampOf(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function sessionFolderName(sessionId) {
  const short = sessionId.replace(/^session-/, "").replace(/[^a-zA-Z0-9]+/g, "").slice(0, 8);
  return short === "" ? "unknown" : short;
}
function importedIndexFile() {
  return join(exportDir(), "imported.json");
}
async function readImportedIndex() {
  try {
    const raw = await readFile(importedIndexFile(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}
async function saveImportedIndex(index) {
  try {
    await mkdir(exportDir(), { recursive: true });
    await writeFile(importedIndexFile(), JSON.stringify(index), "utf8");
  } catch {
  }
}
async function handleManualImport(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req, 96 * 1024 * 1024));
  } catch (cause) {
    sendJson(res, 400, {
      error: cause instanceof Error && cause.message === "body-too-large" ? "payload-too-large" : "invalid-request"
    });
    return;
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const rawFiles = Array.isArray(body.files) ? body.files : [];
  const files = rawFiles.slice(0, 20);
  if (files.length === 0) {
    sendJson(res, 400, { error: "no-files" });
    return;
  }
  const settings = await readSettings();
  const dir = join(settings.root, MANUAL_IMPORT_DIR);
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    sendJson(res, 500, { error: "mkdir-failed" });
    return;
  }
  const saved = [];
  const failed = [];
  const allocNo = await noAllocatorIfShared();
  for (const file of files) {
    const name2 = typeof file.name === "string" && file.name !== "" ? file.name : "image.png";
    const encoded = typeof file.dataBase64 === "string" ? file.dataBase64 : "";
    if (encoded === "") {
      failed.push({ name: name2, error: "empty" });
      continue;
    }
    try {
      const data = Buffer.from(encoded, "base64");
      if (data.length === 0 || data.length > 32 * 1024 * 1024) {
        failed.push({ name: name2, error: "size-out-of-range" });
        continue;
      }
      const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
      const mediaType = typeof file.mediaType === "string" ? file.mediaType : void 0;
      const ext = extOfMedia(mediaType);
      const fileName = `${stampOf(Date.now())}-${hash}${ext}`;
      const filePath = join(dir, fileName);
      await writeFile(filePath, data);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const sidecar = {
        schemaVersion: 2,
        origin: "manual",
        originalName: name2,
        ...sessionId === "" ? {} : { sessionId },
        mediaType,
        createdAt: now,
        importedAt: now
      };
      await writeSidecarMerged(filePath.slice(0, -ext.length) + ".json", sidecar, allocNo);
      saved.push({ path: filePath, name: fileName });
    } catch (cause) {
      failed.push({ name: name2, error: cause instanceof Error ? cause.message : String(cause) });
    }
  }
  sendJson(res, 200, { files: saved, failed, dir });
}
async function handleArchive(req, res, attachments) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method-not-allowed" });
    return;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "origin-rejected" });
    return;
  }
  let body;
  try {
    body = JSON.parse(await readBody(req, 4 * 1024 * 1024));
  } catch {
    sendJson(res, 400, { error: "invalid-request" });
    return;
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (rawItems.length === 0) {
    sendJson(res, 400, { error: "no-items" });
    return;
  }
  const settings = await readSettings();
  const folder = join(settings.root, SESSION_IMPORT_DIR, sessionFolderName(sessionId));
  const index = await readImportedIndex();
  const saved = [];
  const failed = [];
  let changed = false;
  const allocNo = await noAllocatorIfShared();
  const genMeta = /* @__PURE__ */ new Map();
  for (const entry of await readGenSidecars()) {
    if (!genMeta.has(entry.hash)) genMeta.set(entry.hash, entry.meta);
  }
  for (const raw of rawItems) {
    const item = raw;
    const origin = item.origin === "user" ? "user" : "tool";
    if (item.attachment === void 0 || item.attachment === null || typeof item.attachment !== "object") {
      failed.push({ error: "invalid-attachment" });
      continue;
    }
    const attachmentId = item.attachment.attachmentId;
    if (typeof attachmentId === "string" && index[attachmentId] !== void 0) {
      saved.push({ path: join(settings.root, index[attachmentId]) });
      continue;
    }
    try {
      const stored = await attachments.readImage(item.attachment);
      const data = Buffer.from(stored.data);
      if (data.length === 0 || data.length > 64 * 1024 * 1024) {
        failed.push({ error: "size-out-of-range" });
        continue;
      }
      const mediaType = stored.ref?.mediaType ?? item.attachment.mediaType;
      const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
      const fileName = `${stampOf(Date.now())}-${hash}${extOfMedia(mediaType)}`;
      await mkdir(folder, { recursive: true });
      const filePath = join(folder, fileName);
      await writeFile(filePath, data);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const source = item.attachment;
      const borrowed = genMeta.get(hash) ?? {};
      const sidecar = {
        // 先铺脚本 sidecar 的创作元数据（prompt / model / channel / size / costUsd / taskId …）
        ...borrowed,
        schemaVersion: 2,
        // 来源保留脚本标记，图片库按「脚本产物」筛时仍能筛到
        origin: typeof borrowed.origin === "string" ? borrowed.origin : origin,
        sessionId,
        ...typeof attachmentId === "string" ? { sourceAttachmentId: attachmentId } : {},
        ...mediaType === void 0 ? {} : { mediaType },
        ...source.width === void 0 ? {} : { width: source.width },
        ...source.height === void 0 ? {} : { height: source.height },
        // 出图时间优先保留原值，否则排序会按「归档时间」走，图会排到最后
        createdAt: typeof borrowed.createdAt === "string" ? borrowed.createdAt : now,
        importedAt: now
      };
      await writeSidecarMerged(
        filePath.slice(0, -extname(filePath).length) + ".json",
        sidecar,
        allocNo
      );
      if (typeof attachmentId === "string") index[attachmentId] = relative(settings.root, filePath);
      saved.push({ path: filePath });
      changed = true;
    } catch (cause) {
      failed.push({ error: cause instanceof Error ? cause.message : String(cause) });
    }
  }
  if (changed) await saveImportedIndex(index);
  sendJson(res, 200, { files: saved, failed, dir: folder });
}
export {
  apply,
  name
};
