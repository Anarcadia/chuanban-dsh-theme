/**
 * chuanban-dsh-theme - 宿主半部（薄壳）
 *
 * 插件行 id：chuanban-theme
 * 皮肤逻辑全部在客户端半部（./client）：ctx.theme.overrideTokens 暖纸覆盖层
 * + 字体 token（--dsw-font-family / --ds-font-family-code）+ <style data-plugin> 全局微调。
 * host 侧无配置项、无运行时逻辑；启停走 DSH 插件页行开关（HMR 热生效）。
 */

export const name = 'chuanban-theme'

export function apply() {
  // 有意留空：纯客户端皮肤包（见 docs/cookbook/adding-a-settings-card.md
  // "Where the browser half rides" 一节对纯客户端包的说明）。
}
