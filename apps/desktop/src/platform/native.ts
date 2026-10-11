import { invoke } from '@tauri-apps/api/core';
export interface RuntimeInfo {
    readonly version: string;
    readonly os: string;
    readonly architecture: string;
    readonly protocolVersion: number;
}
type EventCode = 'frontend_ready' | 'frontend_error' | 'diagnostics_requested' | 'recovery';
export async function runtimeInfo(): Promise<RuntimeInfo> {
    const value = await invoke<RuntimeInfo>('runtime_info');
    if (value.protocolVersion !== 1 || typeof value.version !== 'string' || typeof value.os !== 'string' || typeof value.architecture !== 'string')
        throw new Error('Native protocol mismatch');
    return value;
}
export async function recordEvent(code: EventCode, message: string): Promise<void> {
    await invoke('log_event', { event: { level: code === 'frontend_error' ? 'error' : 'info', code, message: Array.from(message).slice(0, 512).join('') } });
}
export async function readLogs(): Promise<string> { return invoke<string>('read_logs'); }
export function reportError(error: unknown): void {
    // No document contents, arbitrary paths or stacks are persisted automatically.
    console.error('VibeAnimate interface error', error);
    void recordEvent('frontend_error', 'Interface failure; review the current session diagnostics.').catch(() => {
        console.error('The native diagnostic log is unavailable.');
    });
}
