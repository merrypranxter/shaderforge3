/**
 * StylePackPanel — UI for loading, applying, and experimenting with style packs.
 *
 * Responsibilities:
 * - Input owner/repo for a style pack GitHub repository
 * - Load shaderforge.style.json via the server proxy
 * - Validate the manifest and show human-readable errors
 * - Apply pack (palette selection + knob display) with last-known-good revert
 * - Seeded chaos mixer: "Re-roll" randomizes knobs/palette within bounds
 * - Persist last-good pack to localStorage
 */
import { useState, useCallback } from "react";
import { Shuffle, PackageOpen, RotateCcw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { fetchGitHubFile } from "../lib/githubContent";
import { validateStylePackManifest, type StylePackManifest, type StylePackKnob } from "../lib/stylePackSchema";
import { saveStylePack, loadStylePack, type PersistedStylePack } from "../lib/stylePackStorage";
import { runChaosMix, newSeed, type MixResult } from "../lib/chaosMixer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppliedPackState {
  manifest: StylePackManifest;
  owner: string;
  repo: string;
  mix: MixResult;
  activePaletteId: string | undefined;
}

interface StylePackPanelProps {
  /** Called when a pack is successfully applied (or re-rolled) */
  onApply?: (state: AppliedPackState) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initFromStorage(): {
  owner: string;
  repo: string;
  manifest: StylePackManifest | null;
  seed: number;
  activePaletteId: string | undefined;
} {
  const saved = loadStylePack();
  if (saved) {
    return {
      owner: saved.owner,
      repo: saved.repo,
      manifest: saved.manifest,
      seed: saved.seed,
      activePaletteId: saved.activePaletteId,
    };
  }
  return { owner: "", repo: "", manifest: null, seed: newSeed(), activePaletteId: undefined };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StylePackPanel({ onApply }: StylePackPanelProps) {
  const init = initFromStorage();

  const [owner, setOwner] = useState(init.owner);
  const [repo, setRepo] = useState(init.repo);
  const [loadedManifest, setLoadedManifest] = useState<StylePackManifest | null>(init.manifest);
  const [lastGoodPack, setLastGoodPack] = useState<PersistedStylePack | null>(
    init.manifest
      ? {
          owner: init.owner,
          repo: init.repo,
          manifest: init.manifest,
          seed: init.seed,
          activePaletteId: init.activePaletteId,
        }
      : null
  );
  const [activePaletteId, setActivePaletteId] = useState<string | undefined>(init.activePaletteId);
  const [seed, setSeed] = useState(init.seed);
  const [mixResult, setMixResult] = useState<MixResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Load Pack ──────────────────────────────────────────────────────────────

  const handleLoad = useCallback(async () => {
    const trimmedOwner = owner.trim();
    const trimmedRepo = repo.trim();
    if (!trimmedOwner || !trimmedRepo) {
      setLoadError("Please enter both owner and repo.");
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setApplyError(null);

    const result = await fetchGitHubFile(trimmedOwner, trimmedRepo, "shaderforge.style.json");

    if (!result.ok) {
      setLoadError((result as { ok: false; error: string }).error);
      setIsLoading(false);
      return;
    }

    const validation = validateStylePackManifest((result as { ok: true; content: string }).content);
    if (!validation.ok) {
      setLoadError(`Invalid manifest: ${(validation as { ok: false; error: string }).error}`);
      setIsLoading(false);
      return;
    }

    const manifest = (validation as { ok: true; manifest: StylePackManifest }).manifest;
    setLoadedManifest(manifest);

    // Reset palette to first available
    const firstPalette = manifest.palettes?.[0]?.id;
    setActivePaletteId(firstPalette);
    setIsLoading(false);
  }, [owner, repo]);

  // ── Apply / Re-roll ────────────────────────────────────────────────────────

  const applyMix = useCallback(
    (manifest: StylePackManifest, thisSeed: number, paletteId: string | undefined) => {
      const palette = manifest.palettes?.find((p) => p.id === paletteId) ?? manifest.palettes?.[0];
      const knobs: StylePackKnob[] = manifest.knobs ?? [];

      let mix: MixResult;
      try {
        mix = runChaosMix(thisSeed, knobs, palette);
      } catch (e: unknown) {
        // Revert to last good
        const errMsg = e instanceof Error ? e.message : "Unknown error during mix.";
        setApplyError(`Mix failed — reverted to last good pack. (${errMsg})`);
        if (lastGoodPack) {
          setLoadedManifest(lastGoodPack.manifest);
          setActivePaletteId(lastGoodPack.activePaletteId);
          setSeed(lastGoodPack.seed);
        }
        return;
      }

      const newGood: PersistedStylePack = {
        owner: owner.trim(),
        repo: repo.trim(),
        manifest,
        seed: thisSeed,
        activePaletteId: paletteId,
      };
      setLastGoodPack(newGood);
      saveStylePack(newGood);
      setMixResult(mix);
      setSeed(thisSeed);
      setApplyError(null);

      if (onApply) {
        onApply({
          manifest,
          owner: owner.trim(),
          repo: repo.trim(),
          mix,
          activePaletteId: paletteId,
        });
      }
    },
    [owner, repo, lastGoodPack, onApply]
  );

  const handleApply = useCallback(() => {
    if (!loadedManifest) return;
    applyMix(loadedManifest, seed, activePaletteId);
  }, [loadedManifest, seed, activePaletteId, applyMix]);

  const handleReroll = useCallback(() => {
    if (!loadedManifest) return;
    const ns = newSeed();
    applyMix(loadedManifest, ns, activePaletteId);
  }, [loadedManifest, activePaletteId, applyMix]);

  const handleRevert = useCallback(() => {
    if (!lastGoodPack) return;
    setLoadedManifest(lastGoodPack.manifest);
    setOwner(lastGoodPack.owner);
    setRepo(lastGoodPack.repo);
    setActivePaletteId(lastGoodPack.activePaletteId);
    setSeed(lastGoodPack.seed);
    setLoadError(null);
    setApplyError(null);
    applyMix(lastGoodPack.manifest, lastGoodPack.seed, lastGoodPack.activePaletteId);
  }, [lastGoodPack, applyMix]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <PackageOpen className="w-4 h-4 text-fuchsia-400" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">
          Style Pack
        </h3>
      </div>

      {/* Owner / Repo inputs */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="owner"
          className="w-1/2 bg-white/5 rounded-xl px-3 py-2 text-xs border border-white/10 focus:border-fuchsia-500/50 focus:ring-0 placeholder:text-white/20"
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
        />
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="repo"
          className="w-1/2 bg-white/5 rounded-xl px-3 py-2 text-xs border border-white/10 focus:border-fuchsia-500/50 focus:ring-0 placeholder:text-white/20"
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
        />
      </div>

      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="w-full py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 rounded-xl border border-fuchsia-500/20 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <PackageOpen className="w-3 h-3" />
        )}
        {isLoading ? "Loading…" : "Load Style Pack"}
      </button>

      {/* Load error */}
      {loadError && (
        <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-[10px] text-red-300 font-mono">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Apply error */}
      {applyError && (
        <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl text-[10px] text-yellow-300 font-mono">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{applyError}</span>
        </div>
      )}

      {/* Loaded manifest metadata */}
      {loadedManifest && (
        <div className="space-y-3">
          {/* Pack info */}
          <div className="p-3 bg-white/5 border border-fuchsia-500/20 rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-fuchsia-400 flex-shrink-0" />
              <span className="text-[11px] font-bold text-white truncate">{loadedManifest.name}</span>
            </div>
            <div className="text-[9px] text-white/40 font-mono">{loadedManifest.id}</div>
            {loadedManifest.description && (
              <div className="text-[10px] text-white/50 leading-snug">{loadedManifest.description}</div>
            )}
            <div className="flex gap-3 text-[9px] text-white/30 font-mono pt-1">
              <span>{loadedManifest.palettes?.length ?? 0} palettes</span>
              <span>{loadedManifest.knobs?.length ?? 0} knobs</span>
            </div>
          </div>

          {/* Palette selector */}
          {loadedManifest.palettes && loadedManifest.palettes.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Palette</div>
              <div className="flex flex-col gap-2">
                {loadedManifest.palettes.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setActivePaletteId(palette.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                      activePaletteId === palette.id
                        ? "border-fuchsia-500/50 bg-fuchsia-900/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {/* Color swatches */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {palette.colors.slice(0, 6).map((c, i) => (
                        <span
                          key={i}
                          className="w-3 h-3 rounded-sm inline-block border border-black/20"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      {palette.colors.length > 6 && (
                        <span className="text-[8px] text-white/30 font-mono ml-0.5 self-center">
                          +{palette.colors.length - 6}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70 truncate">
                      {palette.name ?? palette.id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Knobs preview */}
          {mixResult && mixResult.knobValues.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                Mixed Knobs (seed {mixResult.seed})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {mixResult.knobValues.map((kv) => {
                  const def = loadedManifest.knobs?.find((k) => k.id === kv.id);
                  const pct =
                    def && def.max !== def.min
                      ? ((kv.value - def.min) / (def.max - def.min)) * 100
                      : 50;
                  return (
                    <div key={kv.id} className="flex items-center gap-2">
                      <span className="text-[9px] text-white/40 font-mono w-20 flex-shrink-0 truncate">
                        {def?.label ?? kv.id}
                      </span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-fuchsia-500/60 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-white/30 font-mono w-10 text-right flex-shrink-0">
                        {kv.value.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected colors */}
          {mixResult && mixResult.selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {mixResult.selectedColors.map((c, i) => (
                <span
                  key={i}
                  title={c}
                  className="w-5 h-5 rounded border border-black/20 cursor-default"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 rounded-xl border border-fuchsia-500/20 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
            >
              <CheckCircle2 className="w-3 h-3" />
              Apply
            </button>
            <button
              onClick={handleReroll}
              className="flex-1 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-xl border border-cyan-500/20 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
            >
              <Shuffle className="w-3 h-3" />
              Re-roll
            </button>
            {lastGoodPack && (
              <button
                onClick={handleRevert}
                title="Revert to last good pack"
                className="py-2 px-3 bg-white/5 hover:bg-white/10 text-white/50 rounded-xl border border-white/10 text-[10px] font-mono flex items-center justify-center gap-1 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
