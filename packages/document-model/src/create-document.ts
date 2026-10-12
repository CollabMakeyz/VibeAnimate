import type { DocumentDTO } from './dto.js';
function freeze<T>(value: T): T {
    if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}
export function createBlankDocument(id: string, title = 'Sem título', width = 1920, height = 1080): DocumentDTO {
    if (!/^[A-Za-z][A-Za-z0-9_-]{7,63}$/.test(id))
        throw new TypeError('New document requires an 8–64 character ID');
    if (!title.trim() || title.length > 512)
        throw new TypeError('Invalid document title');
    if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= 65536))
        throw new RangeError('Invalid Stage dimensions');
    return freeze<DocumentDTO>({
        formatVersion: 1, id, title,
        stage: { width, height, background: [1, 1, 1, 1], units: 'px', perspectiveDegrees: 55, vanishingPoint: [width / 2, height / 2] },
        fps: { numerator: 24, denominator: 1 },
        scenes: [{ id: `${id}-scene`, name: 'Cena 1', timelineId: `${id}-timeline` }],
        timelines: [{ id: `${id}-timeline`, duration: 1, layerIds: [`${id}-layer`] }],
        layers: [{ id: `${id}-layer`, name: 'Camada 1', kind: 'normal', parentFolderId: null, maskLayerId: null, guideLayerId: null, armatureId: null, visible: true, locked: false, outline: false, color: [.5, .4, .9, 1], exposures: [{ id: `${id}-exposure`, start: 0, end: 1, contentId: null, label: null }], tweens: [], sounds: [] }],
        contents: [], elements: [], graphs: [], fills: [], strokes: [], symbols: [], libraryFolders: [], assets: [], armatures: [], scripts: [], swatches: [],
        metadata: { author: '', description: '', tags: [] },
    });
}
