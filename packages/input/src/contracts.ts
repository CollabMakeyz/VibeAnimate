import type { ConfirmedInkSample, Point } from '../../document-model/src/dto.js';
import type { Capability, Disposable, Result } from '../../shared/src/contracts.js';

export type PredictedSample = Omit<ConfirmedInkSample, 'kind'> & { readonly kind: 'predicted' };
export interface PointerBatch {
  readonly pointerId: number;
  readonly pointerType: 'mouse' | 'pen' | 'touch';
  readonly phase: 'hover' | 'down' | 'move' | 'up' | 'cancel';
  readonly buttons: number;
  readonly button: number;
  readonly eraser: boolean;
  readonly primary: boolean;
  readonly positionCss: Point;
  readonly modifiers: { readonly shift: boolean; readonly alt: boolean; readonly control: boolean; readonly meta: boolean };
  readonly confirmed: readonly ConfirmedInkSample[];
  readonly predicted: readonly PredictedSample[];
}
export interface TabletCapabilities {
  readonly pressure: Capability; readonly tilt: Capability; readonly twist: Capability;
  readonly tangentialPressure: Capability; readonly hover: Capability; readonly eraser: Capability;
  readonly coalesced: Capability; readonly predicted: Capability; readonly rawUpdate: Capability;
  readonly contactSize: Capability; readonly nativeBridge: Capability;
}
export interface InputBackend extends Disposable {
  readonly kind: 'web-pointer' | 'native-tablet';
  readonly capabilities: TabletCapabilities;
  start(consumer: (batch: PointerBatch) => void): Result<void>;
  stop(): void;
  cancelAll(reason: 'focus-loss' | 'document-close' | 'backend-switch'): void;
}
export interface InputTransform {
  cssToStage(position: Point): Point;
  stageToCss(position: Point): Point;
  readonly revision: number;
}
export interface InputDiagnostics {
  readonly confirmedCount: number; readonly coalescedCount: number; readonly predictedCount: number;
  readonly rejectedCount: number; readonly lastBatchLatencyMs: number | null;
  readonly observedPressureRange: readonly [number, number] | null;
}
