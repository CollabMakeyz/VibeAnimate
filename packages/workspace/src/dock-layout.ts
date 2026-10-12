export type PanelId = 'tools' | 'properties' | 'library' | 'timeline';
export type DockEdge = 'left' | 'right' | 'top' | 'bottom';
export type WorkspacePreset = 'Essentials' | 'Animator' | 'Designer';
export interface FloatBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export type PanelPlacement = {
    readonly kind: 'dock';
    readonly edge: DockEdge;
    readonly size: number;
} | {
    readonly kind: 'float';
    readonly bounds: FloatBounds;
};
export interface PanelGroup {
    readonly id: string;
    readonly panels: readonly PanelId[];
    readonly active: PanelId | null;
    readonly collapsed: boolean;
    readonly placement: PanelPlacement;
}
export interface DockLayout {
    readonly version: 1;
    readonly groups: readonly PanelGroup[];
    readonly closed: readonly PanelId[];
}
export const PANEL_IDS: readonly PanelId[] = Object.freeze(['tools', 'properties', 'library', 'timeline']);
export const PRESETS: readonly WorkspacePreset[] = Object.freeze(['Essentials', 'Animator', 'Designer']);
const edges: readonly DockEdge[] = ['left', 'right', 'top', 'bottom'];
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const MAX_SIZE = 16384;
const MAX_POSITION = 1000000;
export function panelAllowsEdge(panel: PanelId, edge: DockEdge): boolean {
    // Vertical tools retain their one/two-column layout; the other panes may dock
    // on any edge. Floating has no edge restriction.
    return panel !== 'tools' || edge === 'left' || edge === 'right';
}
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype)
        throw new TypeError('Expected plain workspace record');
    const result = value as Record<string, unknown>;
    if (Object.keys(result).length !== keys.length || keys.some(key => !Object.hasOwn(result, key)))
        throw new TypeError('Unknown or missing workspace field');
    if (Object.values(Object.getOwnPropertyDescriptors(result)).some(descriptor => !Object.hasOwn(descriptor, 'value')))
        throw new TypeError('Workspace records cannot contain accessors');
    return result;
}
function dense(values: readonly unknown[]): void {
    for (let index = 0; index < values.length; index++) {
        if (!Object.hasOwn(values, index))
            throw new TypeError('Workspace arrays cannot contain holes');
    }
}
function number(value: unknown, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
        throw new RangeError('Workspace number outside supported range');
    return value;
}
function panel(value: unknown): PanelId {
    if (!PANEL_IDS.includes(value as PanelId))
        throw new TypeError('Unknown workspace panel');
    return value as PanelId;
}
function placement(value: unknown): PanelPlacement {
    if (typeof value !== 'object' || value === null || !('kind' in value))
        throw new TypeError('Missing panel placement');
    if (value.kind === 'dock') {
        const data = record(value, ['kind', 'edge', 'size']);
        if (!edges.includes(data.edge as DockEdge))
            throw new TypeError('Unknown dock edge');
        return Object.freeze({ kind: 'dock', edge: data.edge as DockEdge, size: number(data.size, 48, MAX_SIZE) });
    }
    if (value.kind === 'float') {
        const data = record(value, ['kind', 'bounds']);
        const rect = record(data.bounds, ['x', 'y', 'width', 'height']);
        return Object.freeze({ kind: 'float', bounds: Object.freeze({ x: number(rect.x, -MAX_POSITION, MAX_POSITION), y: number(rect.y, -MAX_POSITION, MAX_POSITION), width: number(rect.width, 48, MAX_SIZE), height: number(rect.height, 48, MAX_SIZE) }) });
    }
    throw new TypeError('Unknown panel placement');
}
// All panels have exactly one home, including closed panels. Keeping hidden tabs
// in their group preserves position on restore without a second, divergent tree.
export function validateDockLayout(value: unknown): DockLayout {
    const data = record(value, ['version', 'groups', 'closed']);
    if (data.version !== 1)
        throw new TypeError('Unsupported workspace version');
    if (!Array.isArray(data.groups) || data.groups.length < 1 || data.groups.length > PANEL_IDS.length || !Array.isArray(data.closed) || data.closed.length > PANEL_IDS.length)
        throw new RangeError('Workspace collection size invalid');
    dense(data.groups);
    dense(data.closed);
    const closed = data.closed.map(panel);
    if (new Set(closed).size !== closed.length)
        throw new TypeError('Duplicate closed panel');
    const ids = new Set<string>(), seen = new Set<PanelId>();
    const groups = data.groups.map((value: unknown): PanelGroup => {
        const group = record(value, ['id', 'panels', 'active', 'collapsed', 'placement']);
        if (typeof group.id !== 'string' || !idPattern.test(group.id) || ids.has(group.id))
            throw new TypeError('Invalid or duplicate panel group ID');
        ids.add(group.id);
        if (!Array.isArray(group.panels) || group.panels.length < 1 || group.panels.length > PANEL_IDS.length)
            throw new RangeError('Panel group size invalid');
        dense(group.panels);
        const panels = group.panels.map(panel);
        const home = placement(group.placement);
        for (const id of panels) {
            if (seen.has(id))
                throw new TypeError('Panel has more than one home');
            if (home.kind === 'dock' && !panelAllowsEdge(id, home.edge))
                throw new TypeError('Panel cannot dock at this edge');
            seen.add(id);
        }
        const visible = panels.filter(id => !closed.includes(id));
        const active = group.active === null ? null : panel(group.active);
        if (visible.length === 0 ? active !== null : active === null || !visible.includes(active))
            throw new TypeError('Active tab must name a visible panel');
        if (typeof group.collapsed !== 'boolean')
            throw new TypeError('Invalid panel collapse state');
        return Object.freeze({ id: group.id, panels: Object.freeze(panels), active, collapsed: group.collapsed, placement: home });
    });
    if (seen.size !== PANEL_IDS.length)
        throw new TypeError('Workspace omits a panel');
    return Object.freeze({ version: 1, groups: Object.freeze(groups), closed: Object.freeze(closed) });
}
export function serializeDockLayout(layout: DockLayout): string { return JSON.stringify(validateDockLayout(layout)); }
export function parseDockLayout(json: string): DockLayout {
    if (json.length > 16384)
        throw new RangeError('Workspace exceeds character budget');
    return validateDockLayout(JSON.parse(json) as unknown);
}
export function presetLayout(preset: WorkspacePreset): DockLayout {
    if (!PRESETS.includes(preset))
        throw new TypeError('Unknown workspace preset');
    const dock = (id: string, panels: readonly PanelId[], edge: DockEdge, size: number): PanelGroup => ({ id, panels, active: panels[0] ?? null, collapsed: false, placement: { kind: 'dock', edge, size } });
    const groups = [dock('tools', ['tools'], 'left', preset === 'Designer' ? 96 : 56)];
    if (preset === 'Designer')
        groups.push(dock('properties', ['properties'], 'right', 300), dock('library', ['library'], 'right', 300));
    else
        groups.push(dock('inspectors', ['properties', 'library'], 'right', 280));
    groups.push(dock('timeline', ['timeline'], 'bottom', preset === 'Animator' ? 300 : 200));
    return validateDockLayout({ version: 1, groups, closed: [] });
}
function getGroup(layout: DockLayout, groupId: string): PanelGroup {
    const group = layout.groups.find(group => group.id === groupId);
    if (!group)
        throw new Error(`Unknown panel group: ${groupId}`);
    return group;
}
function update(layout: DockLayout, groups: readonly PanelGroup[], closed: readonly PanelId[] = layout.closed): DockLayout {
    return validateDockLayout({ version: 1, groups, closed });
}
function activeTab(panels: readonly PanelId[], closed: readonly PanelId[], preferred: PanelId | null): PanelId | null {
    return preferred !== null && panels.includes(preferred) && !closed.includes(preferred) ? preferred : panels.find(id => !closed.includes(id)) ?? null;
}
export function selectPanel(layout: DockLayout, id: PanelId): DockLayout {
    panel(id);
    const closed = layout.closed.filter(value => value !== id);
    return update(layout, layout.groups.map(group => group.panels.includes(id) ? { ...group, active: id, collapsed: false } : group), closed);
}
export function closePanel(layout: DockLayout, id: PanelId): DockLayout {
    panel(id);
    const closed = [...new Set([...layout.closed, id])];
    return update(layout, layout.groups.map(group => ({ ...group, active: activeTab(group.panels, closed, group.active) })), closed);
}
export function collapseGroup(layout: DockLayout, groupId: string, collapsed: boolean): DockLayout {
    getGroup(layout, groupId);
    return update(layout, layout.groups.map(group => group.id === groupId ? { ...group, collapsed } : group));
}
export function placeGroup(layout: DockLayout, groupId: string, target: PanelPlacement): DockLayout {
    getGroup(layout, groupId);
    return update(layout, layout.groups.map(group => group.id === groupId ? { ...group, placement: target } : group));
}
export type PanelDestination = {
    readonly kind: 'tab';
    readonly groupId: string;
    readonly index: number;
} | {
    readonly kind: 'new';
    readonly groupId: string;
    readonly placement: PanelPlacement;
    readonly index: number;
};
export function movePanel(layout: DockLayout, id: PanelId, target: PanelDestination): DockLayout {
    panel(id);
    if (!Number.isInteger(target.index) || target.index < 0)
        throw new RangeError('Panel insertion index must be a nonnegative integer');
    if (target.kind === 'tab')
        getGroup(layout, target.groupId);
    else if (layout.groups.some(group => group.id === target.groupId))
        throw new Error('New group ID already exists');
    const closed = layout.closed.filter(value => value !== id);
    const groups: PanelGroup[] = [];
    for (const group of layout.groups) {
        const panels = group.panels.filter(value => value !== id);
        if (target.kind === 'tab' && group.id === target.groupId) {
            if (target.index > panels.length)
                throw new RangeError('Tab insertion index outside group');
            panels.splice(target.index, 0, id);
            groups.push({ ...group, panels, active: id, collapsed: false });
        }
        else if (panels.length)
            groups.push({ ...group, panels, active: activeTab(panels, closed, group.active) });
    }
    if (target.kind === 'new') {
        if (target.index > groups.length)
            throw new RangeError('Group insertion index outside workspace');
        groups.splice(target.index, 0, { id: target.groupId, panels: [id], active: id, collapsed: false, placement: target.placement });
    }
    return update(layout, groups, closed);
}
export function reorderGroup(layout: DockLayout, groupId: string, index: number): DockLayout {
    const group = getGroup(layout, groupId);
    if (!Number.isInteger(index) || index < 0 || index >= layout.groups.length)
        throw new RangeError('Group insertion index outside workspace');
    const groups = layout.groups.filter(value => value.id !== groupId);
    groups.splice(index, 0, group);
    return update(layout, groups);
}
export function recoverFloatingPanels(layout: DockLayout, viewportWidth: number, viewportHeight: number): DockLayout {
    const width = number(viewportWidth, 48, MAX_SIZE), height = number(viewportHeight, 48, MAX_SIZE);
    return update(layout, layout.groups.map(group => {
        if (group.placement.kind !== 'float')
            return group;
        const source = group.placement.bounds;
        const w = Math.min(source.width, width), h = Math.min(source.height, height);
        const bounds = { x: Math.max(0, Math.min(width - w, source.x)), y: Math.max(0, Math.min(height - h, source.y)), width: w, height: h };
        return { ...group, placement: { kind: 'float', bounds } };
    }));
}
