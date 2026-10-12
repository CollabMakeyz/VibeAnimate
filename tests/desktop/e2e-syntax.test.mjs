import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import ts from 'typescript';

test('native E2E expressions parse in the same async wrapper used by CDP', async () => {
  let count = 0;
  for (const file of ['scripts/e2e-desktop.mjs', 'scripts/e2e-stage.mjs']) {
    const source = ts.createSourceFile(file, await readFile(new URL(`../../${file}`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'evaluate') {
        const argument = node.arguments[0];
        assert.ok(argument && ts.isNoSubstitutionTemplateLiteral(argument), `${file}: test evaluation must use a literal expression`);
        const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        new Script(`(async()=>(${argument.text}))()`, { filename: `${file}:${line}` });
        count++;
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(count >= 30, 'Expected to inspect the full native expression corpus');
});
