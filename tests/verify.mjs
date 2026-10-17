// 自检：client bundle 结构、token 覆盖层形状与关键项、host 产物、patch 声明。
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

console.log('[2] token 覆盖层（模拟 wrapper 执行 skin 源，取导出）');
const skinSrc = readFileSync(join(root, 'src/client/skin.js'), 'utf8');
const mod = { exports: {} };
new Function('require', 'module', 'exports', skinSrc)(() => { throw new Error('skin.js 顶层不应 require 平台模块'); }, mod, mod.exports);
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
  '--dsw-specific-sidebar-nav-item-active': '#E9E4DA',
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
ok('正文阅读层 Anthropic Serif 规则（asar 锚点 gKv1-q）存在', skinSrc.includes('.gKv1-q_root') && skinSrc.includes('Anthropic Serif Web'));
ok('中文回退苹方：UI/正文栈含 PingFang SC 且不含更纱', tokens['--dsw-font-family'].light.includes('PingFang SC') && !tokens['--dsw-font-family'].light.includes('Sarasa UI'));
ok('质感参数：全局微负字距（侧栏字重已恢复官方默认 400）', skinSrc.includes('letter-spacing: -0.01em') && !skinSrc.includes('font-weight: 450'));
const borderTokens = ['--dsw-alias-border-l1', '--dsw-alias-border-l2', '--dsw-alias-border-l3', '--dsw-alias-border-l4', '--dsw-alias-settings-card-stroke'];
ok('框线实色化（边框 token 无半透明 rgba）', borderTokens.every((k) => /^#[0-9A-Fa-f]{6}$/.test(tokens[k].light)));
ok('功能性小字深炭段（secondary #38342C / tertiary #3F3B33，贴近主文字）', tokens['--dsw-alias-label-secondary'].light === '#38342C' && tokens['--dsw-alias-label-tertiary'].light === '#3F3B33');
ok('输入卡片纯白（input-major = #FFFFFF，靠阴影浮于偏深主区）', tokens['--dsw-specific-input-major'].light === '#FFFFFF');
ok('主区略偏深承托白卡（bg-base = #FBF9F5，整体淡化一档后）', tokens['--dsw-alias-bg-base'].light === '#FBF9F5');
ok('输入框线 1/3 加粗 + 加深（0.67px stroke #A89F8E 锚点规则）', skinSrc.includes('0 0 0 0.67px') && skinSrc.includes('#A89F8E'));
ok('字号跟随（官方 delta 惯用法）：侧栏根 + 会话树行 Rows 锚点', skinSrc.includes('_3WPZCG_root') && skinSrc.includes('.jJkEga_title'));
ok('CSS zoom 方案已撤（弹层结构性错位，全局缩放交启动开关）', !skinSrc.includes('style.zoom'));
ok('输入框初始暖晕 + 聚焦增强动效（focus-within + 0.18s transition）', skinSrc.includes(':focus-within') && skinSrc.includes('transition: box-shadow 0.18s'));

console.log(fail === 0 ? '\n全部 ' + pass + ' 项通过' : '\n' + fail + ' 项失败');
process.exit(fail === 0 ? 0 : 1);
