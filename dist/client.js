window.__ModuleLoader__.load({
	id: "chuanban-dsh-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/*
		 * chuanban-dsh-theme - 客户端源（浏览器侧）
		 * 由 scripts/build-client.mjs 包装成 DSH lazy-CJS 模块，输出 dist/client.js。
		 * 本文件是 `factory: (require) => { ... }` 的函数体，可使用 require / module / exports。
		 *
		 * 皮肤方案（D148 Phase 1，浅度定制）：
		 * - 全部走官方通道：ctx.theme.overrideTokens token 覆盖层 + 一个 <style data-plugin> 全局微调。
		 * - 零 DOM 监听 / TreeWalker / 轮询；token 经 theme-presenter 一次性写入 body，动效性能零负担。
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

		// 全局微调（官方 token 面之外的唯一补充，保持极薄）
		var GLOBAL_CSS = [
		  '::selection { background: rgba(217, 119, 87, 0.25); }',
		  // 微负字距（-0.01em）：西文词组凝聚成致密墨块带，强化「扎实沉稳」质感（对中文影响轻微）
		  // 同时在 body 声明默认 --cb-scale: 1 作为参数化等比缩放基数
		  'body { --cb-scale: 1; -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }',
		  // darwin 平台特化层中和：桌面端 CSS 对侧栏列叠了 wash 渐变（#8f89b8 紫灰 /
		  // #7a9bf0 蓝，0.2.2 起改由 sidebar-wash-*/sidebar-tint token 驱动，token 已置
		  // transparent）+ 本规则 !important 双保险覆盖回暖纸目标色；sidebarCol 为 CSS
		  // Modules local 名后缀（hash 前缀构建间变化，local 名稳定——0.2.2-rc.3 实测仍命中），
		  // 官方改名时本规则失效、无害回落平台层。
		  '[data-platform="darwin"] [class$="_sidebarCol"] { background: #F1EEE7 !important; }',
		  // 正文阅读层：Anthropic Serif 西文 + 苹方中文（对齐 Claude Desktop 原生观感）。
		  // 锚点为桌面端 app.asar 提取的 CSS Modules 确切 class（0.2.2-rc.3：XNZzAa =
		  // AssistantMarkdown，ui-chat 插件运行时 CSS）；DSH 再升级后 hash 变化则规则失配，
		  // 正文无害回落 UI 层字体栈（Anthropic Sans + 苹方）。
		  '.XNZzAa_root, .XNZzAa_body { font-family: ' + FONT_READING + ' !important; }',
		  // 输入卡片（asar 锚点 0.2.2-rc.3：JZLxKW_card，ui-conversation，排除
		  // cardWorkspaceTrigger 虚线选区态）：纯白卡片（input-major token）浮于略深主区
		  // 上的对比由本组阴影承担：
		  // 1) 边线 1/3 加粗加深（0.5px→0.67px，stroke #A89F8E）；
		  // 2) 初始即有细微外散暖晕（双层低透明暖褐扩散，替代官方中性黑柔光）；
		  // 3) 聚焦（光标进入）时暖晕以快速动效（0.18s 官方 ease）大幅增强：
		  //    更深边线 + 双层加大加深的暖光外散 + 陶土色 3px 光环。
		  // 纯 CSS focus-within，零 JS、零轮询。
		  '.JZLxKW_card:not(.JZLxKW_cardWorkspaceTrigger) { --dsw-elevation-stroke-color: #A89F8E !important; box-shadow: 0 0 0 0.67px var(--dsw-elevation-stroke-color), 0 2px 10px 0 rgba(96, 76, 55, 0.05), 0 8px 28px 0 rgba(96, 76, 55, 0.06) !important; transition: box-shadow 0.18s var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important; }',
		  '.JZLxKW_card:not(.JZLxKW_cardWorkspaceTrigger):focus-within { box-shadow: 0 0 0 0.67px #978D7A, 0 4px 18px 0 rgba(180, 118, 76, 0.10), 0 12px 44px 0 rgba(180, 118, 76, 0.16), 0 0 0 3px rgba(217, 119, 87, 0.10) !important; }',
		  // 左右纵横双向等比例同步缩放（方案一：原生参数化 --cb-scale 引擎）
		  // ---------------------------------------------------------------------------
		  // 整页布局级缩放不走 CSS zoom（弹层库 rect 视觉坐标与 style.top 布局单位
		  // 错乘，结构性错位）。本组规则保留 52px 顶栏红绿灯安全区（topStrip）与
		  // 56px 折叠态窄轨（collapsed/rail），仅对展开态侧栏、目录树行距、图标、
		  // 设置触发器与右侧对话正文列宽进行纵横同步等比缩放（锚点：DSH 0.2.2-rc.3）：
		  '.kB3qhq_root { --dsh-sidebar-inline-padding: calc(8px * var(--cb-scale, 1)) !important; --dsh-sidebar-row-padding: calc(12px * var(--cb-scale, 1)) !important; --dsh-sidebar-label-gap: calc(6px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_root, .kB3qhq_newSession { font-size: calc(14px + var(--dsh-content-font-delta, 0px)) !important; }',
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_logoRow { height: calc(60px * var(--cb-scale, 1)) !important; padding: calc(8px * var(--cb-scale, 1)) 0 calc(8px * var(--cb-scale, 1)) calc(8px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_brandName { font-size: calc(18px * var(--cb-scale, 1)) !important; line-height: calc(24px * var(--cb-scale, 1)) !important; height: calc(24px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_fallbackBrandName { font-size: calc(17px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession { height: calc(38px * var(--cb-scale, 1)) !important; padding: calc(8px * var(--cb-scale, 1)) calc(12px * var(--cb-scale, 1)) !important; line-height: calc(22px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelList { gap: calc(2px * var(--cb-scale, 1)) !important; margin-bottom: calc(8px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelRow { min-height: calc(32px * var(--cb-scale, 1)) !important; padding-block: calc(5px * var(--cb-scale, 1)) !important; line-height: calc(22px * var(--cb-scale, 1)) !important; }',
		  '.kB3qhq_panelUnpin { top: calc((32px * var(--cb-scale, 1) - 28px) / 2) !important; }',
		  '.Kjh-qa_root:not(.Kjh-qa_rail) { --workspace-toolbar-height: calc(36px * var(--cb-scale, 1)) !important; }',
		  '.Kjh-qa_sectionLabel { font-size: calc(14px + var(--dsh-content-font-delta, 0px)) !important; line-height: calc(20px * var(--cb-scale, 1)) !important; }',
		  '.Kjh-qa_searchExpanded { height: calc(32px * var(--cb-scale, 1)) !important; }',
		  '.Kjh-qa_searchInput { font-size: calc(13px * var(--cb-scale, 1)) !important; line-height: calc(18px * var(--cb-scale, 1)) !important; }',
		  '.Kjh-qa_flatList > * + *, .Kjh-qa_searchTree > [role="treeitem"] + [role="treeitem"], .Kjh-qa_groupSection > * + * { margin-top: calc(2px * var(--cb-scale, 1)) !important; }',
		  '.Kjh-qa_groupSection + .Kjh-qa_groupSection { margin-top: calc(4px * var(--cb-scale, 1)) !important; }',
		  '.JoiKIa_projectRow, .JoiKIa_sessionRow { height: calc(32px * var(--cb-scale, 1)) !important; }',
		  '.JoiKIa_title, .JoiKIa_renameInput, .JoiKIa_searchResultTitle, .JoiKIa_hoverTitle { font-size: calc(14px + var(--dsh-content-font-delta, 0px)) !important; line-height: calc(20px * var(--cb-scale, 1)) !important; }',
		  '.JoiKIa_slot { width: calc(16px * var(--cb-scale, 1)) !important; height: calc(20px * var(--cb-scale, 1)) !important; }',
		  '.JoiKIa_slot svg, .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelGlyph svg, .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSessionContent > svg, ._77Pn0W_trigger:not(._77Pn0W_rail) svg { transform: scale(var(--cb-scale, 1)); transform-origin: center; }',
		  '.JoiKIa_time { font-size: calc(10px * var(--cb-scale, 1)) !important; line-height: calc(16px * var(--cb-scale, 1)) !important; }',
		  '.JoiKIa_meta, .JoiKIa_searchResultWorkspace, .JoiKIa_searchResultSnippet, .Kjh-qa_sessionOverflowButton { font-size: calc(12px * var(--cb-scale, 1)) !important; line-height: calc(18px * var(--cb-scale, 1)) !important; }',
		  '.Kjh-qa_sessionOverflowButton { height: calc(28px * var(--cb-scale, 1)) !important; }',
		  '.JoiKIa_searchResultRow { min-height: calc(48px * var(--cb-scale, 1)) !important; padding-block: calc(4px * var(--cb-scale, 1)) !important; }',
		  '._77Pn0W_trigger:not(._77Pn0W_rail) { height: calc(42px * var(--cb-scale, 1)) !important; font-size: calc(14px + var(--dsh-content-font-delta, 0px)) !important; line-height: calc(22px * var(--cb-scale, 1)) !important; }',
		  // 右侧主对话区横向内容列宽同步缩放（保留用户手动拖拽 --dsh-chat-user-width 优先级）
		  '.kiGsTW_body { --dsh-chat-content-width: var(--dsh-chat-user-width, min(calc(var(--dsh-conversation-column-width, 100vw) - 64px), clamp(calc(680px * var(--cb-scale, 1)), calc(var(--dsh-conversation-column-width, 0px) * 0.64 * var(--cb-scale, 1)), calc(920px * var(--cb-scale, 1))))) !important; }',

		  // 实体层次感补齐与交互加固（Stage 1 Hover → Stage 2 Active / Latched-Open 实体状态机）
		  // 模块 1：全界面按钮与下拉触发器「双阶变色」状态机
		  'button, [role="menuitem"], [role="menuitemradio"], [role="option"] { transition: background-color 0.1s ease, box-shadow 0.12s ease; }',
		  'button[aria-haspopup][aria-expanded="true"]:not(:disabled), [role="button"][aria-haspopup][aria-expanded="true"]:not([aria-disabled="true"]), button:has([class$="_chevronOpen"], [class*="_chevronOpen "]), [class$="_trigger"][aria-expanded="true"]:not(:disabled), [class*="_trigger_"][aria-expanded="true"]:not(:disabled), button[class$="_pill"][aria-expanded="true"], [class$="_selectorButton"][aria-expanded="true"], [class$="_panelRow"][aria-expanded="true"], [class$="_projectRow"][class*="_menuOpen"], [class$="_sessionRow"][class*="_menuOpen"] { background-color: var(--dsw-alias-interactive-bg-active) !important; color: var(--dsw-alias-label-primary) !important; }',
		  'button:not(:disabled):not([class*="_primary_"]):not([class$="_primary"]):not([class$="_sendButton"]):not([class$="_add"]):not([class*="_add_"]):not([class$="_newSession"]):not([class*="_newSession_"]):not([class$="_chip"]):not([class*="_chip_"]):active, [role="menuitem"]:not(:disabled):active, [role="menuitemradio"]:not(:disabled):active, [role="option"]:not(:disabled):active, [class$="_projectRow"]:active, [class$="_sessionRow"]:active, [class$="_panelRow"]:active { background-color: var(--dsw-alias-interactive-bg-active) !important; }',
		  '[class$="_chip"]:not(:disabled):active, [class*="_chip_"]:not(:disabled):active { background-color: rgba(217, 119, 87, 0.24) !important; }',
		  '.JZLxKW_add, [class$="_add"] { background-color: var(--dsw-specific-selector) !important; box-shadow: inset 0 0 0 0.5px rgba(44, 43, 41, 0.08) !important; }',
		  '.JZLxKW_add:hover:not(:disabled), [class$="_add"]:hover:not(:disabled) { background-color: #E0D8CA !important; }',
		  '.JZLxKW_add:active:not(:disabled), .JZLxKW_add[aria-expanded="true"], [class$="_add"]:active:not(:disabled), [class$="_add"][aria-expanded="true"] { background-color: #D2C8B8 !important; box-shadow: inset 0 1px 2px rgba(44, 43, 41, 0.12) !important; }',
		  '[class*="_primary_"]:not(:disabled):active, [class$="_primary"]:not(:disabled):active, [class$="_sendButton"]:not(:disabled):active { background-color: #B35B3E !important; }',
		  '[class*="_outline_"]:not(:disabled):active, [class$="_outline"]:not(:disabled):active, [class*="_toolbar_"]:not(:disabled):active, [class$="_toolbar"]:not(:disabled):active, [class$="_inspectButton"]:not(:disabled):active { background-color: var(--dsw-alias-interactive-bg-active) !important; }',

		  // 模块 2：下拉菜单与浮层卡片实体立体感
		  '[class*="_surface_"][role="menu"], [class*="_surface_"][role="group"], [class*="_list_"][role="menu"], .htuFrW_menu, [class$="_menu"][role="menu"], [class$="_menu"][role="group"], [class*="_panel_"][role="dialog"] { --dsw-elevation-stroke-color: #C5BCAE !important; box-shadow: 0 0 0 0.75px #C5BCAE, 0 4px 12px -2px rgba(44, 43, 41, 0.08), 0 14px 32px -4px rgba(44, 43, 41, 0.12) !important; }',
		  '[class*="_surface_"] > [class*="_material_"], [class$="_surface"] > [class$="_material"] { background: #FFFFFF !important; }',
		  '[class*="_list_"] [class*="_footer_"], [class$="_list"] [class$="_footer"], [class*="_list_"] [role="separator"], [class$="_list"] [role="separator"] { border-color: #E2DDD2 !important; }',

		  // 模块 3：左侧边栏「新建会话」主按钮与「悬停 vs 选中 vs 按下」三态分层
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession, [class$="_root"]:not([class*="_collapsed"]) [class$="_newSession"] { background: #FAF7F2 !important; border: 0.5px solid #CFC8B8 !important; box-shadow: 0 1px 2px rgba(44, 43, 41, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7) !important; }',
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession:hover, [class$="_root"]:not([class*="_collapsed"]) [class$="_newSession"]:hover { background: #EFECE4 !important; border-color: #C2B9A7 !important; }',
		  '.kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession:active, [class$="_root"]:not([class*="_collapsed"]) [class$="_newSession"]:active { background: #E2DDD2 !important; box-shadow: inset 0 1px 2px rgba(44, 43, 41, 0.10) !important; }',
		  '.JoiKIa_sessionRow.JoiKIa_selected, .kB3qhq_panelEntryActive, [class$="_sessionRow"][class*="_selected"] { background-color: rgba(48, 42, 34, 0.115) !important; font-weight: 500 !important; box-shadow: inset 0 0 0 0.5px rgba(44, 43, 41, 0.07) !important; }',
		  '.JoiKIa_sessionRow.JoiKIa_selected:hover, .kB3qhq_panelEntryActive:hover, [class$="_sessionRow"][class*="_selected"]:hover { background-color: var(--dsw-alias-interactive-bg-active) !important; }',

		  // 模块 4：Markdown 代码块、工具调用卡片与终端块实体框线
		  '.md-code-block, [class*="_block_"]:has(> [class*="_bannerWrap_"]) { border: 0.5px solid var(--dsw-alias-border-l2) !important; box-shadow: 0 1px 3px rgba(44, 43, 41, 0.03) !important; }',
		  '[class*="_banner_"] { border-bottom: 0.5px solid var(--dsw-alias-border-l2) !important; }',
		  '[class*="_row_"][data-expandable] { border-radius: 6px; padding-inline: 4px; margin-inline: -4px; transition: background-color 0.12s ease; }',
		  '[class*="_row_"][data-expandable]:hover { background-color: rgba(48, 42, 34, 0.05); }',
		  '[class*="_row_"][data-expandable]:active { background-color: rgba(48, 42, 34, 0.11); }',

		  // 模块 5：分段控制器滑块与用户消息气泡实体边线
		  '[class*="_control_"] > [class*="_indicator_"], [class*="_tabs_"] > [class*="_indicator_"] { background: #FFFFFF !important; box-shadow: 0 0 0 0.5px #CFC8B8, 0 1px 3px rgba(44, 43, 41, 0.08) !important; }',
		  '[class*="_bubble_"]:not([role="tooltip"]) { border: 0.5px solid #E2DACB !important; box-shadow: 0 1px 2px rgba(44, 43, 41, 0.03) !important; }',

		  // Phase C：流式状态栏 Claude 橙色系、摆动鲸鱼大幅慢速摇摆与流式渐变浮现
		  // 1. 流式状态栏橙色加固
		  '[data-chat-running], .tnXGgG_running, [class$="_running"] { --dsw-alias-label-deep-diving: #CE6846 !important; --dsw-alias-label-deep-diving-shimmer: #F4B293 !important; --dsw-alias-label-shimmer: #F4B293 !important; color: #CE6846 !important; }',

		  // 2. 摆动鲸鱼：关闭 APNG 解码、解除容器裁切，以 43% 86% 为轴心施加 GPU 慢速大幅摆动
		  '.tnXGgG_runningWhaleAnimated, [data-chat-running] [class$="_runningWhaleAnimated"] { display: none !important; mask: none !important; -webkit-mask: none !important; }',
		  '.tnXGgG_runningIcon, [data-chat-running] [class$="_runningIcon"] { contain: layout style !important; overflow: visible !important; }',
		  '.tnXGgG_runningWhaleStill, [data-chat-running] [class$="_runningWhaleStill"] { display: block !important; transform-origin: 43% 86% !important; will-change: transform; animation: cb-whale-slow-swing 3.2s cubic-bezier(0.42, 0, 0.58, 1) infinite !important; }',
		  '[data-chat-running][data-holding] .tnXGgG_runningWhaleStill, [data-chat-running][data-holding] [class$="_runningWhaleStill"] { animation-play-state: paused !important; }',
		  '@keyframes cb-whale-slow-swing { 0%, 100% { transform: translateY(0.3px) rotate(-22deg); } 50% { transform: translateY(-0.5px) rotate(22deg); } }',
		  '@media (prefers-reduced-motion: reduce) { .tnXGgG_runningWhaleStill, [data-chat-running] [class$="_runningWhaleStill"] { animation: none !important; } }',

		  // 3. 流式出字渐变浮现双模规则（CSS @property + 逐行新行入场关键帧 + 双层遮罩羽化）
		  '@property --cb-reveal-x { syntax: \'<length>\'; inherits: false; initial-value: 2000px; }',
		  '@property --cb-line-alpha { syntax: \'<number>\'; inherits: false; initial-value: 1; }',
		  '@keyframes cb-stream-line-emerge { 0% { opacity: 0; transform: translateY(2.5px); } 100% { opacity: 1; transform: translateY(0); } }',
		  '[data-streaming] :is([class*="_markdown_"], [class$="_markdown"]) :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr, hr, [class*="_fenceSeat_"], [class$="_fenceSeat"], [class*="_tableScroll_"], [class$="_tableScroll"]), [data-variant="think"][data-state="running"] :is([class*="_markdown_"], [class$="_markdown"]) :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr), [data-streaming] pre .line { animation: cb-stream-line-emerge 0.24s cubic-bezier(0.22, 1, 0.36, 1) both; }',
		  '[data-cb-stream-tail="horizontal"] { -webkit-mask-image: linear-gradient(180deg, #000 0px, #000 calc(100% - var(--cb-line-h, 28px)), transparent calc(100% - var(--cb-line-h, 28px))), linear-gradient(90deg, #000 0px, #000 calc(var(--cb-reveal-x, 2000px) - 72px), rgba(0, 0, 0, 0.45) calc(var(--cb-reveal-x, 2000px) - 28px), transparent var(--cb-reveal-x, 2000px)); mask-image: linear-gradient(180deg, #000 0px, #000 calc(100% - var(--cb-line-h, 28px)), transparent calc(100% - var(--cb-line-h, 28px))), linear-gradient(90deg, #000 0px, #000 calc(var(--cb-reveal-x, 2000px) - 72px), rgba(0, 0, 0, 0.45) calc(var(--cb-reveal-x, 2000px) - 28px), transparent var(--cb-reveal-x, 2000px)); -webkit-mask-size: 100% 100%, 100% var(--cb-line-h, 28px); mask-size: 100% 100%, 100% var(--cb-line-h, 28px); -webkit-mask-position: 0 0, 0 100%; mask-position: 0 0, 0 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; transition: --cb-reveal-x 0.21s cubic-bezier(0.22, 1, 0.36, 1); }',
		  '[data-cb-stream-tail="line"] { -webkit-mask-image: linear-gradient(180deg, #000 0px, #000 calc(100% - var(--cb-line-h, 28px)), rgba(0, 0, 0, var(--cb-line-alpha, 1)) calc(100% - var(--cb-line-h, 28px) * 0.45), rgba(0, 0, 0, var(--cb-line-alpha, 1)) 100%); mask-image: linear-gradient(180deg, #000 0px, #000 calc(100% - var(--cb-line-h, 28px)), rgba(0, 0, 0, var(--cb-line-alpha, 1)) calc(100% - var(--cb-line-h, 28px) * 0.45), rgba(0, 0, 0, var(--cb-line-alpha, 1)) 100%); transition: --cb-line-alpha 0.24s cubic-bezier(0.22, 1, 0.36, 1); }',

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

		  // 4. 上拉卡片（底部权限选择、模型选择、指令弹窗、用量统计等）
		  '[data-menu-material="translucent"][data-anchor-side="top"]:not(.cb-exit-ghost), [data-menu-material="translucent"].htuFrW_menu:not(.cb-exit-ghost), [data-menu-material="translucent"].m00Doa_card:not(.cb-exit-ghost), [data-menu-material="translucent"][class*="_sideTop"]:not(.cb-exit-ghost), .mR10tW_panel:not(.cb-exit-ghost), [class$="_panel"][role="dialog"]:not(.cb-exit-ghost) { transform-origin: center bottom !important; animation: cb-popup-enter-up 185ms cubic-bezier(0.16, 1, 0.3, 1) both !important; will-change: transform, opacity; }',

		  // 5. 解决 MenuSurface 原版对子元素的重复动画叠加与原生 dismiss 动画
		  '[data-menu-material="translucent"][data-menu-phase="enter"] > * { animation: none !important; }',
		  '[data-menu-material="translucent"][data-menu-phase="dismiss"] { animation: cb-popup-exit-down 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; pointer-events: none !important; }',
		  '[data-menu-material="translucent"][data-menu-phase="dismiss"] > * { animation: none !important; }',

		  // 6. 浮现预览卡片 HoverCard 与 Tooltip
		  '[style*="--dsh-hover-preview-fade"]:not(.cb-exit-ghost), ._card_l6gf9_9:not(.cb-exit-ghost) { --dsh-hover-preview-fade: 150ms !important; transform-origin: left center; animation: cb-hovercard-enter 195ms cubic-bezier(0.16, 1, 0.3, 1) both !important; will-change: transform, opacity; }',
		  '[style*="--dsh-hover-preview-fade"][data-closing], ._card_l6gf9_9[data-closing] { animation: cb-hovercard-exit 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; pointer-events: none !important; }',
		  '[role="tooltip"]:not(.cb-exit-ghost) { animation-duration: 175ms !important; animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important; }',

		  // 7. 离场残影容器（.cb-exit-ghost）样式
		  '.cb-exit-ghost { position: fixed !important; inset: auto !important; right: auto !important; bottom: auto !important; margin: 0 !important; pointer-events: none !important; user-select: none !important; z-index: 1150 !important; will-change: transform, opacity !important; }',
		  '.cb-exit-ghost[data-cb-exit-dir="up"] { transform-origin: center bottom !important; animation: cb-popup-exit-up 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; }',
		  '.cb-exit-ghost[data-cb-exit-dir="down"] { transform-origin: center top !important; animation: cb-popup-exit-down 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; }',
		  '.cb-exit-ghost[data-cb-exit-dir="hovercard"] { transform-origin: left center !important; animation: cb-hovercard-exit 145ms cubic-bezier(0.32, 0, 0.2, 1) both !important; }',
		  '@media (prefers-reduced-motion: reduce) { [data-menu-material="translucent"], [style*="--dsh-hover-preview-fade"], ._card_l6gf9_9, .mR10tW_panel, .cb-exit-ghost { animation-duration: 0ms !important; } }'
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
		      document.body.style.setProperty('--cb-scale', String(scale));
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
		    var initialScale = writeScale(prevTextSize);

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
		            store.actions.setSidebar(Math.round(DEFAULT_SIDEBAR_WIDTH * initialScale));
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
		          writeScale(nextTextSize);
		          if (nextTextSize !== prevTextSize) {
		            var ratio = nextTextSize / prevTextSize;
		            prevTextSize = nextTextSize;
		            var store = getLayoutStore(ctx);
		            if (store && store.getSnapshot && store.actions && typeof store.actions.setSidebar === 'function') {
		              var snap = store.getSnapshot();
		              var currentSidebar = snap && snap.layoutInfo && snap.layoutInfo.sidebar;
		              if (typeof currentSidebar === 'number' && currentSidebar > 0) {
		                store.actions.setSidebar(Math.round(currentSidebar * ratio));
		              }
		            }
		          }
		        })
		      : null;

		    return function () {
		      if (offSlots) { try { offSlots(); } catch (_) {} offSlots = null; }
		      if (offInject) { try { offInject(); } catch (_) {} offInject = null; }
		      if (offTheme) { try { offTheme(); } catch (_) {} offTheme = null; }
		      document.body.style.removeProperty('--cb-scale');
		    };
		  }, PLUGIN_ID + ': proportional scale sync');

		  // 流式出字双模渐变浮现（慢速左右推进 / 快速逐行浮现，纯 CSS @property + 零节点篡改 rAF 节流）
		  ctx.effect(function () {
		    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

		    var rafId = null;
		    var settleTimer = null;
		    var activeBlock = null;
		    var prevBlock = null;
		    var prevTextLen = 0;
		    var prevHeight = 0;
		    var prevLineTop = 0;
		    var prevTargetX = 0;

		    function cleanupBlock(el) {
		      if (!el) return;
		      try {
		        el.removeAttribute('data-cb-stream-tail');
		        el.style.removeProperty('--cb-reveal-x');
		        el.style.removeProperty('--cb-line-alpha');
		        el.style.removeProperty('--cb-line-h');
		        el.style.removeProperty('transition');
		      } catch (_) {}
		    }

		    function onFrame() {
		      rafId = null;
		      var containers = document.querySelectorAll('[data-streaming], [data-variant="think"][data-state="running"]');
		      if (!containers || containers.length === 0) {
		        if (activeBlock) {
		          cleanupBlock(activeBlock);
		          activeBlock = null;
		          prevBlock = null;
		        }
		        return;
		      }

		      var lastContainer = containers[containers.length - 1];
		      var mdRoots = lastContainer.querySelectorAll('[class*="_markdown_"], [class$="_markdown"]');
		      var mdRoot = mdRoots.length > 0 ? mdRoots[mdRoots.length - 1] : lastContainer;

		      var candidateBlocks = mdRoot.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
		      if (!candidateBlocks || candidateBlocks.length === 0) return;

		      var tailBlock = candidateBlocks[candidateBlocks.length - 1];
		      if (tailBlock.matches && tailBlock.matches('li')) {
		        var sub = tailBlock.querySelectorAll('p, li');
		        if (sub.length > 0) tailBlock = sub[sub.length - 1];
		      }

		      var textContent = tailBlock.textContent || '';
		      var textLen = textContent.length;
		      if (textLen === 0) return;

		      // 若尾块未变且字符数未增加（例如仅底部秒表跳字或悬停交互触发 DOM 变更），零开销跳过
		      if (prevBlock === tailBlock && textLen === prevTextLen) return;

		      if (activeBlock && activeBlock !== tailBlock) {
		        cleanupBlock(activeBlock);
		      }
		      activeBlock = tailBlock;

		      try {
		        var range = document.createRange();
		        range.selectNodeContents(tailBlock);
		        range.collapse(false);
		        var caretRects = range.getClientRects();
		        var caretRect = caretRects && caretRects.length > 0 ? caretRects[caretRects.length - 1] : range.getBoundingClientRect();
		        var blockRect = tailBlock.getBoundingClientRect();
		        var caretRight = (caretRect && typeof caretRect.right === 'number') ? caretRect.right : (blockRect ? blockRect.right : 0);
		        var caretTop = (caretRect && typeof caretRect.top === 'number') ? caretRect.top : (blockRect ? blockRect.top : 0);
		        var targetX = Math.max(24, Math.round(caretRight - (blockRect ? blockRect.left : 0)));

		        var deltaChars = (prevBlock === tailBlock) ? (textLen - prevTextLen) : textLen;
		        var lineWrapped = (prevBlock === tailBlock) && (blockRect.height - prevHeight > 10 || Math.abs(caretTop - prevLineTop) > 8);

		        if (lineWrapped || deltaChars >= 18 || (prevBlock !== tailBlock && blockRect.height > 34)) {
		          // 快速流式或刚折行：一行一行渐变浮现
		          var lineH = Math.max(24, Math.min(88, (prevBlock === tailBlock && blockRect.height > prevHeight) ? (blockRect.height - prevHeight) : 28));
		          tailBlock.setAttribute('data-cb-stream-tail', 'line');
		          tailBlock.style.setProperty('--cb-line-h', lineH + 'px');
		          tailBlock.style.transition = 'none';
		          tailBlock.style.setProperty('--cb-line-alpha', '0.06');
		          void tailBlock.offsetWidth;
		          tailBlock.style.transition = '';
		          tailBlock.style.setProperty('--cb-line-alpha', '1');
		          prevTargetX = targetX;
		        } else if (!lineWrapped && deltaChars > 0) {
		          // 慢速/常速同行推进：左右渐变推进
		          tailBlock.setAttribute('data-cb-stream-tail', 'horizontal');
		          tailBlock.style.setProperty('--cb-line-h', '28px');
		          var basePrevX = (prevBlock === tailBlock && prevTargetX < targetX) ? prevTargetX : 0;
		          var startX = Math.max(16, basePrevX + 18);
		          tailBlock.style.transition = 'none';
		          tailBlock.style.setProperty('--cb-reveal-x', startX + 'px');
		          void tailBlock.offsetWidth;
		          tailBlock.style.transition = '';
		          tailBlock.style.setProperty('--cb-reveal-x', (targetX + 76) + 'px');
		          prevTargetX = targetX;
		        }

		        prevBlock = tailBlock;
		        prevTextLen = textLen;
		        prevHeight = blockRect ? blockRect.height : 0;
		        prevLineTop = caretTop;
		      } catch (_) {}

		      if (settleTimer) clearTimeout(settleTimer);
		      settleTimer = setTimeout(function () {
		        if (activeBlock) {
		          cleanupBlock(activeBlock);
		          activeBlock = null;
		        }
		      }, 280);
		    }

		    function scheduleFrame() {
		      if (rafId !== null) return;
		      rafId = requestAnimationFrame(onFrame);
		    }

		    var observer = new MutationObserver(function () {
		      scheduleFrame();
		    });

		    try {
		      if (document.body) {
		        observer.observe(document.body, {
		          childList: true,
		          subtree: true,
		          characterData: true,
		          attributes: true,
		          attributeFilter: ['data-streaming', 'data-state']
		        });
		      }
		    } catch (_) {}

		    return function () {
		      if (observer) {
		        try { observer.disconnect(); } catch (_) {}
		      }
		      if (rafId !== null) {
		        try { cancelAnimationFrame(rafId); } catch (_) {}
		        rafId = null;
		      }
		      if (settleTimer) {
		        try { clearTimeout(settleTimer); } catch (_) {}
		        settleTimer = null;
		      }
		      if (activeBlock) {
		        cleanupBlock(activeBlock);
		        activeBlock = null;
		      }
		      prevBlock = null;
		    };
		  }, PLUGIN_ID + ': streaming gradient reveal');

		  // 浮现卡片（HoverCard）、上拉/下拉菜单与弹窗卡片离场残影过渡（145ms 极轻量双保险自动销毁）
		  ctx.effect(function () {
		    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

		    var FLOAT_SELECTOR = '[data-menu-material="translucent"]:not(.cb-exit-ghost), [style*="--dsh-hover-preview-fade"]:not(.cb-exit-ghost), ._card_l6gf9_9:not(.cb-exit-ghost), .mR10tW_panel:not(.cb-exit-ghost), [class$="_panel"][role="dialog"]:not(.cb-exit-ghost)';
		    var rectCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

		    function getDirection(el) {
		      try {
		        if (el.matches && el.matches('[style*="--dsh-hover-preview-fade"], ._card_l6gf9_9')) return 'hovercard';
		        if (el.matches && el.matches('[data-anchor-side="top"], .htuFrW_menu, .m00Doa_card, [class*="_sideTop"], .mR10tW_panel, [class$="_panel"][role="dialog"]')) return 'up';
		      } catch (_) {}
		      return 'down';
		    }

		    function snapshotVisibleCards() {
		      if (!rectCache || typeof document === 'undefined') return;
		      try {
		        var cards = document.querySelectorAll(FLOAT_SELECTOR);
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
		      if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(snapshotVisibleCards);
		      setTimeout(snapshotVisibleCards, 60);
		      setTimeout(snapshotVisibleCards, 210);
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
		      sanitizeGhost(ghost);
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

		    function onPassiveInteraction() {
		      try {
		        if (!document.querySelector(FLOAT_SELECTOR)) return;
		        snapshotVisibleCards();
		      } catch (_) {}
		    }

		    if (typeof window !== 'undefined') {
		      window.addEventListener('pointerdown', onPassiveInteraction, true);
		      window.addEventListener('pointerover', onPassiveInteraction, true);
		      window.addEventListener('keydown', onPassiveInteraction, true);
		    }

		    function sanitizeGhost(root) {
		      try {
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
		        clearExistingGhosts('hovercard');
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
		      if (typeof window !== 'undefined') {
		        try {
		          window.removeEventListener('pointerdown', onPassiveInteraction, true);
		          window.removeEventListener('pointerover', onPassiveInteraction, true);
		          window.removeEventListener('keydown', onPassiveInteraction, true);
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

		return module.exports;
	}
});
