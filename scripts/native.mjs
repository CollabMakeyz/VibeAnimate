import { spawn } from 'node:child_process';
import { root } from './check-research.mjs';
import { nativeEnvironment } from './native-environment.mjs';
import { auditCargoProject } from './audit-cargo.mjs';

const commands = {
  build: ['build', '--locked'],
  'build-e2e': ['build', '--locked', '--features', 'e2e'],
  run: ['run', '--locked'],
  test: ['test', '--locked', '--workspace', '--features', 'e2e'],
  lint: ['clippy', '--locked', '--workspace', '--all-targets', '--features', 'e2e', '--', '-D', 'warnings'],
  format: ['fmt', '--all', '--', '--check'],
};
const action = process.argv[2];
if (!Object.hasOwn(commands, action ?? '')) throw new Error('Expected build, build-e2e, run, test, lint or format');
const errors = await auditCargoProject(root, { live: true, features: ['build-e2e', 'test', 'lint'].includes(action) ? ['e2e'] : [] });
if (errors.length) throw new Error(errors.join('\n'));
const child = spawn('cargo', commands[action], { cwd: root, env: nativeEnvironment(), stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
