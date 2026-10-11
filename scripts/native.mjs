import { spawn } from 'node:child_process';
import { root } from './check-research.mjs';
import { nativeEnvironment } from './native-environment.mjs';
import { auditCargoProject } from './audit-cargo.mjs';

const commands = {
  build: ['build', '--locked'],
  run: ['run', '--locked'],
  test: ['test', '--locked', '--workspace'],
  lint: ['clippy', '--locked', '--workspace', '--all-targets', '--', '-D', 'warnings'],
  format: ['fmt', '--all', '--', '--check'],
};
const action = process.argv[2];
if (!Object.hasOwn(commands, action ?? '')) throw new Error('Expected build, run, test, lint or format');
const errors = await auditCargoProject(root, { live: true });
if (errors.length) throw new Error(errors.join('\n'));
const child = spawn('cargo', commands[action], { cwd: root, env: nativeEnvironment(), stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
