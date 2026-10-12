import { PRESETS, presetLayout, validateDockLayout } from './dock-layout.js';
import type { DockLayout, WorkspacePreset } from './dock-layout.js';
export interface WorkspaceStorage {
    read(): string | null;
    write(value: string): void;
}
export interface SavedWorkspace {
    readonly id: string;
    readonly name: string;
    readonly layout: DockLayout;
}
export interface WorkspaceState {
    readonly version: 1;
    readonly active: string;
    readonly current: DockLayout;
    readonly custom: readonly SavedWorkspace[];
}
const MAX_CUSTOM = 20;
const MAX_JSON_LENGTH = 131072;
function name(value: string): string {
    const normalized = value.trim().normalize('NFC');
    if (!normalized || normalized.length > 64 || /[\u0000-\u001f\u007f]/.test(normalized))
        throw new TypeError('Workspace name must contain 1–64 printable characters');
    return normalized;
}
function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        throw new TypeError('Expected workspace storage record');
    const data = value as Record<string, unknown>;
    if (Object.keys(data).length !== keys.length || keys.some(key => !Object.hasOwn(data, key)))
        throw new TypeError('Unknown or missing workspace storage field');
    return data;
}
function validateState(value: unknown): WorkspaceState {
    const data = exact(value, ['version', 'active', 'current', 'custom']);
    if (data.version !== 1 || typeof data.active !== 'string')
        throw new TypeError('Unsupported workspace storage format');
    if (!Array.isArray(data.custom) || data.custom.length > MAX_CUSTOM)
        throw new RangeError('Too many custom workspaces');
    const ids = new Set<string>(), names = new Set<string>(PRESETS.map(value => value.toLowerCase()));
    const custom = data.custom.map((value: unknown): SavedWorkspace => {
        const entry = exact(value, ['id', 'name', 'layout']);
        if (typeof entry.id !== 'string' || !/^custom-[a-z0-9-]{1,48}$/.test(entry.id) || ids.has(entry.id))
            throw new TypeError('Invalid or duplicate workspace ID');
        if (typeof entry.name !== 'string')
            throw new TypeError('Workspace requires a name');
        const label = name(entry.name);
        if (names.has(label.toLowerCase()))
            throw new TypeError('Workspace name already exists');
        ids.add(entry.id);
        names.add(label.toLowerCase());
        return Object.freeze({ id: entry.id, name: label, layout: validateDockLayout(entry.layout) });
    });
    if (!PRESETS.some(preset => data.active === `preset:${preset}`) && !ids.has(data.active))
        throw new TypeError('Active workspace does not exist');
    return Object.freeze({ version: 1, active: data.active, current: validateDockLayout(data.current), custom: Object.freeze(custom) });
}
function initialState(): WorkspaceState { return validateState({ version: 1, active: 'preset:Essentials', current: presetLayout('Essentials'), custom: [] }); }
// Synchronous settings storage deliberately writes before publishing new state:
// quota/permission failures cannot appear to be successfully saved in the UI.
export class WorkspaceStore {
    readonly #storage: WorkspaceStorage;
    #state: WorkspaceState;
    constructor(storage: WorkspaceStorage) {
        this.#storage = storage;
        const json = storage.read();
        if (json !== null && json.length > MAX_JSON_LENGTH)
            throw new RangeError('Workspace settings exceed storage budget');
        this.#state = json === null ? initialState() : validateState(JSON.parse(json) as unknown);
    }
    get state(): WorkspaceState { return this.#state; }
    #commit(value: WorkspaceState): void {
        const next = validateState(value);
        const json = JSON.stringify(next);
        if (json.length > MAX_JSON_LENGTH)
            throw new RangeError('Workspace settings exceed storage budget');
        this.#storage.write(json);
        this.#state = next;
    }
    setLayout(layout: DockLayout): void { this.#commit({ ...this.#state, current: layout }); }
    select(id: string): void {
        const preset = PRESETS.find(preset => id === `preset:${preset}`);
        const saved = this.#state.custom.find(workspace => workspace.id === id);
        if (!preset && !saved)
            throw new Error('Unknown workspace');
        const current = preset ? presetLayout(preset) : saved!.layout;
        this.#commit({ ...this.#state, active: id, current });
    }
    selectPreset(preset: WorkspacePreset): void { this.select(`preset:${preset}`); }
    saveNew(id: string, label: string): void {
        this.#commit({ ...this.#state, active: id, custom: [...this.#state.custom, { id, name: label, layout: this.#state.current }] });
    }
    overwrite(id: string): void {
        if (!this.#state.custom.some(workspace => workspace.id === id))
            throw new Error('Only a saved custom workspace can be overwritten');
        this.#commit({ ...this.#state, custom: this.#state.custom.map(workspace => workspace.id === id ? { ...workspace, layout: this.#state.current } : workspace) });
    }
    rename(id: string, label: string): void {
        if (!this.#state.custom.some(workspace => workspace.id === id))
            throw new Error('Only a saved custom workspace can be renamed');
        this.#commit({ ...this.#state, custom: this.#state.custom.map(workspace => workspace.id === id ? { ...workspace, name: label } : workspace) });
    }
    delete(id: string): void {
        if (!this.#state.custom.some(workspace => workspace.id === id))
            throw new Error('Only a saved custom workspace can be deleted');
        const custom = this.#state.custom.filter(workspace => workspace.id !== id);
        this.#commit(this.#state.active === id ? { ...initialState(), custom } : { ...this.#state, custom });
    }
    // Presets restore factory defaults; custom workspaces restore their last
    // explicit save. Unsaved panel movement remains recoverable across restarts.
    reset(): void { this.select(this.#state.active); }
}
