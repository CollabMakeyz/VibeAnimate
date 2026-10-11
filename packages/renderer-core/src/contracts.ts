import type { BlendMode, Color, FillStyle, Filter, Id, Matrix2D, ShapeGraph, StrokeStyle } from '../../document-model/src/dto.js';
import type { Bounds, Capability, Disposable, Result } from '../../shared/src/contracts.js';

export interface Camera { readonly translation: readonly [number, number]; readonly zoom: number; readonly rotationRadians: number; readonly mirrorX: boolean; readonly mirrorY: boolean; readonly dpr: number }
export interface Mesh { readonly positions: Float32Array; readonly indices: Uint32Array; readonly coverage: Float32Array | null; readonly bounds: Bounds; readonly byteCost: number }
export interface GeometryView { readonly id: Id; readonly geometryRevision: number; readonly graph: ShapeGraph; readonly fills: ReadonlyMap<Id, FillStyle>; readonly strokes: ReadonlyMap<Id, StrokeStyle> }
export type ImagePlacement =
  | { readonly kind: 'affine'; readonly transform: Matrix2D }
  | { readonly kind: 'projected'; readonly corners: readonly [number, number, number, number, number, number, number, number]; readonly inverseW: readonly [number, number, number, number] };
export type DisplayNode =
  | { readonly kind: 'geometry'; readonly id: Id; readonly geometry: GeometryView; readonly transform: Matrix2D; readonly opacity: number }
  | { readonly kind: 'image'; readonly id: Id; readonly assetId: Id; readonly placement: ImagePlacement; readonly opacity: number; readonly smoothing: boolean }
  | { readonly kind: 'group'; readonly id: Id; readonly children: readonly DisplayNode[]; readonly blend: BlendMode; readonly filters: readonly Filter[]; readonly opacity: number; readonly clip: GeometryView | null };
// Text is shaped to glyph geometry/image nodes before submission. Projection is
// evaluated into geometry, never represented by a CSS transform on the Stage.
export interface EvaluatedScene {
  readonly documentId: Id; readonly revision: number; readonly timelineId: Id;
  readonly frame: number; readonly epochFrame: number;
  readonly bounds: Bounds; readonly background: Color; readonly nodes: readonly DisplayNode[];
}
export type Overlay =
  | { readonly kind: 'polyline'; readonly points: Float32Array; readonly color: Color; readonly widthCss: number }
  | { readonly kind: 'handles'; readonly centers: Float32Array; readonly radiusCss: number; readonly color: Color }
  | { readonly kind: 'cursor'; readonly position: readonly [number, number]; readonly radiusCss: number; readonly angleRadians: number; readonly aspectRatio: number; readonly color: Color };
export interface RenderCapabilities { readonly webgl2: Capability; readonly canvas2d: Capability; readonly offscreen: Capability; readonly maxTextureSize: number; readonly msaaSamples: readonly number[]; readonly supportedBlendModes: ReadonlySet<BlendMode> }
export interface RenderMetrics { readonly drawCalls: number; readonly triangles: number; readonly visibleEdges: number; readonly cacheBytes: number; readonly submitMs: number; readonly gpuMs: number | null }
export interface Renderer extends Disposable {
  readonly capabilities: RenderCapabilities;
  resize(widthCss: number, heightCss: number, dpr: number): Result<void>;
  render(scene: EvaluatedScene, camera: Camera, overlays: readonly Overlay[]): Result<RenderMetrics>;
  invalidate(ids: ReadonlySet<Id>): void;
  setCacheBudget(bytes: number): void;
  onContextState(listener: (state: 'ready' | 'lost' | 'restoring' | 'failed') => void): () => void;
}
