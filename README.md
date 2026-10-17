# chuanban-dsh-theme

DSH（DeepSeek Harness）暖纸外观皮肤插件 —— D143 `absoulutely-chuanban` 预设（Claude Desktop 暖白纸配色 + 更纱黑体）的 DSH 原生插件版，[D148](../../../issue/issue-D148-dsh-chuanban-theme-skin.md) Phase 1。

## 安装

```sh
dsh plugin --profile web add https://github.com/Anarcadia/chuanban-dsh-theme/releases/latest/download/chuanban-dsh-theme.tgz
```

- 未安装 dsh CLI：把上面的 `dsh` 换成 `npx @deepseek-ai/dsh`
- DSH Desktop 用户：设置 → 插件 → 安装框直接贴 URL

装完即生效；想换回官方原皮，在插件页关闭本插件行即可（热生效，无需重启）。

## 皮肤内容（浅度定制，零动效性能负担）

- **暖纸配色**：主背景 `#FBF9F5`、正文 `#2C2B29`、强调陶土 `#D97757`、牛皮纸侧栏 `#F1E8DC`（选中态 `#E6DCCE`），约 60 个 `--dsw-*` token 全覆盖（背景/边框/文字/品牌/按钮/交互/markdown/滚动条/侧栏/气泡/菜单/设置卡）。
- **字体两层**：UI 层 `Sarasa UI SC`（`--dsw-font-family`）、代码/终端层 `Sarasa Mono Slab SC`（`--ds-font-family-code`）。字体须已安装（本机已有 `Sarasa-SuperTTC.ttc`）。
- 全部走官方通道：`ctx.theme.overrideTokens('chuanban-skin', …)` token 覆盖层 + 一个 `<style data-plugin>` 全局微调（选区色）。无 MutationObserver / TreeWalker / 轮询。

## 结构

```
src/index.js          # host 薄壳（无逻辑，挂载行占位）
src/client/skin.js    # client 源（token 表 + apply；factory 函数体格式）
cordis.patch.yml      # 挂载声明（insert chuanban-theme 行）
scripts/build-client.mjs   # 包装 lazy-CJS dist/client.js + 同步 dist/index.js
scripts/install-desktop.sh # symlink 进 profile + bundles 登记
tests/verify.mjs      # 自检（bundle 结构 / token 形状 / 关键 token / 声明）
```

## 使用

```sh
npm run build               # 构建 dist/
npm test                    # 自检
npm run install-desktop     # 注册进 ~/.dsh/profiles/desktop（可重复执行）
```

安装后重启 DSH 桌面端（或插件页刷新）生效；在 DSH 插件页开关 `chuanban-dsh-theme` 行即可热切换皮肤/原皮（HMR）。建议外观偏好固定 `light`（覆盖层 light/dark 均为暖纸浅色，dark 偏好下未覆盖的语义色会小面积走暗色值）。

## 边界（Phase 1 有意不做）

- 正文阅读层第三层字体（Sarasa Mono Slab 衬线正文）与输入框等宽：对话组件为 CSS Modules hash class（`hash_local` 格式，构建间不稳定），不做脆弱钩子，留待 Phase 2（open-claude-ui 深度定制，组件级方案）。
- 语义状态色（error/success/warn）、toast/tooltip 深色面、diff 配色保留官方默认。
