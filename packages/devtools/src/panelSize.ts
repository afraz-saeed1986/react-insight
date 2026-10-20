export const PANEL_SIZE_STORAGE_KEY = "react-insight:panel-size";

export interface StoredPanelSize {
  readonly height: number | null;
  readonly detailsWidth: number | null;
}

type PanelSizeStorage = Pick<Storage, "getItem" | "setItem">;

const EMPTY: StoredPanelSize = { height: null, detailsWidth: null };

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function positiveNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

/** Parses a stored value. Anything invalid becomes null, never an error. */
export function parsePanelSize(raw: string | null): StoredPanelSize {
  if (raw === null) return EMPTY;

  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY;

    const record = data as { height?: unknown; detailsWidth?: unknown };
    return {
      height: positiveNumberOrNull(record.height),
      detailsWidth: positiveNumberOrNull(record.detailsWidth),
    };
  } catch {
    return EMPTY;
  }
}

function defaultStorage(): PanelSizeStorage | null {
  try {
    return window.localStorage;
  } catch {
    // No window (SSR) or storage access blocked (private mode, site settings).
    return null;
  }
}

export function readPanelSize(
  storage: PanelSizeStorage | null = defaultStorage(),
): StoredPanelSize {
  if (storage === null) return EMPTY;

  try {
    return parsePanelSize(storage.getItem(PANEL_SIZE_STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

export function writePanelSize(
  size: StoredPanelSize,
  storage: PanelSizeStorage | null = defaultStorage(),
): void {
  if (storage === null) return;

  try {
    storage.setItem(PANEL_SIZE_STORAGE_KEY, JSON.stringify(size));
  } catch {
    // Storage can be full or blocked. The size is only a convenience.
  }
}