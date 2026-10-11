export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly path: string | null;
  readonly recoverable: boolean;
  readonly details: Readonly<Record<string, string | number | boolean>>;
}
export interface Cancellation { readonly cancelled: boolean; onCancel(handler: () => void): () => void }
export interface Disposable { dispose(): void }
export interface Bounds { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number }
export interface GeometryTolerance {
  readonly absolute: number;
  readonly relative: number;
  readonly parameter: number;
  readonly fitting: number;
  readonly flatteningCssPixels: number;
}
export interface Capability {
  readonly availability: 'supported' | 'unsupported' | 'unknown';
  readonly observed: 'working' | 'failed' | 'untested';
  readonly detail: string;
}
export interface Budget {
  readonly maxBytes: number;
  readonly maxRecords: number;
  readonly maxDepth: number;
  readonly maxOperations: number;
}
