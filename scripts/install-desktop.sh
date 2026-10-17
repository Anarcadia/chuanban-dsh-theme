#!/bin/sh
# 将 chuanban-dsh-theme 注册到 DSH 桌面版 profile（symlink + bundles 登记，可重复执行）
set -e
P="${DSH_PROFILE:-$HOME/.dsh/profiles/desktop}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$P/node_modules/@local"
ln -sfn "$SRC" "$P/node_modules/chuanban-dsh-theme"
node -e '
const fs=require("fs");const [dir,src]=process.argv.slice(1);const f=dir+"/package.json";
const j=JSON.parse(fs.readFileSync(f,"utf8"));
j.dependencies=j.dependencies||{};j.dependencies["chuanban-dsh-theme"]="file:"+src;
j.dsh=j.dsh||{};j.dsh.profile=j.dsh.profile||{};const b=j.dsh.profile.bundles=j.dsh.profile.bundles||[];
if(!b.includes("chuanban-dsh-theme"))b.push("chuanban-dsh-theme");
fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n");' "$P" "$SRC"
echo "registered into $P"; cat "$P/package.json"
