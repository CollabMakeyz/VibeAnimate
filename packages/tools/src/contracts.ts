import type { Id } from '../../document-model/src/dto.js';
import type { DocumentReader, Selection } from '../../document-model/src/contracts.js';
import type { CommandBus } from '../../command-system/src/contracts.js';
import type { PointerBatch } from '../../input/src/contracts.js';
import type { Overlay } from '../../renderer-core/src/contracts.js';
import type { Result } from '../../shared/src/contracts.js';

export interface ToolKey { readonly key: string; readonly code: string; readonly repeat: boolean; readonly shift: boolean; readonly alt: boolean; readonly control: boolean; readonly meta: boolean }
export interface ToolServices { readonly document: DocumentReader; readonly commands: CommandBus; selection(): Selection; setSelection(selection: Selection): void; invalidateOverlay(): void }
export interface Tool {
  readonly id: string;
  activate(services: ToolServices): Result<void>;
  deactivate(): void;
  pointerDown(event: PointerBatch): void;
  pointerMove(event: PointerBatch): void;
  pointerUp(event: PointerBatch): void;
  pointerCancel(event: PointerBatch): void;
  keyDown(event: ToolKey): boolean;
  keyUp(event: ToolKey): boolean;
  renderOverlay(): readonly Overlay[];
}
export type InteractionState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'drawing'; readonly pointerId: number; readonly documentId: Id; readonly baseRevision: number; readonly toolId: string }
  | { readonly kind: 'dragging'; readonly pointerId: number; readonly documentId: Id; readonly baseRevision: number; readonly selection: Selection; readonly operation: 'move' | 'scale' | 'rotate' | 'skew' | 'pivot' | 'marquee' }
  | { readonly kind: 'pen-path'; readonly documentId: Id; readonly baseRevision: number; readonly state: 'placing-first' | 'extending' | 'dragging-handle' | 'closing' }
  | { readonly kind: 'gesture'; readonly pointerIds: readonly number[]; readonly operation: 'pan' | 'zoom' | 'rotate' };
