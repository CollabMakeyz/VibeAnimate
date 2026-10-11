import { Component, h } from 'preact';
import { detectCapabilities } from '../platform/capabilities.js';
import type { CapabilityReport } from '../platform/capabilities.js';
import { readLogs, recordEvent, reportError, runtimeInfo } from '../platform/native.js';
import type { RuntimeInfo } from '../platform/native.js';
interface State {
    readonly busy: boolean;
    readonly native: RuntimeInfo | null;
    readonly capabilities: CapabilityReport | null;
    readonly failure: string | null;
    readonly logs: string | null;
}
const availability = (value: boolean) => value ? 'Disponível' : 'Indisponível';
const fact = (label: string, value: string) => h('div', { class: 'fact' }, h('dt', null, label), h('dd', null, value));
export class Application extends Component<Record<string, never>, State> {
    override state: State = { busy: true, native: null, capabilities: null, failure: null, logs: null };
    private mounted = false;
    private running = false;
    override componentDidMount(): void { this.mounted = true; void this.refresh(true); }
    override componentWillUnmount(): void { this.mounted = false; }
    private refresh = async (initial = false): Promise<void> => {
        if (this.running)
            return;
        this.running = true;
        this.setState({ busy: true, failure: null });
        try {
            const native = await runtimeInfo();
            const capabilities = detectCapabilities();
            await recordEvent(initial ? 'frontend_ready' : 'diagnostics_requested', initial ? 'Desktop interface ready.' : 'User refreshed capability diagnostics.');
            if (this.mounted)
                this.setState({ native, capabilities });
        }
        catch (error) {
            reportError(error);
            if (this.mounted)
                this.setState({ failure: 'Não foi possível concluir o diagnóstico. Tente novamente.', native: null, capabilities: null });
        }
        finally {
            this.running = false;
            if (this.mounted)
                this.setState({ busy: false });
        }
    };
    private showLogs = async (): Promise<void> => {
        try {
            const logs = await readLogs();
            if (this.mounted)
                this.setState({ logs, failure: null });
        }
        catch (error) {
            reportError(error);
            if (this.mounted)
                this.setState({ failure: 'O registro local não está disponível.' });
        }
    };
    override render() {
        const { busy, native, capabilities: c, failure, logs } = this.state;
        return h('main', null, h('header', { class: 'topbar' }, h('a', { class: 'brand', href: '#main-content', 'aria-label': 'VibeAnimate — ir ao conteúdo' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'V'), 'VibeAnimate'), h('span', { class: 'badge' }, 'Fundação • M1')), h('div', { class: 'content', id: 'main-content' }, h('section', { class: 'intro' }, h('p', { class: 'eyebrow' }, 'ANIMAÇÃO, EM CONSTRUÇÃO'), h('h1', null, 'Um novo espaço para dar vida às ideias.'), h('p', { class: 'lead' }, 'Esta versão verifica a base nativa do VibeAnimate. As ferramentas de desenho e animação ainda estão em desenvolvimento.')), h('section', { class: 'card', 'aria-labelledby': 'diagnostic-title', 'aria-busy': busy }, h('div', { class: 'card-heading' }, h('div', null, h('h2', { id: 'diagnostic-title' }, 'Seu ambiente'), h('p', { role: 'status', id: 'runtime-status' }, busy ? 'Verificando recursos…' : native ? 'Conexão com o aplicativo nativo confirmada.' : 'Diagnóstico incompleto.')), h('button', { onClick: () => { void this.refresh(); }, disabled: busy }, 'Atualizar diagnóstico')), failure ? h('p', { class: 'error-message', role: 'alert' }, failure) : null, native && c ? h('dl', { class: 'facts' }, fact('Aplicativo', `VibeAnimate ${native.version}`), fact('Sistema', `${native.os} · ${native.architecture}`), fact('Contexto gráfico', c.graphics === 'webgl2' ? 'WebGL 2' : c.graphics === 'canvas2d' ? 'Canvas 2D (alternativa)' : 'Indisponível'), fact('Escala da tela', `${c.devicePixelRatio}×`), fact('Eventos de ponteiro', availability(c.pointerEvents)), fact('Eventos agrupados', availability(c.coalescedEvents)), fact('Previsão de eventos', availability(c.predictedEvents)), fact('Atualização bruta', availability(c.pointerRawUpdate)), fact('API de workers', availability(c.workerApi)), fact('API OffscreenCanvas', availability(c.offscreenCanvasApi))) : null, h('p', { class: 'note' }, 'A presença de uma API não comprova suporte da mesa digitalizadora. Pressão, inclinação e borracha ainda precisam de validação física.')), h('section', { class: 'card compact', 'aria-labelledby': 'log-title' }, h('div', { class: 'card-heading' }, h('div', null, h('h2', { id: 'log-title' }, 'Registro da sessão'), h('p', null, 'Diagnósticos locais, com limite de tamanho e rotação automática.')), h('button', { class: 'secondary', onClick: () => { void this.showLogs(); } }, 'Consultar registro')), logs !== null ? h('pre', { tabIndex: 0, 'aria-label': 'Eventos de diagnóstico', class: 'log-output' }, logs) : null), h('footer', null, 'VibeAnimate · interface original · projeto em desenvolvimento')));
    }
}
