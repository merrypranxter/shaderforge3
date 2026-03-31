/**
 * Persist and restore style pack state in localStorage.
 */
import type { StylePackManifest } from "./stylePackSchema";

const STORAGE_KEY = "shaderforge_style_pack";

export interface PersistedStylePack {
  owner: string;
  repo: string;
  manifest: StylePackManifest;
  seed: number;
  activePaletteId?: string;
}

export function saveStylePack(data: PersistedStylePack): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore
  }
}

export function loadStylePack(): PersistedStylePack | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedStylePack;
  } catch {
    return null;
  }
}

export function clearStylePack(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
