/**
 * Internal representation of a React root.
 *
 * This type is intentionally not exported from the public API.
 */
export interface InternalRoot {
  readonly id: symbol;
  readonly createdAt: number;

  /**
   * Number of commits observed for this root so far.
   */
  readonly commitCount: number;

  /**
   * Timestamp of the most recent commit, or null if none observed yet.
   */
  readonly lastCommittedAt: number | null;
}

/**
 * Creates a new internal root instance.
 */
export function createInternalRoot(): InternalRoot {
  return {
    id: Symbol("react-root"),
    createdAt: Date.now(),
    commitCount: 0,
    lastCommittedAt: null,
  };
}