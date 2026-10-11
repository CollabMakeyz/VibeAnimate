import type { Id } from '../../document-model/src/dto.js';
import type { DocumentChange, DocumentPatch, DocumentReader, DocumentSnapshot, Selection } from '../../document-model/src/contracts.js';
import type { Result } from '../../shared/src/contracts.js';

export interface PreparedTransaction {
  readonly id: Id;
  readonly documentId: Id;
  readonly baseRevision: number;
  readonly label: string;
  readonly forward: readonly DocumentPatch[];
  readonly inverse: readonly DocumentPatch[];
  readonly byteCost: number;
  readonly selectionBefore: Selection;
  readonly selectionAfter: Selection;
  readonly mergeKey: string | null;
}
export interface TransactionReceipt { readonly transactionId: Id; readonly change: DocumentChange }
// Only the command executor receives this write capability. UI/tools get CommandBus.
export interface CommandContext {
  readonly document: DocumentReader;
  commitAtomic(transaction: PreparedTransaction, direction: 'apply' | 'revert'): Result<TransactionReceipt>;
}
export interface Command {
  readonly label: string;
  prepare(snapshot: DocumentSnapshot, selection: Selection): Result<PreparedTransaction>;
  apply(context: CommandContext, prepared: PreparedTransaction): Result<TransactionReceipt>;
  revert(context: CommandContext, prepared: PreparedTransaction): Result<TransactionReceipt>;
  mergeWith?(next: Command): Command | null;
}
export interface CommandBus {
  dispatch(command: Command): Result<TransactionReceipt>;
  undo(): Result<TransactionReceipt>;
  redo(): Result<TransactionReceipt>;
  readonly history: { readonly canUndo: boolean; readonly canRedo: boolean; readonly usedBytes: number; readonly limitBytes: number; readonly savedRevision: number | null; readonly currentStateId: Id; readonly savedStateId: Id | null; readonly dirty: boolean };
}
export interface CommandDefinition {
  readonly id: string;
  readonly label: string;
  readonly contexts: ReadonlySet<'stage' | 'timeline' | 'panel' | 'text' | 'modal' | 'global'>;
  enabled(): boolean;
  checked(): boolean | null;
  execute(): void;
}
