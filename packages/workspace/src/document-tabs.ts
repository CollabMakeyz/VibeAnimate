import { createBlankDocument } from '../../document-model/src/create-document.js';
import type { DocumentDTO } from '../../document-model/src/dto.js';
import { createCamera } from '../../renderer-core/src/camera.js';
import type { ViewportSize } from '../../renderer-core/src/camera.js';
import type { Camera } from '../../renderer-core/src/contracts.js';
export interface DocumentView {
    readonly camera: Camera;
    readonly size: ViewportSize;
}
export interface DocumentTab {
    readonly document: DocumentDTO;
    readonly view: DocumentView | null;
}
export class DocumentTabs {
    readonly #tabs = new Map<string, DocumentTab>();
    readonly #limit: number;
    #active: string | null = null;
    #serial = 0;
    constructor(limit = 32) {
        if (!Number.isInteger(limit) || limit < 1 || limit > 128)
            throw new RangeError('Invalid document-tab limit');
        this.#limit = limit;
    }
    get tabs(): readonly DocumentTab[] { return Object.freeze([...this.#tabs.values()]); }
    get active(): DocumentTab | null { return this.#active === null ? null : this.#tabs.get(this.#active)!; }
    get canCreate(): boolean { return this.#tabs.size < this.#limit; }
    create(id: string): DocumentTab {
        if (!this.canCreate)
            throw new RangeError('Open document limit reached');
        if (this.#tabs.has(id))
            throw new Error('Document ID is already open');
        const document = createBlankDocument(id, `Sem título ${this.#serial + 1}`);
        const tab = Object.freeze({ document, view: null });
        this.#serial++;
        this.#tabs.set(id, tab);
        this.#active = id;
        return tab;
    }
    select(id: string): void {
        if (!this.#tabs.has(id))
            throw new Error('Unknown document tab');
        this.#active = id;
    }
    close(id: string): void {
        if (!this.#tabs.has(id))
            throw new Error('Unknown document tab');
        const ids = [...this.#tabs.keys()];
        const index = ids.indexOf(id);
        this.#tabs.delete(id);
        if (this.#active === id)
            this.#active = ids[index + 1] ?? ids[index - 1] ?? null;
    }
    rememberView(id: string, camera: Camera, size: ViewportSize): void {
        const tab = this.#tabs.get(id);
        if (!tab)
            throw new Error('Unknown document tab');
        if (![size.width, size.height].every(value => Number.isFinite(value) && value > 0))
            throw new RangeError('Invalid document viewport');
        this.#tabs.set(id, Object.freeze({ document: tab.document, view: Object.freeze({ camera: createCamera(camera), size: Object.freeze({ ...size }) }) }));
    }
}
