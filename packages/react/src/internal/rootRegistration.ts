import type { RootRegistry } from "./rootRegistry";

/**
 * Represents an active root registration.
 *
 * Disposing the registration unregisters the associated root.
 */
export class RootRegistration {
  private disposed = false;

  constructor(
    private readonly registry: RootRegistry,
    private readonly rootId: symbol,
  ) {}

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.registry.unregister(this.rootId);
  }
}
