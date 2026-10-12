import type { Camera } from '../../renderer-core/src/contracts.js';
import type { Point2D } from '../../renderer-core/src/camera.js';
import { createCamera, orientCameraAt, panCamera, MIN_ZOOM, MAX_ZOOM } from '../../renderer-core/src/camera.js';
function point(value: Point2D): Point2D {
    if (!value.every(Number.isFinite) || value.length !== 2)
        throw new RangeError('Invalid navigation point');
    return [value[0], value[1]];
}
export class CameraNavigation {
    #camera: Camera;
    readonly #pointers = new Map<number, Point2D>();
    constructor(camera: Camera) { this.#camera = createCamera(camera); }
    get camera(): Camera { return this.#camera; }
    get pointerCount(): number { return this.#pointers.size; }
    setCamera(camera: Camera): void { this.#camera = createCamera(camera); }
    begin(id: number, position: Point2D): boolean {
        if (!Number.isInteger(id))
            throw new TypeError('Pointer ID must be an integer');
        const next = point(position);
        if (this.#pointers.has(id) || this.#pointers.size >= 2)
            return false;
        this.#pointers.set(id, next);
        return true;
    }
    move(id: number, position: Point2D): Camera | null {
        const next = point(position), before = this.#pointers.get(id);
        if (!before)
            return null;
        const other = [...this.#pointers].find(([key]) => key !== id)?.[1];
        if (!other)
            this.#camera = panCamera(this.#camera, [next[0] - before[0], next[1] - before[1]]);
        else {
            const oldCenter: Point2D = [(before[0] + other[0]) / 2, (before[1] + other[1]) / 2];
            const newCenter: Point2D = [(next[0] + other[0]) / 2, (next[1] + other[1]) / 2];
            const oldDistance = Math.hypot(before[0] - other[0], before[1] - other[1]);
            const newDistance = Math.hypot(next[0] - other[0], next[1] - other[1]);
            if (oldDistance >= 4 && newDistance >= 4) {
                const angle = Math.atan2(next[1] - other[1], next[0] - other[0]) - Math.atan2(before[1] - other[1], before[0] - other[0]);
                const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.#camera.zoom * newDistance / oldDistance));
                this.#camera = orientCameraAt(this.#camera, oldCenter, { zoom, rotationRadians: this.#camera.rotationRadians + angle });
            }
            this.#camera = panCamera(this.#camera, [newCenter[0] - oldCenter[0], newCenter[1] - oldCenter[1]]);
        }
        this.#pointers.set(id, next);
        return this.#camera;
    }
    end(id: number): void { this.#pointers.delete(id); }
    cancel(): void { this.#pointers.clear(); }
}
