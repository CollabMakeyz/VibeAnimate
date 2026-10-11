export interface CapabilityReport {
    readonly graphics: 'webgl2' | 'canvas2d' | 'unavailable';
    readonly pointerEvents: boolean;
    readonly coalescedEvents: boolean;
    readonly predictedEvents: boolean;
    readonly pointerRawUpdate: boolean;
    readonly offscreenCanvasApi: boolean;
    readonly workerApi: boolean;
    readonly devicePixelRatio: number;
    readonly hardwarePen: 'unverified';
}
// Context creation is measured. API presence does not establish physical tablet
// support: pressure, tilt and eraser remain unverified until observed and tested.
export function detectCapabilities(host: Window & typeof globalThis = window): CapabilityReport {
    const canvas = host.document.createElement('canvas');
    let graphics: CapabilityReport['graphics'] = 'unavailable';
    try {
        const gl = canvas.getContext('webgl2');
        if (gl) {
            graphics = 'webgl2';
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
    }
    catch { /* A denied GPU context is a capability result, not a startup failure. */ }
    if (graphics === 'unavailable') {
        try {
            if (host.document.createElement('canvas').getContext('2d'))
                graphics = 'canvas2d';
        }
        catch { /* Both graphics backends may be disabled by the host. */ }
    }
    const pointer = typeof host.PointerEvent === 'function' ? host.PointerEvent.prototype : undefined;
    return Object.freeze({
        graphics,
        pointerEvents: !!pointer,
        coalescedEvents: typeof pointer?.getCoalescedEvents === 'function',
        predictedEvents: typeof pointer?.getPredictedEvents === 'function',
        pointerRawUpdate: 'onpointerrawupdate' in host,
        offscreenCanvasApi: typeof host.OffscreenCanvas === 'function',
        workerApi: typeof host.Worker === 'function',
        devicePixelRatio: Number.isFinite(host.devicePixelRatio) && host.devicePixelRatio > 0 ? host.devicePixelRatio : 1,
        hardwarePen: 'unverified',
    });
}
