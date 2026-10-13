import { Component, h } from 'preact';
import { Application } from './application.js';
import { StageWorkspace } from '../stage/workspace.js';
import { ErrorBoundary } from './error-boundary.js';
import { CommandRegistry } from '../../../../packages/command-system/src/registry.js';
import { DocumentTabs } from '../../../../packages/workspace/src/document-tabs.js';
import type { Camera } from '../../../../packages/renderer-core/src/contracts.js';
import type { ViewportSize } from '../../../../packages/renderer-core/src/camera.js';
interface State {
    readonly page: 'stage' | 'diagnostics';
    readonly revision: number;
}
export class Editor extends Component<Record<string, never>, State> {
    readonly #tabs = new DocumentTabs();
    readonly #commands = new CommandRegistry(navigator.platform.includes('Mac') ? 'mac' : 'windows');
    override state: State = { page: 'stage', revision: 0 };
    constructor() {
        super();
        this.#tabs.create(`document-${crypto.randomUUID()}`);
        this.#commands.register({ id: 'document.new', label: 'Novo documento', contexts: new Set(['global', 'inputField']), defaultShortcuts: ['Primary+N'], enabled: () => this.#tabs.canCreate, checked: () => null, execute: this.#newDocument });
        this.#commands.register({ id: 'document.close', label: 'Fechar documento', contexts: new Set(['global']), defaultShortcuts: ['Primary+W'], enabled: () => this.#tabs.active !== null, checked: () => null, execute: () => {
                const active = this.#tabs.active;
                if (active)
                    this.#close(active.document.id);
            } });
    }
    override componentDidMount(): void { window.addEventListener('keydown', this.#key); }
    override componentWillUnmount(): void { window.removeEventListener('keydown', this.#key); }
    #refresh(): void { this.setState(previous => ({ revision: previous.revision + 1 })); }
    #newDocument = (): void => {
        this.#tabs.create(`document-${crypto.randomUUID()}`);
        this.setState(previous => ({ page: 'stage', revision: previous.revision + 1 }));
    };
    #close(id: string): void { this.#tabs.close(id); this.#refresh(); }
    #select(id: string): void { this.#tabs.select(id); this.#refresh(); }
    #rememberView = (id: string, camera: Camera, size: ViewportSize): void => { this.#tabs.rememberView(id, camera, size); };
    #tabKey = (event: KeyboardEvent): void => {
        const tabs = this.#tabs.tabs;
        const active = this.#tabs.active;
        if (!active || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return;
        event.preventDefault();
        event.stopPropagation();
        const current = tabs.findIndex(tab => tab.document.id === active.document.id);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        const id = tabs[index]!.document.id;
        this.#select(id);
        document.getElementById(`tab-${id}`)?.focus();
    };
    #key = (event: KeyboardEvent): void => {
        if (event.defaultPrevented)
            return;
        const target = event.target;
        const context = target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ? 'inputField' : 'global';
        const result = this.#commands.handle({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, shiftKey: event.shiftKey, repeat: event.repeat, isComposing: event.isComposing, altGraphKey: event.getModifierState('AltGraph') }, context);
        if (result.handled)
            event.preventDefault();
    };
    override render() {
        const active = this.#tabs.active;
        return h('div', { class: 'editor' }, h('header', { class: 'editor-header' }, h('a', { class: 'brand', href: '#stage-page', onClick: (event: MouseEvent) => { event.preventDefault(); this.setState({ page: 'stage' }); } }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'V'), 'VibeAnimate'), h('nav', { 'aria-label': 'Áreas do aplicativo' }, h('button', { id: 'open-stage', 'aria-pressed': this.state.page === 'stage', onClick: () => this.setState({ page: 'stage' }) }, 'Palco'), h('button', { id: 'open-diagnostics', 'aria-pressed': this.state.page === 'diagnostics', onClick: () => this.setState({ page: 'diagnostics' }) }, 'Diagnóstico')), h('span', { class: 'badge' }, 'M2 · em desenvolvimento')), h('div', { id: 'stage-page', hidden: this.state.page !== 'stage' }, h('div', { class: 'document-tabs' }, h('div', { role: 'tablist', 'aria-label': 'Documentos abertos', onKeyDown: this.#tabKey }, ...this.#tabs.tabs.map(tab => h('div', { class: 'document-tab', key: tab.document.id }, h('button', { type: 'button', role: 'tab', id: `tab-${tab.document.id}`, 'data-document-id': tab.document.id, 'aria-selected': active?.document.id === tab.document.id, 'aria-controls': 'document-viewport', tabIndex: active?.document.id === tab.document.id ? 0 : -1, onClick: () => this.#select(tab.document.id) }, tab.document.title), h('button', { type: 'button', class: 'close-document', 'aria-label': `Fechar ${tab.document.title}`, onClick: () => this.#close(tab.document.id) }, '×')))), h('button', { id: 'new-document', type: 'button', disabled: !this.#tabs.canCreate, title: 'Novo documento (Ctrl/Command+N)', onClick: () => this.#commands.execute('document.new', 'global') }, '+ Novo')), active ? h('div', { id: 'document-viewport', role: 'tabpanel', 'aria-labelledby': `tab-${active.document.id}` }, h(ErrorBoundary, null, h(StageWorkspace, { document: active.document, view: active.view, commands: this.#commands, onView: this.#rememberView }))) : h('section', { class: 'empty-workspace' }, h('h1', null, 'Nenhum documento aberto'), h('button', { onClick: () => this.#commands.execute('document.new', 'global') }, 'Criar documento'))), h('div', { id: 'diagnostics-page', hidden: this.state.page !== 'diagnostics' }, h(ErrorBoundary, null, h(Application, null))));
    }
}
