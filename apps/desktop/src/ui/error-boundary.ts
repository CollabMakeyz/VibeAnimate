import { Component, h } from 'preact';
import type { ComponentChildren } from 'preact';
import { recordEvent, reportError } from '../platform/native.js';
export class ErrorBoundary extends Component<{
    children?: ComponentChildren;
}, {
    failed: boolean;
    generation: number;
}> {
    override state = { failed: false, generation: 0 };
    override componentDidCatch(error: unknown): void {
        reportError(error);
        this.setState({ failed: true });
    }
    private recover = (): void => {
        void recordEvent('recovery', 'User reopened the diagnostic panel.').catch(reportError);
        this.setState(previous => ({ failed: false, generation: previous.generation + 1 }));
    };
    override render() {
        if (this.state.failed)
            return h('section', { class: 'card error', role: 'alert' }, h('h2', null, 'Não foi possível exibir este painel'), h('p', null, 'Você pode tentar abri-lo novamente. Se o problema continuar, reinicie o aplicativo.'), h('button', { onClick: this.recover }, 'Reabrir painel'));
        return h('div', { key: this.state.generation }, this.props.children);
    }
}
