// 构建 dist/client.js：将 src/client/skin.js 包装为 DSH lazy-CJS 客户端模块，
// 并同步 host 薄壳 src/index.js 到 dist/index.js（host 无编译需求）。
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'chuanban-dsh-theme';

const skin = readFileSync(join(root, 'src/client/skin.js'), 'utf8');
const body = skin.split('\n').map((l) => (l ? '\t\t' + l : l)).join('\n');
const out = `window.__ModuleLoader__.load({
	id: ${JSON.stringify(ID)},
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${body}
		return module.exports;
	}
});
`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/client.js'), out);
copyFileSync(join(root, 'src/index.js'), join(root, 'dist/index.js'));
console.log('built dist/client.js (' + out.length + ' bytes) + dist/index.js');
