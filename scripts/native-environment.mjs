import { existsSync } from 'node:fs';
import { delimiter, resolve } from 'node:path';
import { root } from './check-research.mjs';

// A local host toolchain is never bundled as a product dependency. Prefer an
// explicit path; the workspace fallback keeps this checkout usable without
// rewriting the user's global PATH or replacing an existing Rust installation.
export function nativeEnvironment(source = process.env) {
  const env = { ...source };
  const local = source.VIBEANIMATE_TOOLCHAIN_ROOT ?? resolve(root, '../../work/native-toolchain');
  const cargoBin = resolve(local, 'cargo/bin');
  if (existsSync(resolve(cargoBin, process.platform === 'win32' ? 'cargo.exe' : 'cargo'))) {
    env.CARGO_HOME = resolve(local, 'cargo');
    env.RUSTUP_HOME = resolve(local, 'rustup');
    const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'PATH';
    env[pathKey] = `${cargoBin}${delimiter}${env[pathKey] ?? ''}`;
  } else if (source.VIBEANIMATE_TOOLCHAIN_ROOT) {
    throw new Error('VIBEANIMATE_TOOLCHAIN_ROOT does not contain cargo/bin/cargo');
  }
  return env;
}
