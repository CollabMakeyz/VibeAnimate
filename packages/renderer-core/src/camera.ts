import type { Camera } from './contracts.js';
import type { Bounds } from '../../shared/src/contracts.js';
export type Point2D = readonly [
    number,
    number
];
export interface ViewportSize {
    readonly width: number;
    readonly height: number;
}
export interface CameraOrientation {
    readonly zoom?: number;
    readonly rotationRadians?: number;
    readonly mirrorX?: boolean;
    readonly mirrorY?: boolean;
}
// Small enough to fit the format's maximum 65,536-pixel Stage in small panes.
export const MIN_ZOOM = 1 / 65536;
export const MAX_ZOOM = 256;
function finite(value: number): void {
    if (!Number.isFinite(value))
        throw new RangeError('Camera coordinates must be finite');
}
function point(value: Point2D): void { finite(value[0]); finite(value[1]); }
function viewport(value: ViewportSize): void {
    finite(value.width);
    finite(value.height);
    if (value.width <= 0 || value.height <= 0)
        throw new RangeError('Viewport must have positive dimensions');
}
function bounds(value: Bounds): void {
    point([value.minX, value.minY]);
    point([value.maxX, value.maxY]);
    if (value.minX >= value.maxX || value.minY >= value.maxY)
        throw new RangeError('Stage bounds must have positive dimensions');
}
function validate(camera: Camera): void {
    point(camera.translation);
    finite(camera.zoom);
    finite(camera.rotationRadians);
    finite(camera.dpr);
    if (camera.zoom < MIN_ZOOM || camera.zoom > MAX_ZOOM)
        throw new RangeError('Camera zoom outside supported range');
    if (camera.dpr <= 0)
        throw new RangeError('Device pixel ratio must be positive');
    if (typeof camera.mirrorX !== 'boolean' || typeof camera.mirrorY !== 'boolean')
        throw new TypeError('Camera mirrors must be boolean');
}
export function createCamera(options: Partial<Camera> = {}): Camera {
    const camera = { translation: [0, 0] as Point2D, zoom: 1, rotationRadians: 0, mirrorX: false, mirrorY: false, dpr: 1, ...options };
    validate(camera);
    // Normalize angles to keep long-running rotation gestures well conditioned.
    const angle = camera.rotationRadians;
    const turn = 2 * Math.PI;
    const rotationRadians = angle >= 0 && angle < turn ? angle : ((angle % turn) + turn) % turn;
    return Object.freeze({ ...camera, rotationRadians, translation: Object.freeze([...camera.translation]) as Point2D });
}
// Mirror in world axes, then rotate, then translate. All screen values are CSS
// pixels; dpr belongs only to the backing-store transform, never pointer math.
export function cameraMatrix(camera: Camera, backingStore = false): readonly [
    number,
    number,
    number,
    number,
    number,
    number
] {
    validate(camera);
    const scale = camera.zoom * (backingStore ? camera.dpr : 1);
    const c = Math.cos(camera.rotationRadians), s = Math.sin(camera.rotationRadians);
    const x = camera.mirrorX ? -scale : scale, y = camera.mirrorY ? -scale : scale;
    const dpr = backingStore ? camera.dpr : 1;
    const matrix = [c * x, s * x, -s * y, c * y, camera.translation[0] * dpr, camera.translation[1] * dpr] as const;
    matrix.forEach(finite);
    return matrix;
}
export function worldToScreen(camera: Camera, world: Point2D): Point2D {
    point(world);
    const [a, b, c, d, e, f] = cameraMatrix(camera);
    const result: Point2D = [a * world[0] + c * world[1] + e, b * world[0] + d * world[1] + f];
    point(result);
    return result;
}
export function screenToWorld(camera: Camera, screen: Point2D): Point2D {
    validate(camera);
    point(screen);
    const x = (screen[0] - camera.translation[0]) / camera.zoom;
    const y = (screen[1] - camera.translation[1]) / camera.zoom;
    const c = Math.cos(camera.rotationRadians), s = Math.sin(camera.rotationRadians);
    const result: Point2D = [(c * x + s * y) * (camera.mirrorX ? -1 : 1), (-s * x + c * y) * (camera.mirrorY ? -1 : 1)];
    point(result);
    return result;
}
export function panCamera(camera: Camera, deltaCss: Point2D): Camera {
    validate(camera);
    point(deltaCss);
    return createCamera({ ...camera, translation: [camera.translation[0] + deltaCss[0], camera.translation[1] + deltaCss[1]] });
}
export function orientCameraAt(camera: Camera, anchorCss: Point2D, orientation: CameraOrientation): Camera {
    const world = screenToWorld(camera, anchorCss);
    const next = createCamera({ ...camera, ...orientation });
    const mapped = worldToScreen(next, world);
    return panCamera(next, [anchorCss[0] - mapped[0], anchorCss[1] - mapped[1]]);
}
export function zoomCameraAt(camera: Camera, anchorCss: Point2D, requestedZoom: number): Camera {
    finite(requestedZoom);
    if (requestedZoom <= 0)
        throw new RangeError('Requested zoom must be positive');
    return orientCameraAt(camera, anchorCss, { zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, requestedZoom)) });
}
export function centerCamera(camera: Camera, stage: Bounds, size: ViewportSize): Camera {
    validate(camera);
    bounds(stage);
    viewport(size);
    const centered = createCamera({ ...camera, translation: [0, 0] });
    const center = worldToScreen(centered, [stage.minX / 2 + stage.maxX / 2, stage.minY / 2 + stage.maxY / 2]);
    return panCamera(centered, [size.width / 2 - center[0], size.height / 2 - center[1]]);
}
export function fitCamera(camera: Camera, stage: Bounds, size: ViewportSize, paddingCss = 24): Camera {
    validate(camera);
    bounds(stage);
    viewport(size);
    finite(paddingCss);
    if (paddingCss < 0 || 2 * paddingCss >= Math.min(size.width, size.height))
        throw new RangeError('Fit padding consumes viewport');
    const c = Math.abs(Math.cos(camera.rotationRadians)), s = Math.abs(Math.sin(camera.rotationRadians));
    const width = stage.maxX - stage.minX, height = stage.maxY - stage.minY;
    finite(width);
    finite(height);
    const requested = Math.min((size.width - 2 * paddingCss) / (c * width + s * height), (size.height - 2 * paddingCss) / (s * width + c * height));
    finite(requested);
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, requested));
    return centerCamera(createCamera({ ...camera, zoom }), stage, size);
}
export function resizeCamera(camera: Camera, previous: ViewportSize, next: ViewportSize): Camera {
    viewport(previous);
    viewport(next);
    return panCamera(camera, [(next.width - previous.width) / 2, (next.height - previous.height) / 2]);
}
