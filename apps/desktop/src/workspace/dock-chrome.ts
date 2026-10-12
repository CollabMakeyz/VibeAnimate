import { Component, createRef, h } from 'preact';
import type { ComponentChildren } from 'preact';
import { closePanel, collapseGroup, movePanel, panelAllowsEdge, placeGroup, recoverFloatingPanels, selectPanel } from '../../../../packages/workspace/src/dock-layout.js';
import type { DockEdge, DockLayout, PanelGroup, PanelId, PanelPlacement } from '../../../../packages/workspace/src/dock-layout.js';
const labels: Readonly<Record<PanelId, string>> = { tools: 'Ferramentas', properties: 'Propriedades', library: 'Biblioteca', timeline: 'Timeline' };
const edges: readonly DockEdge[] = ['left', 'right', 'top', 'bottom'];
const edgeLabels: Readonly<Record<DockEdge, string>> = { left: 'À esquerda', right: 'À direita', top: 'Acima', bottom: 'Abaixo' };
const mime = 'application/x-vibeanimate-panel';
interface Props {
    readonly layout: DockLayout;
    readonly panels: Readonly<Record<PanelId, ComponentChildren>>;
    readonly onLayout: (layout: DockLayout, persist: boolean) => void;
    readonly children?: ComponentChildren;
}
interface Drag {
    readonly pointer: number;
    readonly target: HTMLElement;
    readonly original: DockLayout;
    readonly group: PanelGroup;
    readonly startX: number;
    readonly startY: number;
    readonly kind: 'move' | 'resize';
    latest: DockLayout;
}
export class DockChrome extends Component<Props, {
    dragging: boolean;
    width: number;
    height: number;
}> {
    override state = { dragging: false, width: 1000, height: 500 };
    readonly #root = createRef<HTMLDivElement>();
    #observer: ResizeObserver | null = null;
    #drag: Drag | null = null;
    #moved = false;
    override componentDidMount(): void {
        this.#observer = new ResizeObserver(() => {
            const root = this.#root.current!;
            if (root.clientWidth < 48 || root.clientHeight < 48 || this.#drag)
                return;
            if (root.clientWidth !== this.state.width || root.clientHeight !== this.state.height)
                this.setState({ width: root.clientWidth, height: root.clientHeight });
            const recovered = recoverFloatingPanels(this.props.layout, root.clientWidth, root.clientHeight);
            if (JSON.stringify(recovered) !== JSON.stringify(this.props.layout))
                this.props.onLayout(recovered, true);
        });
        this.#observer.observe(this.#root.current!);
    }
    override componentWillUnmount(): void { this.#observer?.disconnect(); this.#drag = null; }
    #place(group: PanelGroup, placement: PanelPlacement): void { this.props.onLayout(placeGroup(this.props.layout, group.id, placement), true); }
    #float(group: PanelGroup): void {
        const root = this.#root.current!;
        this.#place(group, { kind: 'float', bounds: { x: 24, y: 24, width: Math.min(320, Math.max(48, root.clientWidth - 48)), height: Math.min(280, Math.max(48, root.clientHeight - 48)) } });
    }
    #start(event: PointerEvent, group: PanelGroup, kind: Drag['kind']): void {
        if (event.button !== 0 || this.#drag)
            return;
        event.preventDefault();
        event.stopPropagation();
        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
        this.#drag = { pointer: event.pointerId, target, group, kind, startX: event.clientX, startY: event.clientY, original: this.props.layout, latest: this.props.layout };
        this.#moved = false;
    }
    #move = (event: PointerEvent): void => {
        const drag = this.#drag;
        if (!drag || drag.pointer !== event.pointerId)
            return;
        const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > 3)
            this.#moved = true;
        const root = this.#root.current!;
        const placement = drag.group.placement;
        let next: PanelPlacement;
        if (placement.kind === 'float') {
            const rect = placement.bounds;
            const bounds = drag.kind === 'move'
                ? { ...rect, x: Math.max(0, Math.min(root.clientWidth - rect.width, rect.x + dx)), y: Math.max(0, Math.min(root.clientHeight - rect.height, rect.y + dy)) }
                : { ...rect, width: Math.max(48, Math.min(root.clientWidth - rect.x, rect.width + dx)), height: Math.max(48, Math.min(root.clientHeight - rect.y, rect.height + dy)) };
            next = { kind: 'float', bounds };
        }
        else {
            const horizontal = placement.edge === 'left' || placement.edge === 'right';
            const delta = (horizontal ? dx : dy) * (placement.edge === 'right' || placement.edge === 'bottom' ? -1 : 1);
            next = { ...placement, size: Math.max(48, Math.min((horizontal ? root.clientWidth : root.clientHeight) * .45, placement.size + delta)) };
        }
        drag.latest = placeGroup(drag.original, drag.group.id, next);
        this.props.onLayout(drag.latest, false);
    };
    #end = (event: PointerEvent): void => {
        const drag = this.#drag;
        if (!drag || drag.pointer !== event.pointerId)
            return;
        this.#drag = null;
        if (drag.target.hasPointerCapture(event.pointerId))
            drag.target.releasePointerCapture(event.pointerId);
        this.props.onLayout(event.type === 'pointercancel' ? drag.original : drag.latest, true);
    };
    #dragPanel(event: DragEvent, panel: PanelId): void {
        this.setState({ dragging: true });
        event.dataTransfer?.setData(mime, panel);
        if (event.dataTransfer)
            event.dataTransfer.effectAllowed = 'move';
    }
    #over(event: DragEvent): void {
        if (event.dataTransfer?.types.includes(mime))
            event.preventDefault();
    }
    #drop(event: DragEvent, edge: DockEdge, target?: PanelGroup): void {
        const id = event.dataTransfer?.getData(mime) as PanelId;
        if (!Object.hasOwn(labels, id))
            return;
        if (target?.placement.kind === 'dock' && !panelAllowsEdge(id, target.placement.edge) || !target && !panelAllowsEdge(id, edge))
            return;
        event.preventDefault();
        event.stopPropagation();
        this.setState({ dragging: false });
        const layout = this.props.layout;
        if (target) {
            this.props.onLayout(movePanel(layout, id, { kind: 'tab', groupId: target.id, index: target.panels.filter(panel => panel !== id).length }), true);
        }
        else {
            let index = 0;
            while (layout.groups.some(group => group.id === `dock-${id}-${index}`))
                index++;
            this.props.onLayout(movePanel(layout, id, { kind: 'new', groupId: `dock-${id}-${index}`, placement: { kind: 'dock', edge, size: id === 'tools' ? 64 : edge === 'bottom' || edge === 'top' ? 180 : 260 }, index: layout.groups.length - (layout.groups.find(group => group.panels.includes(id))?.panels.length === 1 ? 1 : 0) }), true);
        }
    }
    #resizeKey(event: KeyboardEvent, group: PanelGroup): void {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
            return;
        event.preventDefault();
        event.stopPropagation();
        const amount = (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) * (event.shiftKey ? 40 : 10);
        const p = group.placement;
        if (p.kind === 'float')
            this.#place(group, { ...p, bounds: { ...p.bounds, width: Math.max(48, Math.min(16384, p.bounds.width + (event.key.includes('Left') || event.key.includes('Right') ? amount : 0))), height: Math.max(48, Math.min(16384, p.bounds.height + (event.key.includes('Up') || event.key.includes('Down') ? amount : 0))) } });
        else
            this.#place(group, { ...p, size: Math.max(48, Math.min(16384, p.size + amount * (p.edge === 'right' || p.edge === 'bottom' ? -1 : 1))) });
    }
    #toggle(group: PanelGroup): void {
        if (this.#moved) {
            this.#moved = false;
            return;
        }
        this.props.onLayout(collapseGroup(this.props.layout, group.id, !group.collapsed), true);
    }
    #group(group: PanelGroup) {
        const visible = group.panels.filter(id => !this.props.layout.closed.includes(id));
        if (!group.active || !visible.length)
            return null;
        const placement = group.placement;
        const floating = placement.kind === 'float';
        const style = floating ? { left: placement.bounds.x, top: placement.bounds.y, width: placement.bounds.width, height: group.collapsed ? 36 : placement.bounds.height } : undefined;
        return h('section', { key: group.id, class: `dock-group ${floating ? 'floating' : ''} ${group.collapsed ? 'collapsed' : ''}`, style, 'data-panel-group': group.id, 'aria-label': visible.map(id => labels[id]).join(', '), onDragOver: this.#over, onDrop: (event: DragEvent) => this.#drop(event, 'right', group) }, h('div', { class: 'dock-heading' }, h('button', { class: 'dock-handle', title: floating ? 'Arraste para mover o painel' : 'Arraste para encaixar o painel', draggable: !floating, onDragStart: (event: DragEvent) => this.#dragPanel(event, group.active!), onPointerDown: floating ? (event: PointerEvent) => this.#start(event, group, 'move') : undefined, onPointerMove: this.#move, onPointerUp: this.#end, onPointerCancel: this.#end, onLostPointerCapture: this.#end, 'aria-expanded': !group.collapsed, onClick: () => this.#toggle(group) }, labels[group.active]), h('details', { class: 'dock-actions' }, h('summary', { 'aria-label': `Opções de ${labels[group.active]}` }, '⋯'), h('div', null, ...edges.map(edge => h('button', { type: 'button', disabled: group.panels.some(id => !panelAllowsEdge(id, edge)), onClick: () => this.#place(group, { kind: 'dock', edge, size: group.active === 'tools' ? 64 : edge === 'top' || edge === 'bottom' ? 180 : 260 }) }, edgeLabels[edge])), h('button', { type: 'button', onClick: () => this.#float(group) }, 'Flutuar'), h('button', { type: 'button', onClick: () => this.props.onLayout(closePanel(this.props.layout, group.active!), true) }, 'Fechar painel')))), !group.collapsed ? h('div', { class: 'dock-body' }, visible.length > 1 ? h('div', { class: 'dock-tabs', role: 'tablist', 'aria-label': 'Painéis agrupados' }, ...visible.map(id => h('button', { type: 'button', role: 'tab', 'aria-selected': group.active === id, draggable: true, onDragStart: (event: DragEvent) => this.#dragPanel(event, id), onClick: () => this.props.onLayout(selectPanel(this.props.layout, id), true) }, labels[id]))) : null, h('div', { class: 'dock-content', 'data-panel': group.active }, this.props.panels[group.active])) : null, !group.collapsed ? h('div', { class: `dock-resizer ${floating ? 'corner' : placement.edge}`, role: 'separator', tabIndex: 0, 'aria-label': `Redimensionar ${labels[group.active]}`, 'aria-orientation': !floating && (placement.edge === 'left' || placement.edge === 'right') ? 'vertical' : 'horizontal', 'aria-valuenow': floating ? placement.bounds.width : placement.size, 'aria-valuemin': 48, 'aria-valuemax': 16384, onPointerDown: (event: PointerEvent) => this.#start(event, group, 'resize'), onPointerMove: this.#move, onPointerUp: this.#end, onPointerCancel: this.#end, onLostPointerCapture: this.#end, onKeyDown: (event: KeyboardEvent) => this.#resizeKey(event, group) }) : null);
    }
    override render() {
        return h('div', { ref: this.#root, class: 'dock-workspace', onDragOver: this.#over, onDragEnd: () => this.setState({ dragging: false }) }, ...edges.map(edge => {
            const groups = this.props.layout.groups.filter(group => group.placement.kind === 'dock' && group.placement.edge === edge && group.active !== null);
            const size = Math.min((edge === 'left' || edge === 'right' ? this.state.width : this.state.height) * .4, Math.max(0, ...groups.map(group => group.collapsed ? 36 : group.placement.kind === 'dock' ? group.placement.size : 0)));
            return h('div', { class: `dock-zone ${edge}`, 'data-dock-edge': edge, style: edge === 'left' || edge === 'right' ? { width: size } : { height: size }, onDragOver: this.#over, onDrop: (event: DragEvent) => this.#drop(event, edge) }, ...groups.map(group => this.#group(group)));
        }), h('div', { class: 'dock-center' }, this.props.children), ...this.props.layout.groups.filter(group => group.placement.kind === 'float').map(group => this.#group(group)), this.state.dragging ? edges.map(edge => h('div', { class: `dock-drop-edge ${edge}`, onDragOver: this.#over, onDrop: (event: DragEvent) => this.#drop(event, edge) }, edgeLabels[edge])) : null);
    }
}
