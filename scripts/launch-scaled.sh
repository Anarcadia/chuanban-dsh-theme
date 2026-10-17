#!/bin/sh
# 以整体等比缩放启动 DSH Desktop（2026-10-17 D148 方案：布局级全局缩放唯一零 bug 通道）
#
# 原理：--force-device-scale-factor 是 Chromium 设备像素比开关（等同 Retina 密度变化），
# 字体/侧栏宽度/分栏线/弹层/视口测量全体等比缩放且语义自洽——CSS zoom 方案会令弹层库
# （rect 视觉坐标 × style.top 布局单位错乘）结构性错位，故弃用。DSH 主进程不过滤
# chromium 开关（dev 脚本同机制），Electron 44 完整支持。
#
# 用法：sh launch-scaled.sh [factor]     例：sh launch-scaled.sh 1.25
# 注意：
# - DSH 有 single-instance 锁，运行中实例会吞掉启动参数；脚本会先请求退出再带参冷启动。
# - 若 DSH 有任务运行，退出可能被官方确认弹窗拦截——手动退出后再跑本脚本即可。
# - 正常打开（Dock/Spotlight）不携带开关，恢复 1.0 缩放。
FACTOR="${1:-1.25}"
APP="/Applications/DeepSeek Harness.app"
osascript -e 'quit app "DeepSeek Harness"' 2>/dev/null
sleep 1.5
open -a "$APP" --args --force-device-scale-factor="$FACTOR"
echo "DSH launched with --force-device-scale-factor=$FACTOR"
