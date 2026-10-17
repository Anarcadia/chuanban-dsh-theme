/*
 * chuanban-dsh-theme - 客户端源（浏览器侧）
 * 由 scripts/build-client.mjs 包装成 DSH lazy-CJS 模块，输出 dist/client.js。
 * 本文件是 `factory: (require) => { ... }` 的函数体，可使用 require / module / exports。
 *
 * 皮肤方案（D148 Phase 1，浅度定制）：
 * - 全部走官方通道：ctx.theme.overrideTokens token 覆盖层 + 一个 <style data-plugin> 全局微调。
 * - 零 MutationObserver / TreeWalker / 轮询；token 经 theme-presenter 一次性写入 body，动效性能零负担。
 * - 配色对标 D143 absoulutely-chuanban：暖白纸 #FBF9F5 / 温暖炭黑 #2C2B29 / 陶土 #D97757 / 牛皮纸侧栏 #F1E8DC。
 * - light/dark 均填暖纸浅色值（固定暖纸外观；语义状态色 / toast / diff 保留官方默认）。
 * - 三层字体（二次调整）：UI 层 Anthropic Sans + 苹方；正文层 Anthropic Serif + 苹方；代码层纯更纱 Slab 等宽。
 *   中文暂时全线回退苹方（质感分析结论：苹方圆润温润贴近 Claude 原生感，更纱冷硬骨感相悖）。
 */

// —— 字体 token（body 内联变量遮蔽 ui-theme base.css 的 :root 定义）——
// 2026-10-17 二次调整（依 Claude Desktop 字形质感分析结论）：
//   中文全线暂时回退苹方 PingFang SC（人文黑体、起收笔微圆弧、中宫开阔，温润圆润），
//   替换首版的更纱中文（工业骨感、平直硬切角，与 Claude 原生感相悖）；
//   西文维持 Anthropic Sans/Serif（正圆几何字怀 + 板状衬线）。
//   代码/终端层唯一保留纯更纱 Mono Slab（1:2 中西文等宽硬需求）。
var FONT_UI = "'Anthropic Sans Web', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
var FONT_READING = "'Anthropic Serif Web', 'PingFang SC', serif";
var FONT_CODE = "'Sarasa Mono Slab SC', '等距更纱黑体 Slab SC', 'SF Mono', 'JetBrains Mono', Menlo, Consolas, 'PingFang SC', monospace";

// 值对辅助：light/dark 同值（固定暖纸浅色，D148 立项决策）
var pair = function (v) { return { light: v, dark: v }; };

var TOKENS = {
  // 字体
  '--dsw-font-family': pair(FONT_UI),
  '--ds-font-family-code': pair(FONT_CODE),

  // 背景面（纸面阶梯，2026-10-17 四改：整体等比例淡化一档，白卡输入框方案不变）
  '--dsw-alias-bg-base': pair('#FBF9F5'),
  '--dsw-alias-bg-layer-1': pair('#FBF9F5'),
  '--dsw-alias-bg-layer-2': pair('#F7F4EE'),
  '--dsw-alias-bg-layer-3': pair('#F4EFE7'),
  '--dsw-alias-bg-overlay': pair('#FDFBF7'),
  '--dsw-alias-bg-module-platform': pair('#F1EAE0'),
  '--dsw-alias-bg-multi-select': pair('#F1EAE0'),

  // 边框（实色暖灰梯度再加深一档——「实」的框线是 Antigravity/D143 核心思路；
  // 官方 CSS 已用 .5px 发丝线宽，颜色实化后即为 Claude 式清晰锐利细线）
  '--dsw-alias-border-l1': pair('#E4E0D7'),
  '--dsw-alias-border-l2': pair('#DAD5CA'),
  '--dsw-alias-border-l3': pair('#D0C9BB'),
  '--dsw-alias-border-l4': pair('#C6BFAE'),

  // 品牌与强调（Anthropic 陶土）
  '--dsw-alias-brand-primary': pair('#D97757'),
  '--dsw-alias-brand-primary-invert': pair('#FBF9F5'),
  '--dsw-alias-brand-text': pair('#C4633F'),
  '--dsw-alias-button-primary-fill': pair('#D97757'),
  '--dsw-alias-button-primary-hover': pair('#C66A4C'),
  '--dsw-alias-button-info-fill': pair('#D97757'),
  '--dsw-alias-button-info-hover': pair('#C66A4C'),
  '--dsw-alias-state-business-primary': pair('#D97757'),
  '--dsw-alias-state-business-tertiary': pair('#F3DDD3'),
  '--dsw-alias-link': pair('#C4633F'),

  // 文字（深炭压实：功能性小字（模型 ID/「完全权限」等）对齐主文字深度段，
  // 层级靠字号区分而非变灰——Claude Desktop 原生做法；像素实测两轮 #6 段灰
  // 肉眼不可辨，本轮全部拉入 #3-#4 深炭段）
  '--dsw-alias-label-primary': pair('#2C2B29'),
  '--dsw-alias-label-secondary': pair('#38342C'),
  '--dsw-alias-label-tertiary': pair('#3F3B33'),
  '--dsw-alias-label-caption': pair('#5C564A'),
  '--dsw-alias-label-dimmed': pair('#6E685C'),
  '--dsw-alias-label-primary-bluish': pair('#2C2B29'),
  '--dsw-alias-label-primary-dimmed': pair('#33302A'),
  '--dsw-alias-menu-icon': pair('#38342C'),

  // 交互面（陶土暖晕）
  '--dsw-alias-interactive-bg-hover': pair('rgba(180, 120, 90, 0.07)'),
  '--dsw-alias-interactive-bg-active': pair('rgba(180, 120, 90, 0.12)'),
  '--dsw-alias-interactive-bg-hover-accent': pair('rgba(217, 119, 87, 0.14)'),
  '--dsw-alias-interactive-bg-hover-solid': pair('#F3E9DE'),

  // 按钮（浅面）
  '--dsw-alias-button-elevated-fill': pair('#FBF9F5'),
  '--dsw-alias-button-floating-fill': pair('#FBF9F5'),
  '--dsw-alias-button-floating-hover': pair('#F3E9DE'),
  '--dsw-alias-button-ghost-active-fill': pair('#F1EAE0'),
  '--dsw-alias-button-ghost-active-hover': pair('#EFE6D9'),
  '--dsw-alias-button-ghost-active-border': pair('#D5C8B5'),
  '--dsw-alias-button-contrast-fill': pair('#2C2B29'),

  // markdown 区（代码块/行内码/引用/标签走暖纸纸色系）
  '--dsw-alias-markdown-code-block': pair('#F1EAE0'),
  '--dsw-alias-markdown-code-block-banner': pair('#EBE2D5'),
  '--dsw-alias-markdown-inline-code': pair('#F1EAE0'),
  '--dsw-alias-markdown-citation': pair('#E6D9C8'),
  '--dsw-alias-markdown-tag': pair('#E6D9C8'),
  '--dsw-alias-markdown-placeholder': pair('#C9BFAF'),
  '--dsw-alias-turn-trigger-bg': pair('#F1EAE0'),

  // 滚动条（暖纸纸色系）
  '--dsw-alias-scrollbar-bg-l1': pair('#E3D9CB'),
  '--dsw-alias-scrollbar-bg-l2': pair('#E3D9CB'),
  '--dsw-alias-scrollbar-hover-l1': pair('#D5C8B5'),
  '--dsw-alias-scrollbar-hover-l2': pair('#D5C8B5'),

  // 侧栏（燕麦暖灰淡化一档：#ECE8DF → #F1EEE7，与主区 #FBF9F5 保持 ~12 单位关系；
  // darwin 平台特化着色层在 GLOBAL_CSS 中另行中和，见下）
  '--dsw-specific-sidebar-fill': pair('#F1EEE7'),
  '--dsw-specific-sidebar-nav-item-active': pair('#E9E4DA'),
  '--dsw-specific-sidebar-nav-item-hover': pair('#EDE9E0'),
  '--dsw-specific-sidebar-nav-item-active-accent': pair('#F3DDD3'),

  // 气泡与输入面（2026-10-17 三改：输入卡片改纯白 #FFFFFF，靠暖光阴影浮于略深主区上——
  // 借鉴 ZCode UI「白卡片 + 阴影 + 偏深主界面」的对比方式，替代先前「随左栏同色」方案）
  '--dsw-specific-bubble': pair('#F8F4ED'),
  '--dsw-specific-bubble-highlight': pair('#F3E0D4'),
  '--dsw-specific-input-major': pair('#FFFFFF'),
  '--dsw-specific-selector': pair('#F1EAE0'),
  '--dsw-specific-tip': pair('#F1EAE0'),

  // 菜单与设置卡
  '--dsw-specific-menu': pair('#FDFBF7'),
  '--dsw-alias-menu-group-header-fill': pair('#FDFBF7'),
  '--dsw-alias-settings-card-fill': pair('#F7F2E9'),
  '--dsw-alias-settings-card-stroke': pair('#C6BFAE')
};

// 全局微调（官方 token 面之外的唯一补充，保持极薄）
var GLOBAL_CSS = [
  '::selection { background: rgba(217, 119, 87, 0.25); }',
  // 微负字距（-0.01em）：西文词组凝聚成致密墨块带，强化「扎实沉稳」质感（对中文影响轻微）
  'body { -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }',
  // darwin 平台特化层中和：桌面端 CSS 对侧栏列叠了
  // linear-gradient(#8f89b8 紫灰) + color-mix(sidebar-fill 混 3% #7a9bf0 蓝, 40% 透明)，
  // 会把任何 sidebar-fill 压暗偏灰紫（#F1E8DC 实渲成 #DBD4D1）。
  // 用稳定锚点覆盖回 token 目标色；sidebarCol 为 CSS Modules local 名后缀
  // （hash 前缀构建间变化，local 名稳定），官方改名时本规则失效、无害回落平台层。
  '[data-platform="darwin"] [class$="_sidebarCol"] { background: #F1EEE7 !important; }',
  // 正文阅读层：Anthropic Serif 西文 + 苹方中文（对齐 Claude Desktop 原生观感）。
  // 锚点为桌面端 app.asar（2026-09-29 build）提取的 CSS Modules 确切 class
  // （gKv1-q = AssistantMarkdown）；DSH 升级后 hash 变化则规则失配，
  // 正文无害回落 UI 层字体栈（Anthropic Sans + 苹方）。
  '.gKv1-q_root, .gKv1-q_body { font-family: ' + FONT_READING + ' !important; }',
  // 输入卡片（asar 锚点 yhfFVG_card，排除 cardWorkspaceTrigger 虚线选区态）：
  // 纯白卡片（input-major token）浮于略深主区上的对比由本组阴影承担：
  // 1) 边线 1/3 加粗加深（0.5px→0.67px，stroke #B3AA9B）；
  // 2) 初始即有细微外散暖晕（双层低透明暖褐扩散，替代官方中性黑柔光）；
  // 3) 聚焦（光标进入）时暖晕以快速动效（0.18s 官方 ease）大幅增强：
  //    更深边线 + 双层加大加深的暖光外散 + 陶土色 3px 光环。
  // 纯 CSS focus-within，零 JS、零轮询。
  '.yhfFVG_card:not(.yhfFVG_cardWorkspaceTrigger) { --dsw-elevation-stroke-color: #A89F8E !important; box-shadow: 0 0 0 0.67px var(--dsw-elevation-stroke-color), 0 2px 10px 0 rgba(96, 76, 55, 0.05), 0 8px 28px 0 rgba(96, 76, 55, 0.06) !important; transition: box-shadow 0.18s var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important; }',
  '.yhfFVG_card:not(.yhfFVG_cardWorkspaceTrigger):focus-within { box-shadow: 0 0 0 0.67px #978D7A, 0 4px 18px 0 rgba(180, 118, 76, 0.10), 0 12px 44px 0 rgba(180, 118, 76, 0.16), 0 0 0 3px rgba(217, 119, 87, 0.10) !important; }',
  // 侧栏 + 会话列表字号跟随（asar 锚点 _3WPZCG_root / _3WPZCG_newSession）：
  // 官方字号轴只驱动主区 delta 体系，侧栏根与「新建会话」写死 14px；接入官方
  // delta 惯用法（默认字号时 delta=0 观感与原生一致，调大时全体同步）。
  // 整页布局级缩放不走 CSS zoom（弹层库 rect 视觉坐标与 style.top 布局单位
  // 错乘，结构性错位），改由 --force-device-scale-factor 启动开关承担（见 README）。
  '._3WPZCG_root, ._3WPZCG_newSession { font-size: calc(14px + var(--dsh-content-font-delta, 0px)) !important; }',
  // 会话目录树行（asar 锚点 jJkEga = ui-session Rows 组件）：标题类显式写死 14px
  // 覆盖继承，故侧栏根跟随对它无效；同样接入官方 delta。小字（时间戳等 12/13px）
  // 按官方缩放契约「Small typography keeps fixed sizes」保持固定。
  '.jJkEga_title, .jJkEga_renameInput, .jJkEga_searchResultTitle, .jJkEga_hoverTitle { font-size: calc(14px + var(--dsh-content-font-delta, 0px)) !important; }'
].join('\n');

var PLUGIN_ID = 'chuanban-dsh-theme';

var inject = ['theme'];

function apply(ctx) {
  // token 覆盖层：effect 生命周期内常驻，插件卸载/禁用时 disposer 自动摘除整层
  ctx.effect(function () {
    return ctx.theme.overrideTokens('chuanban-skin', TOKENS);
  }, PLUGIN_ID + ': warm-paper token layer');

  // 全局微调样式：<style data-plugin> 与官方 ui-theme 同一注入通道，卸载自动清理
  ctx.effect(function () {
    if (typeof document === 'undefined') return;
    var tag = document.createElement('style');
    tag.dataset.plugin = PLUGIN_ID;
    tag.textContent = GLOBAL_CSS;
    document.head.appendChild(tag);
    return function () { tag.remove(); };
  }, PLUGIN_ID + ': global css');
}

exports.apply = apply;
exports.inject = inject;
exports.CHUANBAN_THEME_TOKENS = TOKENS;
