#!/usr/bin/env python3
"""
将 Anthropic Sans / Serif / Mono 三款可变字体 (.ttf) 转换为 WOFF2 Base64 Data URI，
生成 src/client/fonts-woff2.js，供 scripts/build-client.mjs 内联打入 dist/client.js。
"""
import base64
import io
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = Path("/Users/yunhanbao/Library/Fonts")

FONTS = [
    ("Anthropic Sans Web", FONT_DIR / "AnthropicSans-Regular.ttf"),
    ("Anthropic Serif Web", FONT_DIR / "AnthropicSerif-Regular.ttf"),
    ("Anthropic Mono Web", FONT_DIR / "AnthropicMono-Regular.ttf"),
]


def main() -> None:
    rules = []
    total_woff2 = 0
    for family, path in FONTS:
        if not path.exists():
            raise FileNotFoundError(f"Missing font file: {path}")
        tt = TTFont(str(path))
        tt.flavor = "woff2"
        buf = io.BytesIO()
        tt.save(buf)
        woff2_bytes = buf.getvalue()
        total_woff2 += len(woff2_bytes)
        b64 = base64.b64encode(woff2_bytes).decode("ascii")
        rules.append(
            f"@font-face {{ font-family: '{family}'; font-style: normal; font-weight: 300 800; font-display: block; src: url('data:font/woff2;base64,{b64}') format('woff2'); }}"
        )
        print(f"  ✓ {family}: TTF {path.stat().st_size:,} B -> WOFF2 {len(woff2_bytes):,} B (Base64 {len(b64):,} chars)")

    out_path = ROOT / "src" / "client" / "fonts-woff2.js"
    js_lines = [
        "/*",
        " * chuanban-dsh-theme - 内嵌 Anthropic 可变字体（WOFF2 Base64 Data URI）",
        " * 由 scripts/build-fonts.py 从 AnthropicSans / AnthropicSerif / AnthropicMono 可变 TTF 生成。",
        " * 开箱即用：Windows / macOS / Web 客户端安装插件后无需手动安装西文字体即可获得原汁原味排版。",
        " */",
        "var CB_EMBEDDED_FONT_CSS = [",
    ]
    for i, rule in enumerate(rules):
        comma = "," if i < len(rules) - 1 else ""
        js_lines.append(f'  "{rule}"{comma}')
    js_lines.append("].join('\\n');")
    js_lines.append("")

    content = "\n".join(js_lines)
    out_path.write_bytes(content.encode("utf-8"))
    print(f"wrote {out_path} ({len(content):,} bytes, total WOFF2 raw = {total_woff2:,} bytes)")


if __name__ == "__main__":
    main()
