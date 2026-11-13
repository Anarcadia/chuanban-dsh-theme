/*
 * chuanban-dsh-theme - 客户端源（浏览器侧）
 * 由 scripts/build-client.mjs 包装成 DSH lazy-CJS 模块，输出 dist/client.js。
 * 本文件是 `factory: (require) => { ... }` 的函数体，可使用 require / module / exports。
 *
 * 皮肤方案（D148 Phase 1，浅度定制）：
 * - 全部走官方通道：ctx.theme.overrideTokens token 覆盖层 + 一个 <style data-plugin> 全局微调。
 * - 零流式轮询 / TreeWalker；token 经 theme-presenter 一次性写入 body，流式渲染 100% 原生。
 * - 配色对标 D143 absoulutely-chuanban：暖白纸 #FBF9F5 / 温暖炭黑 #2C2B29 / 陶土 #D97757 / 牛皮纸侧栏 #F1E8DC。
 * - light/dark 均填暖纸浅色值（固定暖纸外观；语义状态色 / toast / diff 保留官方默认）。
 * - 三层字体（内嵌 Anthropic Sans/Serif/Mono WOFF2 可变字体，开箱即用）：
 *   UI 层 Anthropic Sans + 苹方/雅黑；正文层 Anthropic Serif + 苹方/雅黑；代码层更纱 Slab / Anthropic Mono 等宽。
 */

// —— 字体 token（body 内联变量遮蔽 ui-theme base.css 的 :root 定义）——
// 2026-10-17 二次调整（依 Claude Desktop 字形质感分析结论）：
//   中文全线暂时回退苹方 PingFang SC（人文黑体、起收笔微圆弧、中宫开阔，温润圆润），
//   替换首版的更纱中文（工业骨感、平直硬切角，与 Claude 原生感相悖）；
//   西文维持 Anthropic Sans/Serif（正圆几何字怀 + 板状衬线，已通过 fonts-woff2.js 内嵌 WOFF2 可变字体）。
//   代码/终端层唯一保留更纱 Mono Slab + 内嵌 Anthropic Mono Web。
var FONT_UI = "'Anthropic Sans Web', 'Anthropic Sans Web Display Light', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif";
var FONT_READING = "'Anthropic Serif Web', 'Anthropic Serif Web Display Light', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Georgia, serif";
var FONT_CODE = "'Sarasa Mono Slab SC', '等距更纱黑体 Slab SC', 'Anthropic Mono Web', 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, 'PingFang SC', 'Microsoft YaHei UI', 'Microsoft YaHei', monospace";

// 值对辅助：light/dark 同值（固定暖纸浅色，D148 立项决策）
var pair = function (v) { return { light: v, dark: v }; };

// 2026-11-13 v0.1.1（DSH 0.2.2-rc.3 漂移修复，D148 §六）：
//   - 删 7 个已无消费者的 token（tip / sidebar-nav-item-hover / markdown-placeholder /
//     button-ghost-active-hover / brand-text / brand-primary-invert / bg-multi-select）；
//   - 补 0.2.2 新面暖色映射：bg-layer-4 / bg-skeleton / card 组 / bg-document-preview /
//     separator / turn-trigger-bg-hover / sidebar wash-tint-glass 组（wash 层为旧 darwin
//     紫灰渐变的新形态，token 置 transparent + GLOBAL_CSS !important 双保险中和）；
//   - GLOBAL_CSS 四组 asar 锚点重提取：gKv1-q→XNZzAa、yhfFVG→JZLxKW、_3WPZCG→kB3qhq、
//     jJkEga→JoiKIa（会话树行自 ui-session 迁至 ui-workspace）；_sidebarCol 后缀锚点
//     仍命中（新前缀 PIRFFq），保留。
var TOKENS = {
  // 字体
  '--dsw-font-family': pair(FONT_UI),
  '--ds-font-family-code': pair(FONT_CODE),

  // 背景面（纸面阶梯，2026-10-17 四改：整体等比例淡化一档，白卡输入框方案不变）
  '--dsw-alias-bg-base': pair('#FBF9F5'),
  '--dsw-alias-bg-layer-1': pair('#FBF9F5'),
  '--dsw-alias-bg-layer-2': pair('#F7F4EE'),
  '--dsw-alias-bg-layer-3': pair('#F4EFE7'),
  '--dsw-alias-bg-layer-4': pair('#F1EAE0'),
  '--dsw-alias-bg-overlay': pair('#FDFBF7'),
  '--dsw-alias-bg-module-platform': pair('#F1EAE0'),
  '--dsw-alias-bg-skeleton': pair('rgba(96, 76, 55, 0.05)'),
  '--dsw-alias-bg-document-preview': pair('#F1EAE0'),

  // 卡片面（0.2.2 新面：官方 neutral-50/100/半透明白 → 暖纸同位面）
  '--dsw-alias-card-fill': pair('#F7F4EE'),
  '--dsw-alias-card-fill-hover': pair('#F1EAE0'),
  '--dsw-alias-card-tile-fill': pair('rgba(253, 251, 247, 0.5)'),

  // 边框（实色暖灰梯度加固——「实」的框线是 Antigravity/D143 核心思路；
  // 官方 CSS 已用 .5px 发丝线宽，颜色实化后即为 Claude 式清晰锐利细线）
  '--dsw-alias-border-l1': pair('#E2DDD2'),
  '--dsw-alias-border-l2': pair('#D6CFC2'),
  '--dsw-alias-border-l3': pair('#C8BFAE'),
  '--dsw-alias-border-l4': pair('#B9AF9C'),
  '--dsw-alias-separator-primary': pair('#E2DDD2'),

  // 品牌与强调（Anthropic 陶土）
  '--dsw-alias-brand-primary': pair('#D97757'),
  '--dsw-alias-button-primary-fill': pair('#D97757'),
  '--dsw-alias-button-primary-hover': pair('#C66A4C'),
  '--dsw-alias-button-info-fill': pair('#D97757'),
  '--dsw-alias-button-info-hover': pair('#C66A4C'),
  '--dsw-alias-state-business-primary': pair('#D97757'),
  '--dsw-alias-state-business-tertiary': pair('#F3DDD3'),
  '--dsw-alias-link': pair('#C4633F'),
  '--dsw-alias-label-deep-diving': pair('#CE6846'),
  '--dsw-alias-label-deep-diving-shimmer': pair('#F4B293'),
  '--dsw-alias-label-shimmer': pair('rgba(217, 119, 87, 0.42)'),

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

  // 交互面（Warm Stone / Oat Ink 暖石双阶色阶，对齐 Claude Desktop 灰阶压深比）
  '--dsw-alias-interactive-bg-hover': pair('rgba(48, 42, 34, 0.075)'),
  '--dsw-alias-interactive-bg-active': pair('rgba(48, 42, 34, 0.145)'),
  '--dsw-alias-interactive-bg-hover-accent': pair('rgba(217, 119, 87, 0.16)'),
  '--dsw-alias-interactive-bg-hover-solid': pair('#E5DFD3'),

  // 按钮（浅面）
  '--dsw-alias-button-elevated-fill': pair('#FAF7F2'),
  '--dsw-alias-button-floating-fill': pair('#FAF7F2'),
  '--dsw-alias-button-floating-hover': pair('#ECE6DA'),
  '--dsw-alias-button-ghost-active-fill': pair('#DFD8CC'),
  '--dsw-alias-button-ghost-active-border': pair('#C4B9A5'),
  '--dsw-alias-button-contrast-fill': pair('#2C2B29'),

  // markdown 区（代码块/行内码/引用/标签走暖纸纸色系）
  '--dsw-alias-markdown-code-block': pair('#F1EAE0'),
  '--dsw-alias-markdown-code-block-banner': pair('#EBE2D5'),
  '--dsw-alias-markdown-inline-code': pair('#F1EAE0'),
  '--dsw-alias-markdown-citation': pair('#E6D9C8'),
  '--dsw-alias-markdown-tag': pair('#E6D9C8'),
  '--dsw-alias-turn-trigger-bg': pair('#F1EAE0'),
  '--dsw-alias-turn-trigger-bg-hover': pair('rgba(48, 42, 34, 0.075)'),

  // 滚动条（暖纸纸色系）
  '--dsw-alias-scrollbar-bg-l1': pair('#E3D9CB'),
  '--dsw-alias-scrollbar-bg-l2': pair('#E3D9CB'),
  '--dsw-alias-scrollbar-hover-l1': pair('#D5C8B5'),
  '--dsw-alias-scrollbar-hover-l2': pair('#D5C8B5'),

  // 侧栏（燕麦暖灰淡化一档：#ECE8DF → #F1EEE7，与主区 #FBF9F5 保持 ~12 单位关系；
  // darwin 平台特化着色层在 GLOBAL_CSS 中另行中和，见下）
  '--dsw-specific-sidebar-fill': pair('#F1EEE7'),
  '--dsw-specific-sidebar-nav-item-active': pair('#DFD9CE'),
  '--dsw-specific-sidebar-nav-item-active-accent': pair('#F3DDD3'),
  // 0.2.2 wash/tint/glass 层（darwin 特化渐变的新形态，官方叠紫灰 #8f89b8 / 蓝 #7a9bf0）：
  // token 全部置 transparent / 暖纸半透明，令 sidebar-fill 独占侧栏着色
  '--dsw-specific-sidebar-wash-top': pair('transparent'),
  '--dsw-specific-sidebar-wash-top-clear': pair('transparent'),
  '--dsw-specific-sidebar-wash-bottom': pair('transparent'),
  '--dsw-specific-sidebar-wash-bottom-clear': pair('transparent'),
  '--dsw-specific-sidebar-tint': pair('transparent'),
  '--dsw-specific-sidebar-glass-fill': pair('#FAF7F2'),
  '--dsw-specific-sidebar-glass-hover': pair('#EFECE4'),
  '--dsw-specific-sidebar-glass-collapsed-fill': pair('transparent'),
  '--dsw-specific-sidebar-glass-collapsed-hover': pair('rgba(48, 42, 34, 0.075)'),

  // 气泡与输入面（2026-10-17 三改：输入卡片改纯白 #FFFFFF，靠暖光阴影浮于略深主区上——
  // 借鉴 ZCode UI「白卡片 + 阴影 + 偏深主界面」的对比方式，替代先前「随左栏同色」方案）
  '--dsw-specific-bubble': pair('#F3EDE2'),
  '--dsw-specific-bubble-highlight': pair('#F3E0D4'),
  '--dsw-specific-input-major': pair('#FFFFFF'),
  '--dsw-specific-selector': pair('#EAE4DA'),

  // 菜单与设置卡（对齐 Claude Desktop 纯白高对比浮层）
  '--dsw-specific-menu': pair('#FFFFFF'),
  '--dsw-menu-surface-fill': pair('#FFFFFF'),
  '--dsw-alias-menu-group-header-fill': pair('#FFFFFF'),
  '--dsw-alias-settings-card-fill': pair('#F7F2E9'),
  '--dsw-alias-settings-card-stroke': pair('#C6BFAE')
};

// 跨平台 CSS Modules 通用选择器构造器（同时命中 macOS <hash>_<name>、Windows Vite _<name>_<hash>_<line> 与多类名拼接）
function c(name) {
  return ':is([class$="_' + name + '"], [class*="_' + name + ' "], [class*="_' + name + '_"])';
}

// 全局微调（官方 token 面之外的唯一补充，保持极薄；顶部注入内嵌 Anthropic Sans/Serif/Mono WOFF2 @font-face）
var GLOBAL_CSS = [
  typeof CB_EMBEDDED_FONT_CSS === 'string' && CB_EMBEDDED_FONT_CSS ? CB_EMBEDDED_FONT_CSS : '',
  '::selection { background: rgba(217, 119, 87, 0.25); }',
  // 微负字距（-0.01em）：西文词组凝聚成致密墨块带，强化「扎实沉稳」质感（对中文影响轻微）
  // 同时在 :root 与 body 声明默认 --cb-scale: 1 作为参数化等比缩放基数
  ':root, body { --cb-scale: 1; }',
  'body { -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }',
  // darwin 平台特化层中和：桌面端 CSS 对侧栏列叠了 wash 渐变（#8f89b8 紫灰 /
  // #7a9bf0 蓝，0.2.2 起改由 sidebar-wash-*/sidebar-tint token 驱动，token 已置
  // transparent）+ 本规则 !important 双保险覆盖回暖纸目标色；sidebarCol 为 CSS
  // Modules local 名后缀（hash 前缀构建间变化，local 名稳定——0.2.2-rc.3 实测仍命中），
  // 官方改名时本规则失效、无害回落平台层。
  '[data-platform="darwin"] [class$="_sidebarCol"], [data-platform="darwin"] ' + c('sidebarCol') + ' { background: #F1EEE7 !important; }',
  // 正文阅读层：Anthropic Serif 西文 + 苹方/雅黑中文（对齐 Claude Desktop 原生观感）。
  // 同时绑定 CSS Modules 永久稳定 local 名 [class*="_markdown_"] / [class$="_markdown"]
  // （对应 ui-primitives MarkdownText.module.css 的 .markdown）与局部 --dsw-font-markdown-* 变量，
  // 穿透子组件 `font: var(--dsw-font-markdown-base)` 简写覆盖，跨 DSH 0.2.0/0.2.1/0.2.2+ 全版本永久生效。
  '.XNZzAa_root, .XNZzAa_body, [class*="_markdown_"], [class$="_markdown"] { --dsw-font-family: ' + FONT_READING + ' !important; --dsw-font-markdown-base: var(--dsh-content-font-size, 14px) / calc(24px + var(--dsh-content-font-delta, 0px)) ' + FONT_READING + ' !important; --dsw-font-markdown-base-font-family: ' + FONT_READING + ' !important; --dsw-font-markdown-base-strong: 600 var(--dsh-content-font-size, 14px) / calc(24px + var(--dsh-content-font-delta, 0px)) ' + FONT_READING + ' !important; --dsw-font-markdown-base-strong-font-family: ' + FONT_READING + ' !important; --dsw-font-markdown-base-italic: italic var(--dsh-content-font-size, 14px) / calc(24px + var(--dsh-content-font-delta, 0px)) ' + FONT_READING + ' !important; --dsw-font-markdown-base-italic-font-family: ' + FONT_READING + ' !important; --dsw-font-markdown-base-strong-italic: italic 600 var(--dsh-content-font-size, 14px) / calc(24px + var(--dsh-content-font-delta, 0px)) ' + FONT_READING + ' !important; --dsw-font-markdown-base-strong-italic-font-family: ' + FONT_READING + ' !important; --dsw-font-markdown-table: var(--dsh-content-font-size-secondary, 13px) / calc(22px + var(--dsh-content-font-delta-secondary, 0px)) ' + FONT_READING + ' !important; --dsw-font-markdown-table-font-family: ' + FONT_READING + ' !important; --dsw-font-markdown-table-head: 500 var(--dsh-content-font-size-secondary, 13px) / calc(22px + var(--dsh-content-font-delta-secondary, 0px)) ' + FONT_READING + ' !important; --dsw-font-markdown-table-head-font-family: ' + FONT_READING + ' !important; font-family: ' + FONT_READING + ' !important; }',
  '[class*="_markdown_"] :where(p, li, blockquote, td, th), [class$="_markdown"] :where(p, li, blockquote, td, th) { font-family: ' + FONT_READING + ' !important; }',
  // 输入卡片（兼容 macOS JZLxKW_card 与跨平台通用 card）：纯白卡片（input-major token）浮于略深主区
  // 上的对比由本组阴影承担：
  // 1) 边线 1/3 加粗加深（0.5px→0.67px，stroke #A89F8E）；
  // 2) 初始即有细微外散暖晕（双层低透明暖褐扩散，替代官方中性黑柔光）；
  // 3) 聚焦（光标进入）时暖晕以快速动效（0.18s 官方 ease）大幅增强：
  //    更深边线 + 双层加大加深的暖光外散 + 陶土色 3px 光环。
  // 纯 CSS focus-within，零 JS、零轮询。
  '.JZLxKW_card:not(.JZLxKW_cardWorkspaceTrigger), [data-composer-card]:not(' + c('cardWorkspaceTrigger') + '), ' + c('card') + ':not(' + c('cardWorkspaceTrigger') + '):has(textarea) { --dsw-elevation-stroke-color: #A89F8E !important; box-shadow: 0 0 0 0.67px var(--dsw-elevation-stroke-color), 0 2px 10px 0 rgba(96, 76, 55, 0.05), 0 8px 28px 0 rgba(96, 76, 55, 0.06) !important; transition: box-shadow 0.18s var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important; }',
  '.JZLxKW_card:not(.JZLxKW_cardWorkspaceTrigger):focus-within, [data-composer-card]:not(' + c('cardWorkspaceTrigger') + '):focus-within, ' + c('card') + ':not(' + c('cardWorkspaceTrigger') + '):has(textarea):focus-within { box-shadow: 0 0 0 0.67px #978D7A, 0 4px 18px 0 rgba(180, 118, 76, 0.10), 0 12px 44px 0 rgba(180, 118, 76, 0.16), 0 0 0 3px rgba(217, 119, 87, 0.10) !important; }',
  // [cb-win-fix B/G1/G3] 输入卡跨平台锚点与 IME 缓解（2026-11-14 Windows 核查）：
  // B：0.2.2-rc.3 起编辑器为 Lexical contenteditable，卡内无 <textarea>，:has(textarea) 回退永不命中；
  //    补 [data-composer-card]（InputBar 卡片专属 data 属性，跨构建稳定）。
  // G1：输入区解除全局负字距 —— 分数字距参与 IME 预编辑宽度抖动（输入框反复长高缩回）。
  // G3：docked 输入区 52px 下限对齐 hero（.hero .input 本就 52px）——吸收 1↔2 行翻转
  //     （docked 36px 下限时 1↔2 行 = 36↔52 跳 16px，是 IME 抖动的主要视觉来源）。
  '[data-composer-card] { letter-spacing: normal; }',
  '[data-composer-card] ' + c('input') + ' { min-height: 52px; }',
  // 左右纵横双向等比例同步缩放（方案一：原生参数化 --cb-scale 引擎，跨平台免哈希全兼容）
  // ---------------------------------------------------------------------------
  // 整页布局级缩放不走 CSS zoom（弹层库 rect 视觉坐标与 style.top 布局单位
  // 错乘，结构性错位）。本组规则保留 52px 顶栏红绿灯安全区（topStrip）与
  // 56px 折叠态窄轨（collapsed/rail），仅对展开态侧栏、目录树行距、图标、
  // 设置触发器与右侧对话正文列宽进行纵横同步等比缩放（同时兼容 macOS 与 Windows 构建）：
  '.kB3qhq_root, aside' + c('root') + ', ' + c('sidebarCol') + ' ' + c('root') + ' { --dsh-sidebar-inline-padding: calc(8px * var(--cb-scale, 1)) !important; --dsh-sidebar-row-padding: calc(12px * var(--cb-scale, 1)) !important; --dsh-sidebar-label-gap: calc(6px * var(--cb-scale, 1)) !important; }',
  '.kB3qhq_root, .kB3qhq_newSession, aside' + c('root') + ', ' + c('newSession') + ', ' + c('panelRow') + ', ' + c('panelLabel') + ' { font-size: calc(14px * var(--cb-scale, 1)) !important; }',
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_logoRow, :not(' + c('collapsed') + ') > ' + c('logoRow') + ' { height: calc(60px * var(--cb-scale, 1)) !important; padding: calc(8px * var(--cb-scale, 1)) 0 calc(8px * var(--cb-scale, 1)) calc(8px * var(--cb-scale, 1)) !important; }',
  '[data-windows-titlebar] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_logoRow, [data-windows-titlebar] :not(' + c('collapsed') + ') > ' + c('logoRow') + ' { height: calc(40px * var(--cb-scale, 1)) !important; padding-top: 0 !important; padding-bottom: 0 !important; }',
  '.kB3qhq_brandName, ' + c('brandName') + ' { font-size: calc(18px * var(--cb-scale, 1)) !important; line-height: calc(24px * var(--cb-scale, 1)) !important; height: calc(24px * var(--cb-scale, 1)) !important; }',
  '.kB3qhq_fallbackBrandName, ' + c('fallbackBrandName') + ' { font-size: calc(17px * var(--cb-scale, 1)) !important; }',
  // [cb-win-fix C] 追加免 topSection 依赖分支：Windows 构建（wtg9ga）无 topSection local
  // （按钮行为 newSessionRow/footArea 命名），原两分支全死；c('root'):not(c('collapsed')) c('newSession')
  // 与 L237 暖色三态同款写法，实测命中 .wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_newSession。
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession, :not(' + c('collapsed') + ') > ' + c('topSection') + ' ' + c('newSession') + ', ' + c('root') + ':not(' + c('collapsed') + ') ' + c('newSession') + ' { height: calc(38px * var(--cb-scale, 1)) !important; padding: calc(8px * var(--cb-scale, 1)) calc(12px * var(--cb-scale, 1)) !important; line-height: calc(22px * var(--cb-scale, 1)) !important; font-size: calc(14px * var(--cb-scale, 1)) !important; }',
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelList, :not(' + c('collapsed') + ') > ' + c('panelList') + ' { gap: calc(2px * var(--cb-scale, 1)) !important; margin-bottom: calc(8px * var(--cb-scale, 1)) !important; }',
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelRow, :not(' + c('collapsed') + ') > ' + c('panelList') + ' ' + c('panelRow') + ' { min-height: calc(32px * var(--cb-scale, 1)) !important; padding-block: calc(5px * var(--cb-scale, 1)) !important; line-height: calc(22px * var(--cb-scale, 1)) !important; font-size: calc(14px * var(--cb-scale, 1)) !important; }',
  '.kB3qhq_panelUnpin, ' + c('panelUnpin') + ' { top: calc((32px * var(--cb-scale, 1) - 28px) / 2) !important; }',
  '.Kjh-qa_root:not(.Kjh-qa_rail), ' + c('scrollArea') + ' ' + c('root') + ':not(' + c('rail') + ') { --workspace-toolbar-height: calc(36px * var(--cb-scale, 1)) !important; }',
  '.Kjh-qa_sectionLabel, ' + c('sectionLabel') + ' { font-size: calc(14px * var(--cb-scale, 1)) !important; line-height: calc(20px * var(--cb-scale, 1)) !important; }',
  '.Kjh-qa_searchExpanded, ' + c('searchExpanded') + ' { height: calc(32px * var(--cb-scale, 1)) !important; }',
  '.Kjh-qa_searchInput, ' + c('searchInput') + ' { font-size: calc(13px * var(--cb-scale, 1)) !important; line-height: calc(18px * var(--cb-scale, 1)) !important; }',
  '.Kjh-qa_flatList > * + *, .Kjh-qa_searchTree > [role="treeitem"] + [role="treeitem"], .Kjh-qa_groupSection > * + *, ' + c('flatList') + ' > * + *, ' + c('searchTree') + ' > [role="treeitem"] + [role="treeitem"], ' + c('groupSection') + ' > * + * { margin-top: calc(2px * var(--cb-scale, 1)) !important; }',
  '.Kjh-qa_groupSection + .Kjh-qa_groupSection, ' + c('groupSection') + ' + ' + c('groupSection') + ' { margin-top: calc(4px * var(--cb-scale, 1)) !important; }',
  '.JoiKIa_projectRow, .JoiKIa_sessionRow, ' + c('projectRow') + ', ' + c('sessionRow') + ', [data-row-key^="workspace:"], [data-row-key^="session:"], [data-sidebar-workspace-header] { height: calc(32px * var(--cb-scale, 1)) !important; min-height: calc(32px * var(--cb-scale, 1)) !important; }',
  '.JoiKIa_title, .JoiKIa_renameInput, .JoiKIa_searchResultTitle, .JoiKIa_hoverTitle, ' + c('projectRow') + ' ' + c('title') + ', ' + c('sessionRow') + ' ' + c('title') + ', [data-row-key^="workspace:"] ' + c('title') + ', [data-row-key^="session:"] ' + c('title') + ', ' + c('renameInput') + ', ' + c('searchResultTitle') + ', ' + c('hoverTitle') + ' { font-size: calc(14px * var(--cb-scale, 1)) !important; line-height: calc(20px * var(--cb-scale, 1)) !important; }',
  '.JoiKIa_slot, ' + c('projectRow') + ' ' + c('slot') + ', ' + c('sessionRow') + ' ' + c('slot') + ', [data-row-key] ' + c('slot') + ' { width: calc(16px * var(--cb-scale, 1)) !important; height: calc(20px * var(--cb-scale, 1)) !important; }',
  // [cb-win-fix A] 全项包 :where() 降特异性至 0-0-1：原 c('slot') svg（0-1-1）盖掉官方状态图标
  // transform（工作区三角 .arrowOpen{transform:rotate(90deg)} 为 0-1-0 → 三角永远不转向，30f6b02 引入回归）；
  // :where 后官方状态类全面压回，并额外为展开态 .arrowOpen 叠加 scale(var(--cb-scale, 1)) 以同时保留旋转与等比放大。
  ':where(.JoiKIa_slot) svg, :where(.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelGlyph) svg, :where(.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSessionContent) > svg, :where(._77Pn0W_trigger:not(._77Pn0W_rail)) svg, :where(' + c('slot') + ') svg, :where(:not(' + c('collapsed') + ') ' + c('panelGlyph') + ') svg, :where(:not(' + c('collapsed') + ') ' + c('newSessionContent') + ') > svg, :where(' + c('bottomSection') + ' ' + c('trigger') + ':not(' + c('rail') + '), ' + c('settingsArea') + ' ' + c('trigger') + ':not(' + c('rail') + ')) svg { transform: scale(var(--cb-scale, 1)); transform-origin: center; }',
  '.JoiKIa_arrow.JoiKIa_arrowOpen, ' + c('arrow') + c('arrowOpen') + ' { transform: rotate(90deg) scale(var(--cb-scale, 1)); transform-origin: center; }',
  '.JoiKIa_time, ' + c('sessionRow') + ' ' + c('time') + ', [data-row-key^="session:"] ' + c('time') + ' { font-size: calc(10px * var(--cb-scale, 1)) !important; line-height: calc(16px * var(--cb-scale, 1)) !important; }',
  '.JoiKIa_meta, .JoiKIa_searchResultWorkspace, .JoiKIa_searchResultSnippet, .Kjh-qa_sessionOverflowButton, ' + c('projectRow') + ' ' + c('meta') + ', ' + c('searchResultWorkspace') + ', ' + c('searchResultSnippet') + ', ' + c('sessionOverflowButton') + ', [data-row-key^="overflow:"] { font-size: calc(12px * var(--cb-scale, 1)) !important; line-height: calc(18px * var(--cb-scale, 1)) !important; }',
  '.Kjh-qa_sessionOverflowButton, ' + c('sessionOverflowButton') + ', [data-row-key^="overflow:"] { height: calc(28px * var(--cb-scale, 1)) !important; }',
  '.JoiKIa_searchResultRow, ' + c('searchResultRow') + ' { min-height: calc(48px * var(--cb-scale, 1)) !important; padding-block: calc(4px * var(--cb-scale, 1)) !important; }',
  // [cb-win-fix D] 底部设置触发器：Windows 构建侧栏无 bottomSection local（底部区为 footArea >
  // settingsArea，触发器实为 ui-settings-general 的 AnXs9G_trigger:not(AnXs9G_rail)，官方高度本就 42px）；
  // 补 c('settingsArea') 祖先分支跨平台命中（wtg9ga_settingsArea 本构建实测存在）。
  '._77Pn0W_trigger:not(._77Pn0W_rail), ' + c('bottomSection') + ' ' + c('trigger') + ':not(' + c('rail') + '), ' + c('settingsArea') + ' ' + c('trigger') + ':not(' + c('rail') + ') { height: calc(42px * var(--cb-scale, 1)) !important; font-size: calc(14px * var(--cb-scale, 1)) !important; line-height: calc(22px * var(--cb-scale, 1)) !important; }',
  // 右侧主对话区横向内容列宽同步缩放（保留用户手动拖拽 --dsh-chat-user-width 优先级）
  '.kiGsTW_body, [data-conversation-content], ' + c('body') + ':has(> [data-conversation-content]) { --dsh-chat-content-width: var(--dsh-chat-user-width, min(calc(var(--dsh-conversation-column-width, 100vw) - 64px), clamp(calc(680px * var(--cb-scale, 1)), calc(var(--dsh-conversation-column-width, 0px) * 0.64 * var(--cb-scale, 1)), calc(920px * var(--cb-scale, 1))))) !important; }',

  // 实体层次感补齐与交互加固（Stage 1 Hover → Stage 2 Active / Latched-Open 实体状态机）
  // 模块 1：全界面按钮与下拉触发器「双阶变色」状态机（使用 :where() 消除多重 :not() 优先级膨胀）
  'button, [role="menuitem"], [role="menuitemradio"], [role="option"] { transition: background-color 0.1s ease, box-shadow 0.12s ease; }',
  'button[aria-haspopup][aria-expanded="true"]:not(:disabled), [role="button"][aria-haspopup][aria-expanded="true"]:not([aria-disabled="true"]), button:has([class$="_chevronOpen"], [class*="_chevronOpen "], [class*="_chevronOpen_"]), [class$="_trigger"][aria-expanded="true"]:not(:disabled), [class*="_trigger_"][aria-expanded="true"]:not(:disabled), button[class$="_pill"][aria-expanded="true"], button[class*="_pill_"][aria-expanded="true"], [class$="_selectorButton"][aria-expanded="true"], [class*="_selectorButton_"][aria-expanded="true"], [class$="_panelRow"][aria-expanded="true"], [class*="_panelRow_"][aria-expanded="true"], ' + c('projectRow') + c('menuOpen') + ', ' + c('sessionRow') + c('menuOpen') + ' { background-color: var(--dsw-alias-interactive-bg-active) !important; color: var(--dsw-alias-label-primary) !important; }',
  'button:not(:disabled):where(:not([class*="_primary"], [class*="_sendButton"], [class*="_add"], [class*="_newSession"], [class*="_chip"])):active, [role="menuitem"]:not(:disabled):active, [role="menuitemradio"]:not(:disabled):active, [role="option"]:not(:disabled):active, ' + c('projectRow') + ':active, ' + c('sessionRow') + ':active, ' + c('panelRow') + ':active { background-color: var(--dsw-alias-interactive-bg-active) !important; }',
  '[class$="_chip"]:not(:disabled):active, [class*="_chip_"]:not(:disabled):active { background-color: rgba(217, 119, 87, 0.24) !important; }',
  '.JZLxKW_add, ' + c('add') + ' { background-color: var(--dsw-specific-selector) !important; box-shadow: inset 0 0 0 0.5px rgba(44, 43, 41, 0.08) !important; }',
  '.JZLxKW_add:hover:not(:disabled), ' + c('add') + ':hover:not(:disabled) { background-color: #E0D8CA !important; }',
  '.JZLxKW_add:active:not(:disabled), .JZLxKW_add[aria-expanded="true"], ' + c('add') + ':active:not(:disabled), ' + c('add') + '[aria-expanded="true"] { background-color: #D2C8B8 !important; box-shadow: inset 0 1px 2px rgba(44, 43, 41, 0.12) !important; }',
  '[class*="_primary_"]:not(:disabled):active, [class$="_primary"]:not(:disabled):active, [class$="_sendButton"]:not(:disabled):active, [class*="_sendButton_"]:not(:disabled):active { background-color: #B35B3E !important; }',
  '[class*="_outline_"]:not(:disabled):active, [class$="_outline"]:not(:disabled):active, [class*="_toolbar_"]:not(:disabled):active, [class$="_toolbar"]:not(:disabled):active, [class$="_inspectButton"]:not(:disabled):active, [class*="_inspectButton_"]:not(:disabled):active { background-color: var(--dsw-alias-interactive-bg-active) !important; }',

  // 模块 2：下拉菜单与浮层卡片实体立体感（覆盖全部 [data-menu-material="translucent"]，并排除全屏设置模态框）
  '[data-menu-material="translucent"], [class*="_surface_"][role="menu"], [class*="_surface_"][role="group"], [class*="_list_"][role="menu"], .htuFrW_menu, [class$="_menu"][role="menu"], [class$="_menu"][role="group"], .mR10tW_panel, [class$="_panel"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]), [class*="_panel_"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]) { --dsw-elevation-stroke-color: #C5BCAE !important; box-shadow: 0 0 0 0.75px #C5BCAE, 0 4px 12px -2px rgba(44, 43, 41, 0.08), 0 14px 32px -4px rgba(44, 43, 41, 0.12) !important; }',
  '[class*="_surface_"] > [class*="_material_"], [class$="_surface"] > [class$="_material"] { background: #FFFFFF !important; }',
  '[class*="_list_"] [class*="_footer_"], [class$="_list"] [class$="_footer"], [class*="_list_"] [role="separator"], [class$="_list"] [role="separator"] { border-color: #E2DDD2 !important; }',

  // 模块 3：左侧边栏「新建会话」主按钮与「悬停 vs 选中 vs 按下」三态分层
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession, ' + c('root') + ':not(' + c('collapsed') + ') ' + c('newSession') + ' { background: #FAF7F2 !important; border: 0.5px solid #CFC8B8 !important; box-shadow: 0 1px 2px rgba(44, 43, 41, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7) !important; }',
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession:hover, ' + c('root') + ':not(' + c('collapsed') + ') ' + c('newSession') + ':hover { background: #EFECE4 !important; border-color: #C2B9A7 !important; }',
  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession:active, ' + c('root') + ':not(' + c('collapsed') + ') ' + c('newSession') + ':active { background: #E2DDD2 !important; box-shadow: inset 0 1px 2px rgba(44, 43, 41, 0.10) !important; }',
  '.JoiKIa_sessionRow.JoiKIa_selected, .kB3qhq_panelEntryActive, ' + c('sessionRow') + c('selected') + ', ' + c('panelEntryActive') + ', [data-row-key^="session:"][aria-selected="true"] { background-color: rgba(48, 42, 34, 0.115) !important; font-weight: 500 !important; box-shadow: inset 0 0 0 0.5px rgba(44, 43, 41, 0.07) !important; }',
  '.JoiKIa_sessionRow.JoiKIa_selected:hover, .kB3qhq_panelEntryActive:hover, ' + c('sessionRow') + c('selected') + ':hover, ' + c('panelEntryActive') + ':hover, [data-row-key^="session:"][aria-selected="true"]:hover { background-color: var(--dsw-alias-interactive-bg-active) !important; }',

  // 模块 4：Markdown 代码块、工具调用卡片与终端块实体框线
  '.md-code-block, [class*="_block_"]:has(> [class*="_bannerWrap_"]) { border: 0.5px solid var(--dsw-alias-border-l2) !important; box-shadow: 0 1px 3px rgba(44, 43, 41, 0.03) !important; }',
  '[class*="_banner_"] { border-bottom: 0.5px solid var(--dsw-alias-border-l2) !important; }',
  '[class*="_row_"][data-expandable] { border-radius: 6px; padding-inline: 4px; margin-inline: -4px; transition: background-color 0.12s ease; }',
  '[class*="_row_"][data-expandable]:hover { background-color: rgba(48, 42, 34, 0.05); }',
  '[class*="_row_"][data-expandable]:active { background-color: rgba(48, 42, 34, 0.11); }',

  // 模块 5：分段控制器滑块与用户消息气泡实体边线
  '[class*="_control_"] > [class*="_indicator_"], [class*="_tabs_"] > [class*="_indicator_"] { background: #FFFFFF !important; box-shadow: 0 0 0 0.5px #CFC8B8, 0 1px 3px rgba(44, 43, 41, 0.08) !important; }',
  '[class*="_bubble_"]:not([role="tooltip"]) { border: 0.5px solid #E2DACB !important; box-shadow: 0 1px 2px rgba(44, 43, 41, 0.03) !important; }',

  // Phase C：流式状态栏 Claude 橙色系与摆动鲸鱼大幅慢速摇摆
  // 1. 流式状态栏橙色加固
  '[data-chat-running], .tnXGgG_running, ' + c('running') + ' { --dsw-alias-label-deep-diving: #CE6846 !important; --dsw-alias-label-deep-diving-shimmer: #F4B293 !important; --dsw-alias-label-shimmer: #F4B293 !important; color: #CE6846 !important; }',

  // 2. 摆动鲸鱼：关闭 APNG 解码、解除容器裁切，以 43% 86% 为轴心施加 GPU 慢速大幅摆动
  '.tnXGgG_runningWhaleAnimated, [data-chat-running] ' + c('runningWhaleAnimated') + ' { display: none !important; mask: none !important; -webkit-mask: none !important; }',
  '.tnXGgG_runningIcon, [data-chat-running] ' + c('runningIcon') + ' { contain: layout style !important; overflow: visible !important; }',
  '.tnXGgG_runningWhaleStill, [data-chat-running] ' + c('runningWhaleStill') + ' { display: block !important; transform-origin: 43% 86% !important; will-change: transform; animation: cb-whale-slow-swing 3.2s cubic-bezier(0.42, 0, 0.58, 1) infinite !important; }',
  '[data-chat-running][data-holding] .tnXGgG_runningWhaleStill, [data-chat-running][data-holding] ' + c('runningWhaleStill') + ' { animation-play-state: paused !important; }',
  '@keyframes cb-whale-slow-swing { 0%, 100% { transform: translateY(0.3px) rotate(-22deg); } 50% { transform: translateY(-0.5px) rotate(22deg); } }',
  '@media (prefers-reduced-motion: reduce) { .tnXGgG_runningWhaleStill, [data-chat-running] ' + c('runningWhaleStill') + ' { animation: none !important; } }',

  // 3. 流式渐显引擎：已整体剥离（2026-11-14 决策放弃），无替代实现——流式出字为 DSH 原生行为。

  // Phase D：浮现卡片（HoverCard）、上拉/下拉菜单与 Tooltip 渐变出现与消失质感
  // 1. 隐藏 macOS 透明毛玻璃底衬层（避免纯白菜单缩放时边缘露出未缩放底衬）
  '[data-menu-backing] { opacity: 0 !important; pointer-events: none !important; }',

  // 2. 定义出现与消失关键帧
  '@keyframes cb-popup-enter-up { 0% { opacity: 0; transform: translateY(5px) scale(0.975); } 100% { opacity: 1; transform: translateY(0) scale(1); } }',
  '@keyframes cb-popup-enter-down { 0% { opacity: 0; transform: translateY(-4px) scale(0.975); } 100% { opacity: 1; transform: translateY(0) scale(1); } }',
  '@keyframes cb-hovercard-enter { 0% { opacity: 0; transform: translateX(-4px) translateY(2px) scale(0.98); } 100% { opacity: 1; transform: translateX(0) translateY(0) scale(1); } }',
  '@keyframes cb-popup-exit-up { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(4px) scale(0.98); } }',
  '@keyframes cb-popup-exit-down { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-3px) scale(0.98); } }',
  '@keyframes cb-hovercard-exit { 0% { opacity: 1; transform: translateX(0) translateY(0) scale(1); } 100% { opacity: 0; transform: translateX(-3px) translateY(1px) scale(0.982); } }',

  // 3. 默认下拉 / 右键 / 子菜单卡片（185ms 渐变进入）
  '[data-menu-material="translucent"]:not(.cb-exit-ghost) { --dsh-menu-enter: 185ms !important; --dsh-menu-dismiss: 145ms !important; transform-origin: center top; animation: cb-popup-enter-down 185ms cubic-bezier(0.16, 1, 0.3, 1) both !important; will-change: transform, opacity; }',

  // 4. 上拉卡片（底部权限选择、模型选择、/与@指令弹窗、用量统计等，排除全屏设置模态框）
  '[data-menu-material="translucent"][data-anchor-side="top"]:not(.cb-exit-ghost), [data-menu-material="translucent"][data-trigger-menu]:not(.cb-exit-ghost), [data-menu-material="translucent"].htuFrW_menu:not(.cb-exit-ghost), [data-menu-material="translucent"].m00Doa_card:not(.cb-exit-ghost), [data-menu-material="translucent"][class*="_sideTop"]:not(.cb-exit-ghost), .mR10tW_panel:not(.cb-exit-ghost), [class$="_panel"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]):not(.cb-exit-ghost), [class*="_panel_"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]):not(.cb-exit-ghost) { transform-origin: center bottom !important; animation: cb-popup-enter-up 185ms cubic-bezier(0.16, 1, 0.3, 1) both !important; will-change: transform, opacity; }',

  // 5. 解决 MenuSurface 原版对子元素的重复动画叠加与原生 dismiss 动画
  '[data-menu-material="translucent"][data-menu-phase="enter"] > * { animation: none !important; }',
  '[data-menu-material="translucent"][data-menu-phase="dismiss"] { animation: cb-popup-exit-down 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; pointer-events: none !important; }',
  '[data-menu-material="translucent"][data-menu-phase="dismiss"] > * { animation: none !important; }',

  // 6. 浮现预览卡片 HoverCard（对齐 PREVIEW_FADE_MS = 100ms 卸载窗口）与 Tooltip
  '[style*="--dsh-hover-preview-fade"]:not(.cb-exit-ghost), ._card_l6gf9_9:not(.cb-exit-ghost) { --dsh-hover-preview-fade: 150ms !important; transform-origin: left center; animation: cb-hovercard-enter 195ms cubic-bezier(0.16, 1, 0.3, 1) both !important; will-change: transform, opacity; }',
  '[style*="--dsh-hover-preview-fade"][data-closing], ._card_l6gf9_9[data-closing] { animation: cb-hovercard-exit 100ms cubic-bezier(0.32, 0, 0.2, 1) both !important; pointer-events: none !important; }',
  '[role="tooltip"]:not(.cb-exit-ghost) { animation-duration: 175ms !important; animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important; }',

  // 7. 离场残影容器（.cb-exit-ghost）样式
  '.cb-exit-ghost { position: fixed !important; inset: auto !important; right: auto !important; bottom: auto !important; margin: 0 !important; pointer-events: none !important; user-select: none !important; z-index: 1150 !important; will-change: transform, opacity !important; }',
  '.cb-exit-ghost[data-cb-exit-dir="up"] { transform-origin: center bottom !important; animation: cb-popup-exit-up 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; }',
  '.cb-exit-ghost[data-cb-exit-dir="down"] { transform-origin: center top !important; animation: cb-popup-exit-down 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; }',
  '.cb-exit-ghost[data-cb-exit-dir="hovercard"] { transform-origin: left center !important; animation: cb-hovercard-exit 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; }',
  '@media (prefers-reduced-motion: reduce) { [data-menu-material="translucent"], [style*="--dsh-hover-preview-fade"], ._card_l6gf9_9, .mR10tW_panel, .cb-exit-ghost { animation-duration: 0ms !important; } }'
].filter(Boolean).join('\n');

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

  // 纵横双向等比缩放联动：将字号缩放比（text / 14）映射为 body 上的 --cb-scale，
  // 并在字号变化时按同比例联动左侧边栏列宽（layout store setSidebar，受 264..420 安全夹逼保护）。
  ctx.effect(function () {
    if (typeof document === 'undefined') return;
    var BASE_TEXT_SIZE = 14;
    var DEFAULT_SIDEBAR_WIDTH = 280;

    function getTextSize(snapshot) {
      var s = snapshot && snapshot.fontSizes && snapshot.fontSizes.text;
      return typeof s === 'number' && s > 0 ? s : BASE_TEXT_SIZE;
    }

    function writeScale(textSize) {
      var scale = Number((textSize / BASE_TEXT_SIZE).toFixed(4));
      if (document.documentElement && document.documentElement.style) {
        document.documentElement.style.setProperty('--cb-scale', String(scale));
      }
      if (document.body && document.body.style) {
        document.body.style.setProperty('--cb-scale', String(scale));
      }
      return scale;
    }

    function getSlotsService(targetCtx) {
      var c = targetCtx || ctx;
      try {
        if (c && typeof c.get === 'function') {
          var s = c.get('slots', false);
          if (s) return s;
        }
        if (c && c.reflect && typeof c.reflect.get === 'function') {
          var rs = c.reflect.get('slots', false);
          if (rs) return rs;
        }
        return c && c.slots ? c.slots : null;
      } catch (_) {
        return null;
      }
    }

    function getLayoutStore(targetCtx) {
      try {
        var slots = getSlotsService(targetCtx);
        var entries = slots && typeof slots.entries === 'function' ? slots.entries('root') : null;
        var entry = entries && entries[0];
        var storeHandle = entry && (entry.store || (entry.options && entry.options.store));
        return storeHandle && typeof storeHandle.create === 'function' ? storeHandle.create() : null;
      } catch (_) {
        return null;
      }
    }

    var prevTextSize = getTextSize(ctx.theme && typeof ctx.theme.getTheme === 'function' ? ctx.theme.getTheme() : null);
    var prevScale = writeScale(prevTextSize);
    var baseSidebarWidth = DEFAULT_SIDEBAR_WIDTH;
    var lastSetSidebar = null;

    // 若启动时字号非默认 14px（例如用户配置为 17px），在 root 布局 store 就绪时按初始比例同步默认侧栏宽度
    var offSlots = null;
    var offInject = null;
    if (prevTextSize !== BASE_TEXT_SIZE) {
      var syncInitialSidebar = function (targetCtx) {
        try {
          var store = getLayoutStore(targetCtx);
          if (!store || !store.getSnapshot || !store.actions || typeof store.actions.setSidebar !== 'function') return false;
          var snap = store.getSnapshot();
          var current = snap && snap.layoutInfo && snap.layoutInfo.sidebar;
          if (current === DEFAULT_SIDEBAR_WIDTH) {
            var initTarget = Math.round(DEFAULT_SIDEBAR_WIDTH * prevScale);
            store.actions.setSidebar(initTarget);
            var afterSnap = store.getSnapshot();
            var actual = afterSnap && afterSnap.layoutInfo && afterSnap.layoutInfo.sidebar;
            lastSetSidebar = (typeof actual === 'number' && actual > 0) ? actual : initTarget;
          }
          return true;
        } catch (_) {
          return false;
        }
      };

      var attachSlotsWatcher = function (targetCtx) {
        if (syncInitialSidebar(targetCtx)) return;
        var slots = getSlotsService(targetCtx);
        if (slots && typeof slots.subscribe === 'function' && !offSlots) {
          try {
            offSlots = slots.subscribe('root', function () {
              if (syncInitialSidebar(targetCtx) && offSlots) {
                offSlots();
                offSlots = null;
              }
            });
          } catch (_) {}
        }
      };

      attachSlotsWatcher(ctx);
      if (!offSlots && typeof ctx.inject === 'function') {
        try {
          var sub = ctx.inject(['slots'], function (slotsCtx) {
            attachSlotsWatcher(slotsCtx);
          });
          if (sub && typeof sub.dispose === 'function') {
            offInject = function () { sub.dispose(); };
          } else if (typeof sub === 'function') {
            offInject = sub;
          }
        } catch (_) {}
      }
    }

    var offTheme = typeof ctx.on === 'function'
      ? ctx.on('theme/change', function (snapshot) {
          var nextTextSize = getTextSize(snapshot);
          var nextScale = writeScale(nextTextSize);
          if (nextTextSize !== prevTextSize) {
            var store = getLayoutStore(ctx);
            if (store && store.getSnapshot && store.actions && typeof store.actions.setSidebar === 'function') {
              var snap = store.getSnapshot();
              var currentSidebar = snap && snap.layoutInfo && snap.layoutInfo.sidebar;
              if (typeof currentSidebar === 'number' && currentSidebar > 0) {
                if (lastSetSidebar !== null && currentSidebar !== lastSetSidebar && prevScale > 0) {
                  baseSidebarWidth = currentSidebar / prevScale;
                } else if (lastSetSidebar === null && currentSidebar !== DEFAULT_SIDEBAR_WIDTH && prevScale > 0) {
                  baseSidebarWidth = currentSidebar / prevScale;
                }
                var targetSidebar = Math.round(baseSidebarWidth * nextScale);
                store.actions.setSidebar(targetSidebar);
                var afterSnap = store.getSnapshot();
                var actualSidebar = afterSnap && afterSnap.layoutInfo && afterSnap.layoutInfo.sidebar;
                lastSetSidebar = (typeof actualSidebar === 'number' && actualSidebar > 0) ? actualSidebar : targetSidebar;
              }
            }
            prevTextSize = nextTextSize;
            prevScale = nextScale;
          }
        })
      : null;

    return function () {
      if (offSlots) { try { offSlots(); } catch (_) {} offSlots = null; }
      if (offInject) { try { offInject(); } catch (_) {} offInject = null; }
      if (offTheme) { try { offTheme(); } catch (_) {} offTheme = null; }
      if (document.documentElement && document.documentElement.style) {
        document.documentElement.style.removeProperty('--cb-scale');
      }
      if (document.body && document.body.style) {
        document.body.style.removeProperty('--cb-scale');
      }
    };
  }, PLUGIN_ID + ': proportional scale sync');

  // （「流式渐显引擎」ctx.effect 已整体剥离（2026-11-14 决策放弃）：不安装任何观察器/动画/遮罩，流式渲染为 DSH 原生行为。）

  // 浮现卡片（HoverCard）、上拉/下拉菜单与弹窗卡片离场残影过渡（145ms 极轻量双保险自动销毁）
  ctx.effect(function () {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

    var FLOAT_SELECTOR = '[data-menu-material="translucent"]:not(.cb-exit-ghost), [style*="--dsh-hover-preview-fade"]:not(.cb-exit-ghost), ._card_l6gf9_9:not(.cb-exit-ghost), .mR10tW_panel:not(.cb-exit-ghost), [class$="_panel"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]):not(.cb-exit-ghost), [class*="_panel_"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]):not(.cb-exit-ghost)';
    var rectCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    var hasActiveCards = false;
    var hoverSnapRaf = null;
    var snapTimer1 = null;
    var snapTimer2 = null;

    function getDirection(el) {
      try {
        if (el.matches && el.matches('[style*="--dsh-hover-preview-fade"], ._card_l6gf9_9')) return 'hovercard';
        if (el.matches && el.matches('[data-anchor-side="top"], [data-trigger-menu], .htuFrW_menu, .m00Doa_card, [class*="_sideTop"], .mR10tW_panel, [class$="_panel"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal]), [class*="_panel_"][role="dialog"]:not([aria-modal="true"]):not([data-shortcut-modal])')) return 'up';
      } catch (_) {}
      return 'down';
    }

    function snapshotVisibleCards() {
      hoverSnapRaf = null;
      if (!rectCache || typeof document === 'undefined') return;
      try {
        var cards = document.querySelectorAll(FLOAT_SELECTOR);
        hasActiveCards = cards.length > 0;
        for (var i = 0; i < cards.length; i++) {
          var el = cards[i];
          var rect = el.getBoundingClientRect();
          if (rect.width > 4 && rect.height > 4) {
            rectCache.set(el, {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              dir: getDirection(el)
            });
          }
        }
      } catch (_) {}
    }

    function triggerSnapshot() {
      if (typeof requestAnimationFrame !== 'undefined' && hoverSnapRaf === null) {
        hoverSnapRaf = requestAnimationFrame(snapshotVisibleCards);
      }
      if (snapTimer1 !== null) clearTimeout(snapTimer1);
      if (snapTimer2 !== null) clearTimeout(snapTimer2);
      snapTimer1 = setTimeout(function () { snapTimer1 = null; snapshotVisibleCards(); }, 60);
      snapTimer2 = setTimeout(function () { snapTimer2 = null; snapshotVisibleCards(); }, 210);
    }

    function clearExistingGhosts(dirFilter) {
      try {
        var sel = dirFilter ? '.cb-exit-ghost[data-cb-exit-dir="' + dirFilter + '"]' : '.cb-exit-ghost';
        var old = document.querySelectorAll(sel);
        for (var i = 0; i < old.length; i++) old[i].remove();
      } catch (_) {}
    }

    function spawnGhost(target, info) {
      var ghost = target.cloneNode(true);
      sanitizeGhost(ghost, target);
      ghost.classList.add('cb-exit-ghost');
      ghost.setAttribute('data-cb-exit-dir', info.dir);
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.setProperty('left', info.left + 'px', 'important');
      ghost.style.setProperty('top', info.top + 'px', 'important');
      ghost.style.setProperty('width', info.width + 'px', 'important');
      ghost.style.setProperty('height', info.height + 'px', 'important');

      document.body.appendChild(ghost);
      ghost.addEventListener('animationend', function () {
        ghost.remove();
      }, { once: true });
      setTimeout(function () {
        if (ghost.parentNode) ghost.remove();
      }, 180);
    }

    // O(1) 活跃浮层门禁：日常无浮层时鼠标移动零 DOM 查询；pointerdown/keydown 同步快照，pointerover 单帧 rAF 节流
    function onImmediateInteraction() {
      if (!hasActiveCards) return;
      snapshotVisibleCards();
    }

    function onHoverInteraction() {
      if (!hasActiveCards || hoverSnapRaf !== null) return;
      if (typeof requestAnimationFrame !== 'undefined') {
        hoverSnapRaf = requestAnimationFrame(snapshotVisibleCards);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', onImmediateInteraction, true);
      window.addEventListener('pointerover', onHoverInteraction, true);
      window.addEventListener('keydown', onImmediateInteraction, true);
    }

    function sanitizeGhost(root, sourceRoot) {
      try {
        if (sourceRoot && sourceRoot.querySelectorAll && root.querySelectorAll) {
          var srcInputs = sourceRoot.querySelectorAll('input');
          var dstInputs = root.querySelectorAll('input');
          for (var k = 0; k < srcInputs.length && k < dstInputs.length; k++) {
            if (typeof srcInputs[k].value === 'string') {
              dstInputs[k].setAttribute('value', srcInputs[k].value);
            }
          }
        }
        root.removeAttribute('id');
        root.removeAttribute('anchor-name');
        root.removeAttribute('position-anchor');
        if (root.style) {
          root.style.removeProperty('anchor-name');
          root.style.removeProperty('position-anchor');
        }
        var descendants = root.querySelectorAll('*');
        for (var i = 0; i < descendants.length; i++) {
          var d = descendants[i];
          d.removeAttribute('id');
          d.removeAttribute('anchor-name');
          d.removeAttribute('position-anchor');
          if (d.style) {
            d.style.removeProperty('anchor-name');
            d.style.removeProperty('position-anchor');
          }
        }
      } catch (_) {}
    }

    function handleRemovedNode(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.classList && node.classList.contains('cb-exit-ghost')) return;
      if (node.hasAttribute && node.hasAttribute('data-menu-backing')) return;

      var targets = [];
      try {
        if (node.matches && node.matches(FLOAT_SELECTOR)) {
          targets.push(node);
        }
        if (node.querySelectorAll) {
          var sub = node.querySelectorAll(FLOAT_SELECTOR);
          for (var i = 0; i < sub.length; i++) targets.push(sub[i]);
        }
      } catch (_) {}

      for (var j = 0; j < targets.length; j++) {
        var target = targets[j];
        try {
          if (target.getAttribute('data-menu-phase') === 'dismiss' || target.hasAttribute('data-closing')) {
            continue;
          }
          var info = rectCache ? rectCache.get(target) : null;
          if (!info || info.width <= 4) continue;

          clearExistingGhosts(info.dir === 'hovercard' ? 'hovercard' : null);
          spawnGhost(target, info);
        } catch (_) {}
      }
    }

    var observer = new MutationObserver(function (records) {
      var hasNewCard = false;
      for (var r = 0; r < records.length; r++) {
        var rec = records[r];
        if (rec.removedNodes && rec.removedNodes.length > 0) {
          for (var rm = 0; rm < rec.removedNodes.length; rm++) {
            handleRemovedNode(rec.removedNodes[rm]);
          }
        }
        if (rec.addedNodes && rec.addedNodes.length > 0) {
          for (var a = 0; a < rec.addedNodes.length; a++) {
            var an = rec.addedNodes[a];
            if (an.nodeType === 1 && !(an.classList && an.classList.contains('cb-exit-ghost'))) {
              if ((an.matches && an.matches(FLOAT_SELECTOR)) || (an.querySelector && an.querySelector(FLOAT_SELECTOR))) {
                hasNewCard = true;
              }
            }
          }
        }
      }
      if (hasNewCard) {
        hasActiveCards = true;
        clearExistingGhosts(null);
        triggerSnapshot();
      }
    });

    try {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    } catch (_) {}

    return function () {
      if (observer) {
        try { observer.disconnect(); } catch (_) {}
      }
      if (hoverSnapRaf !== null) {
        try { cancelAnimationFrame(hoverSnapRaf); } catch (_) {}
        hoverSnapRaf = null;
      }
      if (snapTimer1 !== null) { clearTimeout(snapTimer1); snapTimer1 = null; }
      if (snapTimer2 !== null) { clearTimeout(snapTimer2); snapTimer2 = null; }
      if (typeof window !== 'undefined') {
        try {
          window.removeEventListener('pointerdown', onImmediateInteraction, true);
          window.removeEventListener('pointerover', onHoverInteraction, true);
          window.removeEventListener('keydown', onImmediateInteraction, true);
        } catch (_) {}
      }
      var remainingGhosts = document.querySelectorAll('.cb-exit-ghost');
      for (var g = 0; g < remainingGhosts.length; g++) {
        remainingGhosts[g].remove();
      }
    };
  }, PLUGIN_ID + ': floating card exit transition');
}

exports.apply = apply;
exports.inject = inject;
exports.CHUANBAN_THEME_TOKENS = TOKENS;
