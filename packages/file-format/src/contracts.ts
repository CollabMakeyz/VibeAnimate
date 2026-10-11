import type { DocumentDTO, Id, ManifestDTO } from '../../document-model/src/dto.js';
import type { DocumentSnapshot } from '../../document-model/src/contracts.js';
import type { Cancellation, Result } from '../../shared/src/contracts.js';

export interface PackageLimits { readonly maxCompressedBytes: number; readonly maxExpandedBytes: number; readonly maxEntryBytes: number; readonly maxEntries: number; readonly maxCompressionRatio: number; readonly maxJsonDepth: number; readonly maxRecords: number; readonly maxDecodedImagePixels: number; readonly maxSymbolExpansion: number }
export interface SaveTarget { readonly token: string; readonly displayName: string }
export interface AssetStore { read(sha256: string, cancellation: Cancellation): Promise<Result<Uint8Array>> }
export interface SaveReceipt { readonly documentId: Id; readonly revision: number; readonly target: SaveTarget; readonly bytes: number; readonly atomic: boolean }
export interface ProjectPersistence {
  save(snapshot: DocumentSnapshot, assets: AssetStore, target: SaveTarget, cancellation: Cancellation): Promise<Result<SaveReceipt>>;
  load(target: SaveTarget, limits: PackageLimits, cancellation: Cancellation): Promise<Result<{ readonly manifest: ManifestDTO; readonly document: DocumentDTO; readonly assets: AssetStore }>>;
}
export interface Migration {
  readonly fromVersion: number; readonly toVersion: number;
  migrate(validatedSource: Readonly<Record<string, unknown>>, cancellation: Cancellation): Result<DocumentDTO>;
}
export interface RecoveryRecord { readonly documentId: Id; readonly baseRevision: number; readonly lastRevision: number; readonly createdAt: string; readonly manualTarget: SaveTarget | null; readonly snapshotSha256: string; readonly journalSha256: string | null }
