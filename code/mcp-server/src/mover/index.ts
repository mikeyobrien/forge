// ABOUTME: Export interface for document movement functionality
// ABOUTME: Provides unified access to document mover and types

export { DocumentMover } from './DocumentMover.js';
export type {
  MoveOptions,
  MoveResult,
  LinkUpdate,
  MoveValidation,
  RollbackState,
} from './types.js';
export { DocumentMoveError } from './types.js';
