import type { Id, Point, ShapeGraph, ConfirmedInkSample, BrushParameters } from '../../document-model/src/dto.js';
import type { Budget, Cancellation, GeometryTolerance, Result } from '../../shared/src/contracts.js';
import type { Mesh } from '../../renderer-core/src/contracts.js';

export interface GeometryRequest { readonly tolerance: GeometryTolerance; readonly budget: Budget; readonly cancellation: Cancellation }
export interface TopologyChange { readonly graph: ShapeGraph; readonly changedIds: ReadonlySet<Id>; readonly removedIds: ReadonlySet<Id>; readonly lineage: ReadonlyMap<Id, readonly Id[]> }
export type Hit = { readonly kind: 'vertex' | 'edge' | 'face'; readonly id: Id; readonly distance: number; readonly parameter: number | null };
export interface GeometryKernel {
  merge(base: ShapeGraph, incoming: ShapeGraph, request: GeometryRequest): Result<TopologyChange>;
  subtract(base: ShapeGraph, cutter: ShapeGraph, request: GeometryRequest): Result<TopologyChange>;
  splitEdge(graph: ShapeGraph, edgeId: Id, parameter: number, request: GeometryRequest): Result<TopologyChange>;
  hitTest(graph: ShapeGraph, point: Point, radiusStage: number, request: GeometryRequest): Result<readonly Hit[]>;
  fitInk(samples: readonly ConfirmedInkSample[], brush: BrushParameters, request: GeometryRequest): Result<ShapeGraph>;
  tessellate(graph: ShapeGraph, lod: number, request: GeometryRequest): Result<Mesh>;
}
