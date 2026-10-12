import { Component, createRef, h } from 'preact';
import { CommandRegistry } from '../../../../packages/command-system/src/registry.js';
import { CameraNavigation } from '../../../../packages/input/src/navigation.js';
import { createBlankDocument } from '../../../../packages/document-model/src/create-document.js';
import { createCamera, centerCamera, fitCamera, orientCameraAt, panCamera, resizeCamera, zoomCameraAt } from '../../../../packages/renderer-core/src/camera.js';
import type { Point2D, ViewportSize } from '../../../../packages/renderer-core/src/camera.js';
import type { Camera } from '../../../../packages/renderer-core/src/contracts.js';
import { buildStageBackdrop } from '../../../../packages/renderer-core/src/stage-backdrop.js';
import { StageSurface } from './surface.js';
import type { StageBackend } from './surface.js';
import { reportError } from '../platform/native.js';
interface State {
    readonly camera: Camera;
    readonly backend: StageBackend | null;
    readonly grid: boolean;
    readonly gridSize: number;
    readonly tool: 'hand' | 'zoom';
    readonly error: string | null;
}
export class StageWorkspace extends Component<Record<string, never>, State> {
    readonly #document = createBlankDocument('document-start', 'Sem título 1');
    readonly #host = createRef<HTMLDivElement>();
    readonly #navigation = new CameraNavigation(createCamera());
    readonly #commands = new CommandRegistry(navigator.platform.includes('Mac') ? 'mac' : 'windows');
    #surface: StageSurface | null = null;
    #observer: ResizeObserver | null = null;
    #size: ViewportSize = { width: 1, height: 1 };
    #fitted = false;
    #frame = 0;
    #space = false;
    override state: State = { camera: this.#navigation.camera, backend: null, grid: false, gridSize: 32, tool: 'hand', error: null };
    constructor() {
        super();
        const add = (id: string, label: string, shortcuts: readonly string[], execute: () => void, checked: () => boolean | null = () => null, repeat = false): void => {
            this.#commands.register({ id, label, contexts: new Set(['stage']), defaultShortcuts: shortcuts, execute, enabled: () => this.#surface !== null, checked, allowRepeat: repeat });
        };
        add('view.fit', 'Ajustar palco', ['Primary+0'], () => this.#setCamera(fitCamera(this.#navigation.camera, this.#bounds(), this.#size, this.#padding())));
        add('view.actual', '100%', ['Primary+1'], () => this.#setCamera(zoomCameraAt(this.#navigation.camera, this.#center(), 1)));
        add('view.center', 'Centralizar', ['Primary+2'], () => this.#setCamera(centerCamera(this.#navigation.camera, this.#bounds(), this.#size)));
        add('view.zoom-in', 'Ampliar', ['Primary+=', 'Primary+Shift+Plus'], () => this.#zoom(this.#center(), 1.25), () => null, true);
        add('view.zoom-out', 'Reduzir', ['Primary+-'], () => this.#zoom(this.#center(), .8), () => null, true);
        add('view.rotate-left', 'Girar −15°', ['['], () => this.#rotate(-Math.PI / 12), () => null, true);
        add('view.rotate-right', 'Girar +15°', [']'], () => this.#rotate(Math.PI / 12), () => null, true);
        add('view.reset-rotation', 'Zerar rotação', ['Primary+Shift+R'], () => this.#setCamera(orientCameraAt(this.#navigation.camera, this.#center(), { rotationRadians: 0 })));
        add('view.mirror-x', 'Espelhar H', ['Shift+H'], () => this.#setCamera(orientCameraAt(this.#navigation.camera, this.#center(), { mirrorX: !this.#navigation.camera.mirrorX })), () => this.state.camera.mirrorX);
        add('view.mirror-y', 'Espelhar V', ['Shift+V'], () => this.#setCamera(orientCameraAt(this.#navigation.camera, this.#center(), { mirrorY: !this.#navigation.camera.mirrorY })), () => this.state.camera.mirrorY);
        add('view.grid', 'Grade', ['Primary+G'], () => this.setState(previous => ({ grid: !previous.grid })), () => this.state.grid);
        add('tool.hand', 'Mão', ['H'], () => this.setState({ tool: 'hand' }), () => this.state.tool === 'hand');
        add('tool.zoom', 'Zoom', ['Z'], () => this.setState({ tool: 'zoom' }), () => this.state.tool === 'zoom');
    }
    #bounds() { return { minX: 0, minY: 0, maxX: this.#document.stage.width, maxY: this.#document.stage.height }; }
    #center(): Point2D { return [this.#size.width / 2, this.#size.height / 2]; }
    #padding(): number { return Math.min(40, Math.min(this.#size.width, this.#size.height) / 8); }
    #setCamera(camera: Camera): void { this.#navigation.setCamera(camera); this.setState({ camera }); }
    #zoom(anchor: Point2D, factor: number): void { this.#setCamera(zoomCameraAt(this.#navigation.camera, anchor, this.#navigation.camera.zoom * factor)); }
    #rotate(delta: number): void { this.#setCamera(orientCameraAt(this.#navigation.camera, this.#center(), { rotationRadians: this.#navigation.camera.rotationRadians + delta })); }
    #position(event: MouseEvent): Point2D {
        const rect = this.#host.current!.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
    }
    override componentDidMount(): void {
        const host = this.#host.current!;
        try {
            this.#surface = new StageSurface(host, backend => this.setState({ backend }));
            this.#observer = new ResizeObserver(this.#resize);
            this.#observer.observe(host);
            host.addEventListener('wheel', this.#wheel, { passive: false });
            window.addEventListener('blur', this.#cancel);
            window.addEventListener('keyup', this.#releaseSpace);
            window.addEventListener('resize', this.#resize);
            this.#resize();
        }
        catch (error) {
            this.#fail(error);
        }
    }
    override componentWillUnmount(): void {
        cancelAnimationFrame(this.#frame);
        this.#observer?.disconnect();
        this.#surface?.dispose();
        this.#host.current?.removeEventListener('wheel', this.#wheel);
        window.removeEventListener('blur', this.#cancel);
        window.removeEventListener('keyup', this.#releaseSpace);
        window.removeEventListener('resize', this.#resize);
    }
    override componentDidUpdate(): void { this.#schedule(); }
    #fail(error: unknown): void { reportError(error); this.setState({ error: 'O palco não pôde ser renderizado. Abra o diagnóstico para consultar o ambiente.' }); }
    #resize = (): void => {
        const host = this.#host.current;
        if (!host || host.clientWidth <= 0 || host.clientHeight <= 0)
            return;
        const size = { width: host.clientWidth, height: host.clientHeight };
        const camera = createCamera({ ...this.#navigation.camera, dpr: window.devicePixelRatio || 1 });
        const next = this.#fitted ? resizeCamera(camera, this.#size, size) : fitCamera(camera, this.#bounds(), size, Math.min(40, Math.min(size.width, size.height) / 8));
        this.#size = size;
        this.#fitted = true;
        this.#setCamera(next);
    };
    #schedule(): void {
        if (this.#frame || this.state.error)
            return;
        this.#frame = requestAnimationFrame(() => {
            this.#frame = 0;
            try {
                this.#surface?.draw(buildStageBackdrop({ stage: this.#document.stage, camera: this.#navigation.camera, size: this.#size, pasteboard: [.105, .12, .155, 1], gridColor: [.32, .37, .48, .24], gridSize: this.state.gridSize, showGrid: this.state.grid }), this.#navigation.camera.dpr);
            }
            catch (error) {
                this.#fail(error);
            }
        });
    }
    #wheel = (event: WheelEvent): void => {
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.#size.height : 1;
        if (event.ctrlKey || event.metaKey)
            this.#zoom(this.#position(event), Math.exp(Math.max(-4, Math.min(4, -event.deltaY * unit * .002))));
        else if (event.altKey)
            this.#setCamera(orientCameraAt(this.#navigation.camera, this.#position(event), { rotationRadians: this.#navigation.camera.rotationRadians + event.deltaY * unit * .002 }));
        else
            this.#setCamera(panCamera(this.#navigation.camera, [-event.deltaX * unit, -event.deltaY * unit]));
    };
    #down = (event: PointerEvent): void => {
        if (event.button !== 0 && event.button !== 1)
            return;
        const host = this.#host.current!;
        host.focus({ preventScroll: true });
        event.preventDefault();
        if (event.pointerType !== 'touch' && event.button === 0 && this.state.tool === 'zoom' && !this.#space) {
            this.#zoom(this.#position(event), event.altKey || event.shiftKey ? .5 : 2);
            return;
        }
        if (this.#navigation.begin(event.pointerId, this.#position(event)))
            host.setPointerCapture(event.pointerId);
    };
    #move = (event: PointerEvent): void => {
        const camera = this.#navigation.move(event.pointerId, this.#position(event));
        if (camera)
            this.setState({ camera });
    };
    #up = (event: PointerEvent): void => {
        this.#navigation.end(event.pointerId);
        if (this.#host.current?.hasPointerCapture(event.pointerId))
            this.#host.current.releasePointerCapture(event.pointerId);
    };
    #cancel = (): void => { this.#space = false; this.#navigation.cancel(); };
    #releaseSpace = (event: KeyboardEvent): void => {
        if (event.key === ' ')
            this.#space = false;
    };
    #keyDown = (event: KeyboardEvent): void => {
        const target = event.target;
        const context = target instanceof Element && target.closest('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"])') ? 'inputField' : 'stage';
        if (context === 'stage' && event.key === ' ' && !event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey) {
            this.#space = true;
            event.preventDefault();
            return;
        }
        const result = this.#commands.handle({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, shiftKey: event.shiftKey, repeat: event.repeat, isComposing: event.isComposing, altGraphKey: event.getModifierState('AltGraph') }, context);
        if (result.handled)
            event.preventDefault();
    };
    #button(id: string) {
        const command = this.#commands.state(id, 'stage');
        return h('button', { type: 'button', 'data-command': id, disabled: !command.enabled, 'aria-pressed': command.checked ?? undefined, title: command.shortcuts.join(' / '), onClick: () => this.#commands.execute(id, 'stage') }, command.label);
    }
    override render() {
        const { camera, backend, gridSize, tool, error } = this.state;
        const degrees = camera.rotationRadians * 180 / Math.PI;
        return h('section', { class: 'stage-workspace', 'aria-label': 'Palco de animação', onKeyDown: this.#keyDown, onKeyUp: (event: KeyboardEvent) => {
                if (event.key === ' ')
                    this.#space = false;
            } }, h('div', { class: 'stage-document' }, h('strong', null, this.#document.title), h('span', null, `${this.#document.stage.width} × ${this.#document.stage.height} px · ${this.#document.fps.numerator} fps`)), h('div', { class: 'stage-toolbar', role: 'toolbar', 'aria-label': 'Câmera do palco' }, this.#button('tool.hand'), this.#button('tool.zoom'), h('span', { class: 'toolbar-divider' }), this.#button('view.fit'), this.#button('view.actual'), this.#button('view.center'), this.#button('view.zoom-out'), this.#button('view.zoom-in'), this.#button('view.rotate-left'), this.#button('view.rotate-right'), this.#button('view.reset-rotation'), this.#button('view.mirror-x'), this.#button('view.mirror-y'), this.#button('view.grid')), h('div', { class: 'stage-settings' }, h('label', null, 'Grade (px) ', h('input', { type: 'number', min: 1, max: 65536, value: gridSize, onChange: (event: Event) => {
                const value = Number((event.currentTarget as HTMLInputElement).value);
                if (Number.isFinite(value) && value >= 1 && value <= 65536)
                    this.setState({ gridSize: value });
                else
                    (event.currentTarget as HTMLInputElement).value = String(gridSize);
            } })), h('label', null, 'Renderização ', h('select', { value: backend ?? 'webgl2', onChange: (event: Event) => {
                try {
                    this.#surface?.useBackend((event.currentTarget as HTMLSelectElement).value as StageBackend);
                }
                catch (error) {
                    this.#fail(error);
                }
            } }, h('option', { value: 'webgl2' }, 'WebGL 2'), h('option', { value: 'canvas2d' }, 'Canvas 2D')))), h('div', { ref: this.#host, class: `stage-surface tool-${tool}`, tabIndex: 0, role: 'application', 'aria-label': 'Palco. Arraste para mover. Control ou Command mais rolagem amplia no cursor.', onPointerDown: this.#down, onPointerMove: this.#move, onPointerUp: this.#up, onPointerCancel: this.#up, onLostPointerCapture: this.#up, onContextMenu: (event: MouseEvent) => event.preventDefault() }), error ? h('p', { role: 'alert', class: 'stage-error' }, error) : null, h('div', { class: 'stage-status', role: 'status', 'aria-live': 'off' }, h('output', { id: 'camera-status', 'data-zoom': camera.zoom, 'data-x': camera.translation[0], 'data-y': camera.translation[1], 'data-rotation': camera.rotationRadians, 'data-mirror-x': camera.mirrorX, 'data-mirror-y': camera.mirrorY }, `${(camera.zoom * 100).toFixed(1)}% · ${degrees.toFixed(0)}° · ${backend === 'webgl2' ? 'WebGL 2' : backend === 'canvas2d' ? 'Canvas 2D' : 'Inicializando'}`), h('span', null, 'Arrastar: mover · Ctrl/⌘ + rolagem: zoom · Alt + rolagem: girar')), h('p', { class: 'stage-note' }, 'Navegação do palco disponível. Desenho, edição da timeline e arquivos de projeto ainda estão em desenvolvimento.'));
    }
}
