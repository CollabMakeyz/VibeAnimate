import type { DocumentDTO, Id, ShapeGraph, ConfirmedInkSample, BrushParameters } from '../packages/document-model/src/dto.js';
import type { DocumentPatch } from '../packages/document-model/src/contracts.js';
import type { Mesh } from '../packages/renderer-core/src/contracts.js';
import type { Budget, Diagnostic, GeometryTolerance } from '../packages/shared/src/contracts.js';

export interface JobIdentity { readonly protocolVersion: 1; readonly jobId: Id; readonly documentId: Id; readonly baseRevision: number }
export type GeometryTask =
  | { readonly kind: 'merge'; readonly target: ShapeGraph; readonly incoming: ShapeGraph; readonly tolerance: GeometryTolerance }
  | { readonly kind: 'tessellate'; readonly graph: ShapeGraph; readonly lod: number; readonly tolerance: GeometryTolerance }
  | { readonly kind: 'fit-ink'; readonly samples: readonly ConfirmedInkSample[]; readonly brush: BrushParameters; readonly tolerance: GeometryTolerance };
export type WorkerRequest = JobIdentity & (
  | { readonly type: 'cancel' }
  | { readonly type: 'geometry'; readonly task: GeometryTask; readonly budget: Budget }
  | { readonly type: 'thumbnail'; readonly symbolId: Id; readonly snapshot: DocumentDTO; readonly width: number; readonly height: number; readonly budget: Budget }
  | { readonly type: 'export'; readonly snapshot: DocumentDTO; readonly sceneId: Id; readonly startFrame: number; readonly endFrame: number; readonly scale: number; readonly format: 'png' | 'png-sequence' | 'svg' | 'gif' | 'html5' | 'webm' | 'mp4'; readonly budget: Budget }
);
export type WorkerReply = JobIdentity & (
  | { readonly type: 'cancelled' }
  | { readonly type: 'error'; readonly diagnostic: Diagnostic }
  | { readonly type: 'progress'; readonly completed: number; readonly total: number }
  | { readonly type: 'geometry-result'; readonly patches: readonly DocumentPatch[]; readonly mesh: Mesh | null }
  | { readonly type: 'bytes'; readonly sequence: number; readonly final: boolean; readonly bytes: ArrayBuffer; readonly mediaType: string }
);
export interface AssetRequest extends JobIdentity { readonly type: 'asset-request'; readonly assetId: Id; readonly expectedSha256: string }
export interface AssetReply extends JobIdentity { readonly type: 'asset-reply'; readonly assetId: Id; readonly bytes: ArrayBuffer }
export interface ExportAcknowledgement extends JobIdentity { readonly type: 'ack'; readonly sequence: number }
