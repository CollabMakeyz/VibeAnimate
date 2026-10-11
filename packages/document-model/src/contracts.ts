import type { DocumentDTO, Id } from './dto.js';
import type { Diagnostic } from '../../shared/src/contracts.js';

export type EntityTable = { [K in keyof DocumentDTO]: DocumentDTO[K] extends ReadonlyArray<{ readonly id: Id }> ? K : never }[keyof DocumentDTO];
export type EntityAt<K extends EntityTable> = DocumentDTO[K][number];
export type EntityPatch = { [K in EntityTable]: {
  readonly kind: 'entity'; readonly table: K; readonly id: Id;
  readonly before: EntityAt<K> | null; readonly after: EntityAt<K> | null;
} }[EntityTable];
export type HeaderKey = Exclude<keyof DocumentDTO, EntityTable | 'id' | 'formatVersion'>;
export type HeaderPatch = { [K in HeaderKey]: {
  readonly kind: 'header'; readonly key: K; readonly before: DocumentDTO[K]; readonly after: DocumentDTO[K];
} }[HeaderKey];
export interface OrderPatch { readonly kind: 'order'; readonly table: EntityTable; readonly before: readonly Id[]; readonly after: readonly Id[] }
export type DocumentPatch = EntityPatch | HeaderPatch | OrderPatch;
export interface DocumentSnapshot {
  readonly documentId: Id;
  readonly revision: number;
  readonly dto: DocumentDTO;
  readonly validation: 'semantic-valid';
}
export interface DocumentReader {
  snapshot(): DocumentSnapshot;
  entity<K extends EntityTable>(table: K, id: Id): EntityAt<K> | undefined;
  subscribe(listener: (change: DocumentChange) => void): () => void;
}
export interface DocumentChange {
  readonly documentId: Id;
  readonly fromRevision: number;
  readonly toRevision: number;
  readonly changedIds: ReadonlySet<Id>;
  readonly invalidation: ReadonlySet<'geometry' | 'paint' | 'timeline' | 'library' | 'assets' | 'scripts' | 'metadata'>;
}
export interface SemanticValidator {
  validate(dto: DocumentDTO): readonly Diagnostic[];
  validateDelta(snapshot: DocumentSnapshot, patches: readonly DocumentPatch[]): readonly Diagnostic[];
}
export interface Selection {
  readonly contextId: Id;
  readonly elements: ReadonlySet<Id>;
  readonly vertices: ReadonlySet<Id>;
  readonly edges: ReadonlySet<Id>;
  readonly faces: ReadonlySet<Id>;
  readonly bones: ReadonlySet<Id>;
  readonly frames: readonly { readonly layerId: Id; readonly start: number; readonly end: number }[];
}
