import { Component, h } from 'preact';
import { Application } from './application.js';
import { StageWorkspace } from '../stage/workspace.js';
import { ErrorBoundary } from './error-boundary.js';
export class Editor extends Component<Record<string, never>, {
    page: 'stage' | 'diagnostics';
}> {
    override state: {
        page: 'stage' | 'diagnostics';
    } = { page: 'stage' };
    override render() {
        return h('div', { class: 'editor' }, h('header', { class: 'editor-header' }, h('a', { class: 'brand', href: '#stage-page' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'V'), 'VibeAnimate'), h('nav', { 'aria-label': 'Áreas do aplicativo' }, h('button', { id: 'open-stage', 'aria-pressed': this.state.page === 'stage', onClick: () => this.setState({ page: 'stage' }) }, 'Palco'), h('button', { id: 'open-diagnostics', 'aria-pressed': this.state.page === 'diagnostics', onClick: () => this.setState({ page: 'diagnostics' }) }, 'Diagnóstico')), h('span', { class: 'badge' }, 'M2 · em desenvolvimento')), h('div', { id: 'stage-page', hidden: this.state.page !== 'stage' }, h(ErrorBoundary, null, h(StageWorkspace, null))), h('div', { id: 'diagnostics-page', hidden: this.state.page !== 'diagnostics' }, h(ErrorBoundary, null, h(Application, null))));
    }
}
