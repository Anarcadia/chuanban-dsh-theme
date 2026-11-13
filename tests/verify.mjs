// 自检：client bundle 结构、token 覆盖层形状与关键项、host 产物、patch 声明、跨平台 Windows 修復与内嵌 WOFF2 字体。
// 运行：node tests/verify.mjs（先 node scripts/build-client.mjs）
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'chuanban-dsh-theme';
let pass = 0, fail = 0;
const ok = (name, cond) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
};

console.log('[1] client bundle 结构');
const clientPath = join(root, 'dist/client.js');
ok('dist/client.js 存在', existsSync(clientPath));
const client = readFileSync(clientPath, 'utf8');
ok('lazy-CJS 包装（window.__ModuleLoader__.load）', client.includes('window.__ModuleLoader__.load'));
ok('模块 id 正确', client.includes(JSON.stringify(ID)));
ok('factory 体闭合（return module.exports）', client.includes('return module.exports;'));

console.log('[2] token 覆盖层（模拟 wrapper 执行 fonts-woff2 + skin 源，取导出）');
const fontsSrc = readFileSync(join(root, 'src/client/fonts-woff2.js'), 'utf8');
const skinSrc = readFileSync(join(root, 'src/client/skin.js'), 'utf8');
const mod = { exports: {} };
new Function('require', 'module', 'exports', fontsSrc + '\n' + skinSrc)(() => { throw new Error('skin.js 顶层不应 require 平台模块'); }, mod, mod.exports);
const tokens = mod.exports.CHUANBAN_THEME_TOKENS;
ok('导出 CHUANBAN_THEME_TOKENS / apply / inject', !!(tokens && mod.exports.apply && Array.isArray(mod.exports.inject)));
ok('inject 声明依赖 theme 服务', mod.exports.inject.includes('theme'));
const badShape = Object.entries(tokens).filter(([, v]) =>
  typeof v !== 'object' || v === null || typeof v.light !== 'string' || typeof v.dark !== 'string');
ok('全部 ' + Object.keys(tokens).length + ' 个 token 均为 {light, dark} 字符串对（防 overrideTokens TypeError）', badShape.length === 0);
if (badShape.length) console.error('    违规项：', badShape.map(([k]) => k).join(', '));
const badName = Object.keys(tokens).filter((k) => !k.startsWith('--'));
ok('全部 token 名以 -- 开头', badName.length === 0);

console.log('[3] 关键 token 覆盖检查');
const required = {
  '--dsw-font-family': "Anthropic Sans Web",
  '--ds-font-family-code': "Sarasa Mono Slab SC",
  '--dsw-alias-bg-base': '#FBF9F5',
  '--dsw-alias-label-primary': '#2C2B29',
  '--dsw-alias-brand-primary': '#D97757',
  '--dsw-specific-sidebar-fill': '#F1EEE7',
  '--dsw-specific-sidebar-nav-item-active': '#DFD9CE',
  '--dsw-alias-markdown-code-block': '#F1EAE0',
};
for (const [name, expect] of Object.entries(required)) {
  const v = tokens[name];
  const isFontStack = /Sarasa|Anthropic/.test(expect); // 字体 token 为完整字体栈，断言包含字体名
  const hit = isFontStack
    ? (v?.light?.includes(expect) && v?.dark?.includes(expect))
    : (v?.light === expect && v?.dark === expect);
  ok(name + (isFontStack ? ' 包含 ' : ' = ') + expect, hit);
}

console.log('[4] host 半部与 patch 声明');
const host = readFileSync(join(root, 'dist/index.js'), 'utf8');
ok('dist/index.js 存在且导出 name=chuanban-theme + 空 apply', host.includes("export const name = 'chuanban-theme'") && host.includes('export function apply'));
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8');
ok('cordis.patch.yml 声明挂载行', patch.includes('id: chuanban-theme') && patch.includes("'chuanban-dsh-theme'"));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
ok('package.json dsh.client（platform=web, inject ui-theme）+ exports ./client',
  pkg.dsh?.client?.platform === 'web' && pkg.dsh?.client?.inject?.includes('@deepseek-ai/dsh-client-ui-theme') && !!pkg.exports?.['./client']);
ok('darwin 平台特化层中和规则（sidebarCol 后缀锚点）存在', skinSrc.includes('[data-platform="darwin"] [class$="_sidebarCol"]'));
ok('正文阅读层 Anthropic Serif 规则（0.2.2-rc.3 asar 锚点 XNZzAa）存在', skinSrc.includes('.XNZzAa_root') && skinSrc.includes('Anthropic Serif Web'));
ok('中文回退苹方：UI/正文栈含 PingFang SC 且不含更纱', tokens['--dsw-font-family'].light.includes('PingFang SC') && !tokens['--dsw-font-family'].light.includes('Sarasa UI'));
ok('质感参数：全局微负字距（侧栏字重已恢复官方默认 400）', skinSrc.includes('letter-spacing: -0.01em') && !skinSrc.includes('font-weight: 450'));
const borderTokens = ['--dsw-alias-border-l1', '--dsw-alias-border-l2', '--dsw-alias-border-l3', '--dsw-alias-border-l4', '--dsw-alias-settings-card-stroke'];
ok('框线实色化（边框 token 无半透明 rgba）', borderTokens.every((k) => /^#[0-9A-Fa-f]{6}$/.test(tokens[k].light)));
ok('功能性小字深炭段（secondary #38342C / tertiary #3F3B33，贴近主文字）', tokens['--dsw-alias-label-secondary'].light === '#38342C' && tokens['--dsw-alias-label-tertiary'].light === '#3F3B33');
ok('输入卡片纯白（input-major = #FFFFFF，靠阴影浮于偏深主区）', tokens['--dsw-specific-input-major'].light === '#FFFFFF');
ok('主区略偏深承托白卡（bg-base = #FBF9F5，整体淡化一档后）', tokens['--dsw-alias-bg-base'].light === '#FBF9F5');
ok('输入框线 1/3 加粗 + 加深（0.67px stroke #A89F8E 锚点规则，JZLxKW）', skinSrc.includes('0 0 0 0.67px') && skinSrc.includes('#A89F8E') && skinSrc.includes('.JZLxKW_card'));
ok('字号跟随（官方 delta 惯用法）：侧栏根 kB3qhq + 会话树行 JoiKIa 锚点', skinSrc.includes('.kB3qhq_root') && skinSrc.includes('.JoiKIa_title'));
ok('v0.1.1 漂移修复：wash/tint 层 token 中和 + 新纸面 token（bg-layer-4/card 组）', tokens['--dsw-specific-sidebar-wash-top'].light === 'transparent' && tokens['--dsw-alias-bg-layer-4'].light === '#F1EAE0' && tokens['--dsw-alias-card-fill'].light === '#F7F4EE');
ok('v0.1.1 已删 0.2.2 无消费者 token（tip / markdown-placeholder / brand-text 等）', !('--dsw-specific-tip' in tokens) && !('--dsw-alias-markdown-placeholder' in tokens) && !('--dsw-alias-brand-text' in tokens));
ok('CSS zoom 方案已撤（弹层结构性错位，全局缩放交启动开关）', !skinSrc.includes('style.zoom'));
ok('输入框初始暖晕 + 聚焦增强动效（focus-within + 0.18s transition）', skinSrc.includes(':focus-within') && skinSrc.includes('transition: box-shadow 0.18s'));

console.log('[5] 方案一：左右纵横双向等比例同步缩放（--cb-scale + 跨平台免哈希选择器 + layout store 联动）');
ok('GLOBAL_CSS 包含跨平台通用 CSS Modules 选择器 c(name) 与纵向参数化规则（sessionRow / panelRow / trigger / data-row-key / data-windows-titlebar）',
  skinSrc.includes('function c(name)') &&
  skinSrc.includes('[data-row-key^="session:"]') &&
  skinSrc.includes('[data-windows-titlebar]') &&
  skinSrc.includes('height: calc(32px * var(--cb-scale, 1))') &&
  skinSrc.includes('height: calc(42px * var(--cb-scale, 1))') &&
  skinSrc.includes('font-size: calc(14px * var(--cb-scale, 1))') &&
  skinSrc.includes('--workspace-toolbar-height: calc(36px * var(--cb-scale, 1))'));
ok('GLOBAL_CSS 包含右侧正文列宽同步缩放规则（.kiGsTW_body / [data-conversation-content] / --dsh-chat-content-width）',
  skinSrc.includes('.kiGsTW_body') && skinSrc.includes('[data-conversation-content]') && skinSrc.includes('--dsh-chat-content-width: var(--dsh-chat-user-width'));

// 模拟 apply(ctx) 运行态：验证 --cb-scale 初始化、theme/change 联动与 setSidebar 按比例调用、以及 disposer 清理
let injectedStyleContent = '';
{
  const bodyProps = new Map();
  const prevDoc = globalThis.document;
  globalThis.document = {
    head: { appendChild() {} },
    createElement() {
      return {
        dataset: {},
        set textContent(v) { injectedStyleContent = v; },
        get textContent() { return injectedStyleContent; },
        remove() {},
      };
    },
    body: {
      style: {
        setProperty(k, v) { bodyProps.set(k, v); },
        getPropertyValue(k) { return bodyProps.get(k) || ''; },
        removeProperty(k) { bodyProps.delete(k); },
      },
    },
  };
  try {
    let sidebarWidth = 280;
    const setSidebarCalls = [];
    const mockStore = {
      getSnapshot: () => ({ layoutInfo: { sidebar: sidebarWidth } }),
      actions: {
        setSidebar(px) {
          sidebarWidth = px;
          setSidebarCalls.push(px);
        },
      },
    };
    const listeners = new Map();
    const disposers = [];
    const mockCtx = {
      theme: {
        overrideTokens: () => () => {},
        getTheme: () => ({ fontSizes: { text: 14 } }),
      },
      slots: {
        entries: (name) => name === 'root' ? [{ options: { store: { create: () => mockStore } } }] : [],
        subscribe: () => () => {},
      },
      on(ev, cb) {
        listeners.set(ev, cb);
        return () => listeners.delete(ev);
      },
      effect(fn) {
        const d = fn();
        if (typeof d === 'function') disposers.push(d);
      },
    };
    mod.exports.apply(mockCtx);
    ok('apply(ctx) 初始字号 14px 时 --cb-scale = 1', globalThis.document.body.style.getPropertyValue('--cb-scale') === '1');
    const onThemeChange = listeners.get('theme/change');
    onThemeChange({ fontSizes: { text: 16 } });
    ok('theme/change (14 -> 16) 更新 --cb-scale = 1.1429 且按比例调整 sidebar=320',
      globalThis.document.body.style.getPropertyValue('--cb-scale') === '1.1429' &&
      setSidebarCalls.length === 1 && setSidebarCalls[0] === 320);

    // 验证夹逼防漂移：先从 16px 切回 14px（自动恢复 280），再模拟宿主 setSidebar(px) 在 12px 时将 240 夹逼为下限 264，随后切回 14px 应精确恢复 280（而非 264*14/12=308）
    onThemeChange({ fontSizes: { text: 14 } });
    setSidebarCalls.length = 0;
    mockStore.actions.setSidebar = (px) => {
      sidebarWidth = Math.max(264, Math.min(420, px));
      setSidebarCalls.push(sidebarWidth);
    };
    onThemeChange({ fontSizes: { text: 12 } });
    onThemeChange({ fontSizes: { text: 14 } });
    ok('防夹逼漂移：14px(280) -> 12px(夹逼264) -> 14px 精确恢复 sidebar=280（零漂移膨胀）',
      setSidebarCalls.length === 2 && setSidebarCalls[0] === 264 && setSidebarCalls[1] === 280);

    for (const d of disposers) d();
    ok('disposer 清理后移除 body 上的 --cb-scale', globalThis.document.body.style.getPropertyValue('--cb-scale') === '');

    // 回归验证：真实 Cordis Proxy 下未 inject slots 时访问 ctx.slots 会抛错，且 StoredEntry.store 位于顶层
    let sidebar17 = 280;
    const setSidebar17Calls = [];
    const mockStore17 = {
      getSnapshot: () => ({ layoutInfo: { sidebar: sidebar17 } }),
      actions: {
        setSidebar(px) {
          sidebar17 = px;
          setSidebar17Calls.push(px);
        },
      },
    };
    const cordisSlots = {
      entries: (name) => name === 'root' ? [{ store: { create: () => mockStore17 }, options: {} }] : [],
      subscribe: () => () => {},
    };
    const cordisDisposers = [];
    const cordisCtx = {
      theme: {
        overrideTokens: () => () => {},
        getTheme: () => ({ fontSizes: { text: 17 } }),
      },
      get slots() {
        throw new Error('cannot get property "slots" without inject');
      },
      get(name) {
        return name === 'slots' ? cordisSlots : undefined;
      },
      on() { return () => {}; },
      effect(fn) {
        const d = fn();
        if (typeof d === 'function') cordisDisposers.push(d);
      },
    };
    mod.exports.apply(cordisCtx);
    ok('Cordis Proxy 防护（17px 启动 + ctx.slots 抛错 + entry.store）：未抛异常且 --cb-scale=1.2143，setSidebar(340)',
      globalThis.document.body.style.getPropertyValue('--cb-scale') === '1.2143' &&
      setSidebar17Calls.length === 1 && setSidebar17Calls[0] === 340);
    for (const d of cordisDisposers) d();
  } finally {
    if (prevDoc === undefined) delete globalThis.document;
    else globalThis.document = prevDoc;
  }
}

console.log('[6] 双阶按压/展开加深与实体层次感规则');
ok('--dsw-alias-interactive-bg-hover = rgba(48, 42, 34, 0.075)', tokens['--dsw-alias-interactive-bg-hover']?.light === 'rgba(48, 42, 34, 0.075)');
ok('--dsw-alias-interactive-bg-active = rgba(48, 42, 34, 0.145)', tokens['--dsw-alias-interactive-bg-active']?.light === 'rgba(48, 42, 34, 0.145)');
ok('--dsw-menu-surface-fill = #FFFFFF', tokens['--dsw-menu-surface-fill']?.light === '#FFFFFF');
ok('--dsw-specific-bubble = #F3EDE2', tokens['--dsw-specific-bubble']?.light === '#F3EDE2');
ok('--dsw-specific-selector = #EAE4DA', tokens['--dsw-specific-selector']?.light === '#EAE4DA');
ok('GLOBAL_CSS 含 aria-expanded="true" 锁定展开态选择器', skinSrc.includes('aria-expanded="true"'));
ok('GLOBAL_CSS 含 _chevronOpen 下拉指示器选择器', skinSrc.includes('_chevronOpen'));
ok('GLOBAL_CSS 含 :active 瞬态按压加深', skinSrc.includes(':active'));
ok('GLOBAL_CSS 含 .JZLxKW_add 输入框添加按钮三态', skinSrc.includes('.JZLxKW_add'));
ok('GLOBAL_CSS 含 [class*="_surface_"] 下拉与浮层立体感', skinSrc.includes('[class*="_surface_"]'));
ok('GLOBAL_CSS 含 #C5BCAE 浮层边框/阴影色', skinSrc.includes('#C5BCAE'));
ok('GLOBAL_CSS 含 .kB3qhq_newSession 新建会话分层与选中行加深', skinSrc.includes('.kB3qhq_newSession'));
ok('GLOBAL_CSS 含 md-code-block 代码块边框与顶栏', skinSrc.includes('md-code-block'));
ok('GLOBAL_CSS 含 [data-expandable] 工具折叠行 hover/active 变色', skinSrc.includes('[data-expandable]'));
ok('GLOBAL_CSS 含 [class*="_bubble_"]:not([role="tooltip"]) 排除 Tooltip 气泡边线', skinSrc.includes('[class*="_bubble_"]:not([role="tooltip"])'));
ok('零 setInterval 轮询运行时开销（离场残影等效果均为 rAF 节流 MutationObserver）', !skinSrc.includes('setInterval') && skinSrc.includes('requestAnimationFrame'));

console.log('[7] Phase C：流式状态栏 Claude 橙色系与鲸鱼慢速大幅摇摆（流式渐显引擎已退役，流式渲染 100% 原生）');
ok('--dsw-alias-label-deep-diving = #CE6846', tokens['--dsw-alias-label-deep-diving']?.light === '#CE6846');
ok('--dsw-alias-label-deep-diving-shimmer = #F4B293', tokens['--dsw-alias-label-deep-diving-shimmer']?.light === '#F4B293');
ok('--dsw-alias-label-shimmer = rgba(217, 119, 87, 0.42)', tokens['--dsw-alias-label-shimmer']?.light === 'rgba(217, 119, 87, 0.42)');
ok('GLOBAL_CSS 含流式状态栏橙色加固规则（[data-chat-running] / .tnXGgG_running）',
  skinSrc.includes('[data-chat-running]') && skinSrc.includes('.tnXGgG_running') && skinSrc.includes('#CE6846'));
ok('GLOBAL_CSS 含鲸鱼矢量大幅慢速摆动（cb-whale-slow-swing 3.2s / 43% 86% / ±22deg）',
  skinSrc.includes('cb-whale-slow-swing') && skinSrc.includes('3.2s') && skinSrc.includes('43% 86%') && skinSrc.includes('rotate(-22deg)'));
ok('GLOBAL_CSS 含关闭 APNG 动画与解容器裁切规则（display: none / overflow: visible）',
  skinSrc.includes('runningWhaleAnimated') && skinSrc.includes('overflow: visible'));
ok('流式渐显引擎已退役剥离：GLOBAL_CSS 无任何流式遮罩/幕布规则（[data-cb-stream-root] / --cb-stream-* / 块级下浮动画 / stream-tail 死规则 / will-change 巨层 全部不存在）',
  !skinSrc.includes('[data-cb-stream-root]') && !skinSrc.includes('--cb-stream') && !skinSrc.includes('cb-stream-sheet-in') && !skinSrc.includes('data-cb-stream-tail') && !skinSrc.includes('will-change: mask-image'));
ok('源码含剥离决定（已整体剥离（2026-11-14 决策放弃））且零引擎实现残留（lockAngle / findLastText / __cbStream / margin-bottom 引擎等全部不存在）',
  skinSrc.includes('已整体剥离（2026-11-14 决策放弃') && !skinSrc.includes('lockAngle') && !skinSrc.includes('findLastText') && !skinSrc.includes('__cbStream') && !skinSrc.includes("setProperty('margin-bottom'"));

console.log('[8] Phase D：浮现卡片与上拉/下拉菜单渐变出现与消失动效');
ok('GLOBAL_CSS 含透明毛玻璃底衬层中和（[data-menu-backing] opacity: 0）',
  skinSrc.includes('[data-menu-backing]') && skinSrc.includes('opacity: 0 !important'));
ok('GLOBAL_CSS 含 cb-popup-enter-up / cb-popup-enter-down 入场关键帧',
  skinSrc.includes('@keyframes cb-popup-enter-up') && skinSrc.includes('@keyframes cb-popup-enter-down'));
ok('GLOBAL_CSS 含 cb-popup-exit-up / cb-popup-exit-down 退场关键帧',
  skinSrc.includes('@keyframes cb-popup-exit-up') && skinSrc.includes('@keyframes cb-popup-exit-down'));
ok('GLOBAL_CSS 含 cb-hovercard-enter / cb-hovercard-exit 侧栏预览卡关键帧',
  skinSrc.includes('@keyframes cb-hovercard-enter') && skinSrc.includes('@keyframes cb-hovercard-exit'));
ok('GLOBAL_CSS 声明轻快动效时长（185ms 进入 / 145ms 退出 / 195ms HoverCard）',
  skinSrc.includes('185ms') && skinSrc.includes('145ms') && skinSrc.includes('195ms'));
ok('GLOBAL_CSS 包含 .cb-exit-ghost 离场残影容器规则（fixed / pointer-events: none）',
  skinSrc.includes('.cb-exit-ghost') && skinSrc.includes('position: fixed !important') && skinSrc.includes('pointer-events: none !important'));
ok('apply(ctx) 包含浮层离场残影 effect（floating card exit transition + WeakMap + sanitizeGhost）',
  skinSrc.includes('floating card exit transition') && skinSrc.includes('FLOAT_SELECTOR') && skinSrc.includes('WeakMap') && skinSrc.includes('sanitizeGhost'));
ok('P0/P1/P2 对抗审查修复项（排除 aria-modal 模态框 + [data-trigger-menu] + hasActiveCards O(1) 门禁 + :where 零权重排除）',
  skinSrc.includes(':not([aria-modal="true"]):not([data-shortcut-modal])') &&
  skinSrc.includes('[data-trigger-menu]') &&
  skinSrc.includes('hasActiveCards') &&
  skinSrc.includes(':where(:not('));

console.log('[9] GitHub Issue #1 & Windows 联调（FIX A/B/C/D/G1/G3 + 内嵌 WOFF2 可变字体）');
ok('UI 字体栈包含 Windows DirectWrite 别名 Anthropic Sans Web Display Light 与 Microsoft YaHei UI',
  tokens['--dsw-font-family'].light.includes('Anthropic Sans Web Display Light') &&
  tokens['--dsw-font-family'].light.includes('Microsoft YaHei UI'));
ok('正文阅读层包含 Anthropic Serif Web Display Light、Microsoft YaHei UI 与 Georgia 回退',
  skinSrc.includes('Anthropic Serif Web Display Light') &&
  skinSrc.includes('Microsoft YaHei UI') &&
  skinSrc.includes('Georgia'));
ok('代码字体栈包含 Anthropic Mono Web 与 Cascadia Mono 回退',
  tokens['--ds-font-family-code'].light.includes('Anthropic Mono Web') &&
  tokens['--ds-font-family-code'].light.includes('Cascadia Mono'));
ok('正文阅读层绑定免哈希稳定类名 [class*="_markdown_"] 并穿透覆盖 --dsw-font-markdown-base',
  skinSrc.includes('[class*="_markdown_"]') &&
  skinSrc.includes('--dsw-font-markdown-base:') &&
  skinSrc.includes(':where(p, li, blockquote, td, th)'));
ok('[cb-win-fix A] SVG 缩放包 :where() 降特异性 + 展开态 .arrowOpen 保留旋转与缩放',
  skinSrc.includes(":where(' + c('slot') + ') svg") &&
  skinSrc.includes("c('arrow') + c('arrowOpen')") &&
  skinSrc.includes('rotate(90deg) scale(var(--cb-scale, 1))'));
ok('[cb-win-fix B/G1/G3] 输入卡 [data-composer-card] 跨平台锚点 + letter-spacing: normal + min-height: 52px',
  skinSrc.includes("[data-composer-card]:not(' + c('cardWorkspaceTrigger') + ')") &&
  skinSrc.includes('[data-composer-card] { letter-spacing: normal; }') &&
  skinSrc.includes("min-height: 52px"));
ok('[cb-win-fix C/D] 新建会话免 topSection 依赖分支 + 底部设置触发器 settingsArea 分支',
  skinSrc.includes("c('root') + ':not(' + c('collapsed') + ') ' + c('newSession')") &&
  skinSrc.includes("c('settingsArea') + ' ' + c('trigger') + ':not(' + c('rail')"));
ok('[Todo #2] 内嵌 Anthropic Sans / Serif / Mono 三款 WOFF2 可变字体（开箱即用，注入 GLOBAL_CSS 与 dist/client.js）',
  injectedStyleContent.includes("@font-face { font-family: 'Anthropic Sans Web'") &&
  injectedStyleContent.includes("@font-face { font-family: 'Anthropic Serif Web'") &&
  injectedStyleContent.includes("@font-face { font-family: 'Anthropic Mono Web'") &&
  client.includes('data:font/woff2;base64,'));

console.log(fail === 0 ? '\n全部 ' + pass + ' 项通过' : '\n' + fail + ' 项失败');
process.exit(fail === 0 ? 0 : 1);
