import type { Color, Stage } from '../../document-model/src/dto.js';
import type { Camera } from './contracts.js';
import { screenToWorld, worldToScreen } from './camera.js';
import type { Point2D, ViewportSize } from './camera.js';
export interface SurfacePolygon {
    readonly points: readonly Point2D[];
    readonly color: Color;
}
export interface StageBackdrop {
    readonly size: ViewportSize;
    readonly background: Color;
    readonly polygons: readonly SurfacePolygon[];
    readonly displayedGridSize: number | null;
}
export interface StageBackdropOptions {
    readonly stage: Stage;
    readonly camera: Camera;
    readonly size: ViewportSize;
    readonly pasteboard: Color;
    readonly gridColor: Color;
    readonly gridSize: number;
    readonly showGrid: boolean;
}
function color(value: Color): void {
    if (value.length !== 4 || value.some(channel => !Number.isFinite(channel) || channel < 0 || channel > 1))
        throw new RangeError('Invalid backdrop color');
}
// Clip in float64 CSS coordinates before packing float32 vertices. A huge zoomed
// Stage therefore never sends million-pixel coordinates to the GPU.
export function clipSurfacePolygon(points: readonly Point2D[], size: ViewportSize): readonly Point2D[] {
    let output = [...points];
    const planes: readonly (readonly [
        number,
        number,
        number
    ])[] = [[1, 0, 0], [-1, 0, size.width], [0, 1, 0], [0, -1, size.height]];
    for (const [a, b, c] of planes) {
        const input = output;
        output = [];
        if (!input.length)
            break;
        let previous = input[input.length - 1]!;
        let before = a * previous[0] + b * previous[1] + c;
        for (const current of input) {
            const after = a * current[0] + b * current[1] + c;
            if ((before >= 0) !== (after >= 0)) {
                const t = before / (before - after);
                output.push([previous[0] + t * (current[0] - previous[0]), previous[1] + t * (current[1] - previous[1])]);
            }
            if (after >= 0)
                output.push(current);
            previous = current;
            before = after;
        }
    }
    return output;
}
export function buildStageBackdrop(options: StageBackdropOptions): StageBackdrop {
    const { stage, camera, size, pasteboard, gridColor } = options;
    if (![size.width, size.height].every(value => Number.isFinite(value) && value > 0 && value <= 32768))
        throw new RangeError('Invalid Stage viewport');
    if (![stage.width, stage.height].every(value => Number.isInteger(value) && value >= 1 && value <= 65536))
        throw new RangeError('Invalid Stage dimensions');
    if (!Number.isFinite(options.gridSize) || options.gridSize < 1 || options.gridSize > 65536)
        throw new RangeError('Invalid grid spacing');
    color(stage.background);
    color(pasteboard);
    color(gridColor);
    if (pasteboard[3] !== 1)
        throw new RangeError('Pasteboard must be opaque');
    const polygons: SurfacePolygon[] = [];
    const add = (points: readonly Point2D[], fill: Color): void => {
        const clipped = clipSurfacePolygon(points.map(point => worldToScreen(camera, point)), size);
        if (clipped.length >= 3)
            polygons.push({ points: clipped, color: fill });
    };
    add([[0, 0], [stage.width, 0], [stage.width, stage.height], [0, stage.height]], stage.background);
    let displayedGridSize: number | null = null;
    if (options.showGrid) {
        // Display only power-of-two multiples of the authored snap interval when
        // zoomed out; this bounds work and avoids a solid mass of subpixel lines.
        const multiplier = 2 ** Math.max(0, Math.ceil(Math.log2(12 / (options.gridSize * camera.zoom))));
        const step = options.gridSize * multiplier;
        displayedGridSize = step;
        const corners: readonly Point2D[] = [[0, 0], [size.width, 0], [size.width, size.height], [0, size.height]];
        const visible = corners.map(p => screenToWorld(camera, p));
        const minX = Math.max(0, Math.min(...visible.map(p => p[0]))), maxX = Math.min(stage.width, Math.max(...visible.map(p => p[0])));
        const minY = Math.max(0, Math.min(...visible.map(p => p[1]))), maxY = Math.min(stage.height, Math.max(...visible.map(p => p[1])));
        const half = .5 / camera.zoom;
        // Grid strokes are built in world space so rotation/mirrors cannot detach
        // them from Stage. They are clipped to the Stage before viewport clipping.
        for (let x = Math.ceil(minX / step) * step; x <= maxX; x += step) {
            add([[Math.max(0, x - half), 0], [Math.min(stage.width, x + half), 0], [Math.min(stage.width, x + half), stage.height], [Math.max(0, x - half), stage.height]], gridColor);
        }
        for (let y = Math.ceil(minY / step) * step; y <= maxY; y += step) {
            add([[0, Math.max(0, y - half)], [stage.width, Math.max(0, y - half)], [stage.width, Math.min(stage.height, y + half)], [0, Math.min(stage.height, y + half)]], gridColor);
        }
    }
    return { size, background: pasteboard, polygons, displayedGridSize };
}
export function packBackdropTriangles(frame: StageBackdrop): Float32Array {
    const values: number[] = [];
    for (const polygon of frame.polygons) {
        const first = polygon.points[0];
        if (!first)
            continue;
        for (let i = 1; i + 1 < polygon.points.length; i++) {
            for (const point of [first, polygon.points[i]!, polygon.points[i + 1]!])
                values.push(point[0], point[1], ...polygon.color);
        }
    }
    return new Float32Array(values);
}
