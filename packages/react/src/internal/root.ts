/**
 * Internal representation of a React root.
 *
 * This type is intentionally not exported from the public API.
 */
export interface InternalRoot {
  readonly id: symbol;
  readonly createdAt: number;
}

/**
 * Creates a new internal root instance.
 */
export function createInternalRoot(): InternalRoot {
  return {
    id: Symbol("react-root"),
    createdAt: Date.now(),
  };
}
