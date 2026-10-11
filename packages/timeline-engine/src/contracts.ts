import type { FrameRate, Id } from '../../document-model/src/dto.js';
import type { DocumentSnapshot } from '../../document-model/src/contracts.js';
import type { EvaluatedScene } from '../../renderer-core/src/contracts.js';
import type { Budget, Result } from '../../shared/src/contracts.js';

export interface PlaybackContext {
  readonly sceneId: Id; readonly frame: number; readonly epochFrame: number;
  readonly movieClipMode: 'classic-static-preview' | 'live' | 'deterministic-export';
  readonly buttonState: 'up' | 'over' | 'down' | 'hit';
  readonly disabledScriptIds: ReadonlySet<Id>;
}
export interface FrameEvaluator {
  evaluate(snapshot: DocumentSnapshot, context: PlaybackContext, budget: Budget): Result<EvaluatedScene>;
  invalidate(changedIds: ReadonlySet<Id>): void;
}
export interface PlaybackClock {
  readonly fps: FrameRate;
  readonly state: 'playing' | 'paused';
  seek(frame: number, monotonicMs: number): void;
  play(monotonicMs: number): void;
  pause(monotonicMs: number): void;
  frameAt(monotonicMs: number): number;
}
export interface OnionSettings { readonly previous: number; readonly next: number; readonly opacity: number; readonly tintPrevious: readonly [number, number, number, number]; readonly tintNext: readonly [number, number, number, number]; readonly outline: boolean; readonly relativeFalloff: number }
