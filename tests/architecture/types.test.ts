import type { ConfirmedInkSample, Element } from '../../packages/document-model/src/dto.js';
import type { PredictedSample } from '../../packages/input/src/contracts.js';
import type { EntityPatch } from '../../packages/document-model/src/contracts.js';

export function compileTimeBoundaries(prediction: PredictedSample, element: Element): void {
  // @ts-expect-error A speculative event cannot enter the saved confirmed stream.
  const persisted: ConfirmedInkSample = prediction;
  // @ts-expect-error Document snapshots are read-only to consumers.
  element.opacity = 0.5;
  // @ts-expect-error A layer patch cannot contain an artwork element.
  const invalidPatch: EntityPatch = { kind: 'entity', table: 'layers', id: element.id, before: null, after: element };
  void persisted; void invalidPatch;
}
