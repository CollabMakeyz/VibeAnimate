import ts from 'typescript';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './check-research.mjs';

// TypeScript's own syntax printer supplies deterministic formatting without a
// second parser/toolchain. Strict semantic checks are configured in tsconfig.
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
let failed = false;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) { await visit(file); continue; }
    if (!file.endsWith('.ts')) continue;
    const content = await readFile(file, 'utf8');
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const formatted = printer.printFile(source);
    if (process.argv.includes('--write')) await writeFile(file, formatted);
    else if (content.replaceAll('\r\n', '\n') !== formatted) { console.error(`${file}: run npm run format`); failed = true; }
    function lint(node) {
      const banned = node.kind === ts.SyntaxKind.AnyKeyword ||
        (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['eval', 'Function'].includes(node.expression.text)) ||
        (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Function') ||
        (ts.isPropertyAccessExpression(node) && ['innerHTML', 'outerHTML', 'dangerouslySetInnerHTML'].includes(node.name.text));
      if (banned) { console.error(`${file}: unsafe application construct ${node.getText(source)}`); failed = true; }
      ts.forEachChild(node, lint);
    }
    if (/@ts-(?:ignore|nocheck)/.test(content)) { console.error(`${file}: type checking cannot be suppressed`); failed = true; }
    lint(source);
  }
}
await visit(resolve(root, 'apps/desktop/src'));
if (failed) process.exitCode = 1;
else console.log('Desktop TypeScript formatting and application safety rules passed.');
