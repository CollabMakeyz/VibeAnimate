import type { StageBackdrop } from '../../../../packages/renderer-core/src/stage-backdrop.js';
import { packBackdropTriangles } from '../../../../packages/renderer-core/src/stage-backdrop.js';
export type StageBackend = 'webgl2' | 'canvas2d';
interface Painter {
    paint(frame: StageBackdrop, width: number, height: number): void;
    dispose(): void;
}
function cssColor(color: readonly number[]): string { return `rgba(${color[0]! * 255},${color[1]! * 255},${color[2]! * 255},${color[3]})`; }
class CanvasPainter implements Painter {
    readonly #context: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d', { alpha: false });
        if (!context)
            throw new Error('Canvas2D is unavailable');
        this.#context = context;
    }
    paint(frame: StageBackdrop, width: number, height: number): void {
        const ctx = this.#context;
        ctx.setTransform(width / frame.size.width, 0, 0, height / frame.size.height, 0, 0);
        ctx.fillStyle = cssColor(frame.background);
        ctx.fillRect(0, 0, frame.size.width, frame.size.height);
        for (const polygon of frame.polygons) {
            ctx.beginPath();
            polygon.points.forEach((point, i) => i === 0 ? ctx.moveTo(...point) : ctx.lineTo(...point));
            ctx.closePath();
            ctx.fillStyle = cssColor(polygon.color);
            ctx.fill();
        }
    }
    dispose(): void { this.#context.canvas.width = 1; this.#context.canvas.height = 1; }
}
class WebGLPainter implements Painter {
    readonly #gl: WebGL2RenderingContext;
    readonly #program: WebGLProgram;
    readonly #buffer: WebGLBuffer;
    readonly #array: WebGLVertexArrayObject;
    readonly #viewport: WebGLUniformLocation;
    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: false, stencil: false });
        if (!gl)
            throw new Error('WebGL2 is unavailable');
        this.#gl = gl;
        const shaders: WebGLShader[] = [];
        const program = gl.createProgram(), buffer = gl.createBuffer(), array = gl.createVertexArray();
        try {
            if (!program || !buffer || !array)
                throw new Error('WebGL allocation failed');
            for (const [type, source] of [
                [gl.VERTEX_SHADER, '#version 300 es\nlayout(location=0) in vec2 point; layout(location=1) in vec4 color; uniform vec2 viewport; out vec4 fill; void main(){vec2 p=point/viewport*2.0-1.0;gl_Position=vec4(p.x,-p.y,0.0,1.0);fill=color;}'],
                [gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float; in vec4 fill; out vec4 result; void main(){result=fill;}'],
            ] as const) {
                const shader = gl.createShader(type);
                if (!shader)
                    throw new Error('WebGL shader allocation failed');
                shaders.push(shader);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                    throw new Error(`Stage shader compilation failed: ${gl.getShaderInfoLog(shader)}`);
                gl.attachShader(program, shader);
            }
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS))
                throw new Error(`Stage shader link failed: ${gl.getProgramInfoLog(program)}`);
            const viewport = gl.getUniformLocation(program, 'viewport');
            if (!viewport)
                throw new Error('Stage shader viewport missing');
            gl.bindVertexArray(array);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);
            this.#program = program;
            this.#buffer = buffer;
            this.#array = array;
            this.#viewport = viewport;
        }
        catch (error) {
            gl.deleteProgram(program);
            gl.deleteBuffer(buffer);
            gl.deleteVertexArray(array);
            gl.getExtension('WEBGL_lose_context')?.loseContext();
            throw error;
        }
        finally {
            shaders.forEach(shader => gl.deleteShader(shader));
        }
    }
    paint(frame: StageBackdrop, width: number, height: number): void {
        const gl = this.#gl;
        if (gl.isContextLost())
            throw new Error('Stage WebGL context lost');
        gl.viewport(0, 0, width, height);
        gl.clearColor(...frame.background);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.#program);
        gl.bindVertexArray(this.#array);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffer);
        const vertices = packBackdropTriangles(frame);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        gl.uniform2f(this.#viewport, frame.size.width, frame.size.height);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);
    }
    dispose(): void {
        this.#gl.deleteBuffer(this.#buffer);
        this.#gl.deleteVertexArray(this.#array);
        this.#gl.deleteProgram(this.#program);
        this.#gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
export class StageSurface {
    readonly #host: HTMLElement;
    readonly #changed: (backend: StageBackend) => void;
    #canvas!: HTMLCanvasElement;
    #painter!: Painter;
    #backend: StageBackend = 'canvas2d';
    #last: {
        frame: StageBackdrop;
        dpr: number;
    } | null = null;
    #disposed = false;
    constructor(host: HTMLElement, changed: (backend: StageBackend) => void, prefer: StageBackend = 'webgl2') {
        this.#host = host;
        this.#changed = changed;
        this.#install(prefer);
    }
    get backend(): StageBackend { return this.#backend; }
    #lost = (event: Event): void => {
        event.preventDefault();
        if (!this.#disposed)
            this.useBackend('canvas2d');
    };
    #install(prefer: StageBackend): void {
        let canvas = document.createElement('canvas');
        let painter: Painter;
        let backend: StageBackend = prefer;
        if (prefer === 'webgl2') {
            try {
                painter = new WebGLPainter(canvas);
            }
            catch {
                canvas = document.createElement('canvas');
                painter = new CanvasPainter(canvas);
                backend = 'canvas2d';
            }
        }
        else
            painter = new CanvasPainter(canvas);
        canvas.setAttribute('aria-hidden', 'true');
        canvas.dataset.backend = backend;
        canvas.addEventListener('webglcontextlost', this.#lost);
        this.#canvas?.removeEventListener('webglcontextlost', this.#lost);
        this.#painter?.dispose();
        this.#canvas = canvas;
        this.#painter = painter;
        this.#backend = backend;
        this.#host.replaceChildren(canvas);
        this.#changed(backend);
    }
    useBackend(backend: StageBackend): void {
        if (this.#disposed)
            throw new Error('Stage surface is disposed');
        this.#install(backend);
        if (this.#last)
            this.draw(this.#last.frame, this.#last.dpr);
    }
    draw(frame: StageBackdrop, dpr: number): void {
        if (this.#disposed)
            throw new Error('Stage surface is disposed');
        if (!Number.isFinite(dpr) || dpr <= 0)
            throw new RangeError('Invalid Stage display scale');
        this.#last = { frame, dpr };
        // Bound backing memory to 16M pixels and each dimension to 8192; logical
        // camera/pointer coordinates never change when backing quality is capped.
        const ratio = Math.min(dpr, 8192 / frame.size.width, 8192 / frame.size.height, Math.sqrt(16777216 / (frame.size.width * frame.size.height)));
        const width = Math.max(1, Math.floor(frame.size.width * ratio)), height = Math.max(1, Math.floor(frame.size.height * ratio));
        if (this.#canvas.width !== width)
            this.#canvas.width = width;
        if (this.#canvas.height !== height)
            this.#canvas.height = height;
        try {
            this.#painter.paint(frame, width, height);
        }
        catch (error) {
            if (this.#backend !== 'webgl2')
                throw error;
            this.useBackend('canvas2d');
        }
    }
    dispose(): void {
        if (this.#disposed)
            return;
        this.#disposed = true;
        this.#canvas.removeEventListener('webglcontextlost', this.#lost);
        this.#painter.dispose();
        this.#canvas.remove();
        this.#last = null;
    }
}
