import type { CommandDefinition, KeyboardContext } from './contracts.js';
export type ShortcutPlatform = 'mac' | 'windows' | 'linux';
export interface ShortcutInput {
    readonly key: string;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly altKey: boolean;
    readonly shiftKey: boolean;
    readonly repeat: boolean;
    readonly isComposing: boolean;
    readonly altGraphKey: boolean;
}
export interface CommandState {
    readonly id: string;
    readonly label: string;
    readonly enabled: boolean;
    readonly checked: boolean | null;
    readonly shortcuts: readonly string[];
}
export interface ShortcutResult {
    readonly handled: boolean;
    readonly commandId: string | null;
    readonly outcome: 'executed' | 'disabled' | 'suppressed' | 'unmatched';
}
interface Binding {
    readonly key: string;
    readonly ctrl: boolean;
    readonly meta: boolean;
    readonly alt: boolean;
    readonly shift: boolean;
}
interface Registered {
    readonly definition: CommandDefinition;
    readonly contexts: ReadonlySet<KeyboardContext>;
    readonly defaults: readonly string[];
    readonly shortcuts: readonly string[];
    readonly bindings: readonly Binding[];
}
const contexts: ReadonlySet<string> = new Set(['global', 'stage', 'timeline', 'panel', 'textEditing', 'motionEditor', 'modal', 'inputField']);
const isolated: ReadonlySet<KeyboardContext> = new Set(['textEditing', 'modal', 'inputField']);
const namedKeys = new Set(['Space', 'Plus', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
function canonicalKey(key: string): string {
    if (key === 'Plus')
        return '+';
    if (key === ' ')
        return 'Space';
    return key.length === 1 ? key.toLowerCase() : key;
}
function parseShortcut(value: string, platform: ShortcutPlatform): Binding {
    const parts = value.split('+');
    const key = parts.pop();
    if (!key || !(key.length === 1 && !/\s/.test(key) || namedKeys.has(key) || /^F(?:[1-9]|1\d|2[0-4])$/.test(key)))
        throw new TypeError(`Invalid shortcut: ${value}`);
    const modifiers = new Set(parts);
    if (modifiers.size !== parts.length || parts.some(part => !['Primary', 'Ctrl', 'Meta', 'Alt', 'Shift'].includes(part)))
        throw new TypeError(`Invalid shortcut modifiers: ${value}`);
    if (modifiers.has('Primary') && (modifiers.has('Ctrl') || modifiers.has('Meta')))
        throw new TypeError('Primary cannot be combined with Ctrl or Meta');
    return { key: canonicalKey(key), ctrl: modifiers.has('Ctrl') || modifiers.has('Primary') && platform !== 'mac', meta: modifiers.has('Meta') || modifiers.has('Primary') && platform === 'mac', alt: modifiers.has('Alt'), shift: modifiers.has('Shift') };
}
function signature(binding: Binding): string { return JSON.stringify(binding); }
function priority(command: Registered, context: KeyboardContext): number {
    if (command.contexts.has(context))
        return 2;
    return !isolated.has(context) && command.contexts.has('global') ? 1 : 0;
}
function validateContext(context: KeyboardContext): void {
    if (!contexts.has(context))
        throw new TypeError(`Unknown keyboard context: ${context}`);
}
// Shared invocation/enablement path for menus, palette, and keyboard. No UI or
// document mutation capability is held here; commands receive it via closures.
export class CommandRegistry {
    readonly #commands = new Map<string, Registered>();
    readonly #platform: ShortcutPlatform;
    constructor(platform: ShortcutPlatform) {
        if (!['mac', 'windows', 'linux'].includes(platform))
            throw new TypeError('Unknown shortcut platform');
        this.#platform = platform;
    }
    register(definition: CommandDefinition): () => void {
        if (!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(definition.id) || !definition.label.trim())
            throw new TypeError('Commands require a stable ID and label');
        if (this.#commands.has(definition.id))
            throw new Error(`Duplicate command ID: ${definition.id}`);
        if (!definition.contexts.size)
            throw new TypeError('Commands require at least one context');
        for (const context of definition.contexts)
            validateContext(context);
        const defaults = Object.freeze([...definition.defaultShortcuts]);
        const command = this.#withShortcuts({ definition: Object.freeze({ ...definition }), contexts: new Set(definition.contexts), defaults, shortcuts: [], bindings: [] }, defaults);
        this.#commands.set(definition.id, command);
        // A stale disposer must not remove a later registration with the same ID.
        const identity = command.definition;
        const id = identity.id;
        return () => {
            if (this.#commands.get(id)?.definition === identity)
                this.#commands.delete(id);
        };
    }
    #withShortcuts(command: Registered, shortcuts: readonly string[]): Registered {
        const bindings = shortcuts.map(shortcut => parseShortcut(shortcut, this.#platform));
        const keys = new Set(bindings.map(signature));
        if (keys.size !== bindings.length)
            throw new Error(`Duplicate shortcut for ${command.definition.id}`);
        for (const other of this.#commands.values()) {
            if (other.definition.id === command.definition.id)
                continue;
            const overlap = [...command.contexts].some(context => other.contexts.has(context));
            if (overlap && other.bindings.some(binding => keys.has(signature(binding))))
                throw new Error(`Shortcut conflict: ${command.definition.id} and ${other.definition.id}`);
        }
        return { ...command, shortcuts: Object.freeze([...shortcuts]), bindings };
    }
    #get(id: string): Registered {
        const command = this.#commands.get(id);
        if (!command)
            throw new Error(`Unknown command: ${id}`);
        return command;
    }
    setShortcuts(id: string, shortcuts: readonly string[]): void {
        const next = this.#withShortcuts(this.#get(id), shortcuts);
        this.#commands.set(id, next);
    }
    resetShortcuts(id: string): void { this.setShortcuts(id, this.#get(id).defaults); }
    state(id: string, context: KeyboardContext): CommandState {
        validateContext(context);
        const command = this.#get(id);
        return Object.freeze({ id, label: command.definition.label, enabled: priority(command, context) > 0 && command.definition.enabled(), checked: command.definition.checked(), shortcuts: command.shortcuts });
    }
    list(context: KeyboardContext): readonly CommandState[] {
        validateContext(context);
        return Object.freeze([...this.#commands.keys()].map(id => this.state(id, context)));
    }
    execute(id: string, context: KeyboardContext): boolean {
        if (!this.state(id, context).enabled)
            return false;
        this.#get(id).definition.execute();
        return true;
    }
    handle(input: ShortcutInput, context: KeyboardContext): ShortcutResult {
        validateContext(context);
        // IME and AltGr belong to text entry, even if focus reporting lags.
        if (input.isComposing || input.altGraphKey || input.key === 'Dead' || input.key === 'Process')
            return { handled: false, commandId: null, outcome: 'suppressed' };
        const key = canonicalKey(input.key);
        let winner: Registered | undefined;
        let best = 0;
        for (const command of this.#commands.values()) {
            const rank = priority(command, context);
            if (rank <= best)
                continue;
            if (command.bindings.some(binding => binding.key === key && binding.ctrl === input.ctrlKey && binding.meta === input.metaKey && binding.alt === input.altKey && binding.shift === input.shiftKey)) {
                winner = command;
                best = rank;
            }
        }
        if (!winner)
            return { handled: false, commandId: null, outcome: 'unmatched' };
        const commandId = winner.definition.id;
        if (input.repeat && !winner.definition.allowRepeat)
            return { handled: true, commandId, outcome: 'suppressed' };
        return { handled: true, commandId, outcome: this.execute(commandId, context) ? 'executed' : 'disabled' };
    }
}
