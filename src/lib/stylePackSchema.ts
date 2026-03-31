/**
 * Style Pack manifest schema (v1) validation.
 * No external schema libraries — lightweight manual validation.
 */

export interface StylePackPalette {
  id: string;
  name?: string;
  colors: string[];
}

export interface StylePackKnob {
  id: string;
  label?: string;
  min: number;
  max: number;
  default: number;
}

export interface StylePackManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  description?: string;
  palettes?: StylePackPalette[];
  knobs?: StylePackKnob[];
}

export interface ValidationOk {
  ok: true;
  manifest: StylePackManifest;
}

export interface ValidationError {
  ok: false;
  error: string;
}

export type ValidationResult = ValidationOk | ValidationError;

const HEX_COLOR_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && isFinite(v);
}

/**
 * Parse a JSON string and validate it against the v1 style pack schema.
 */
export function validateStylePackManifest(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Manifest is not valid JSON." };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "Manifest must be a JSON object." };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.schemaVersion !== 1) {
    return {
      ok: false,
      error: `Unsupported schemaVersion "${obj.schemaVersion}". Only version 1 is supported.`,
    };
  }

  if (!isString(obj.id) || obj.id.trim() === "") {
    return { ok: false, error: 'Manifest must have a non-empty string "id".' };
  }

  if (!isString(obj.name) || obj.name.trim() === "") {
    return { ok: false, error: 'Manifest must have a non-empty string "name".' };
  }

  if (obj.description !== undefined && !isString(obj.description)) {
    return { ok: false, error: '"description" must be a string.' };
  }

  // Validate palettes
  if (obj.palettes !== undefined) {
    if (!Array.isArray(obj.palettes)) {
      return { ok: false, error: '"palettes" must be an array.' };
    }
    for (let i = 0; i < obj.palettes.length; i++) {
      const palette = obj.palettes[i] as Record<string, unknown>;
      if (!isString(palette.id) || palette.id.trim() === "") {
        return { ok: false, error: `palettes[${i}] must have a non-empty string "id".` };
      }
      if (palette.name !== undefined && !isString(palette.name)) {
        return { ok: false, error: `palettes[${i}].name must be a string.` };
      }
      if (!Array.isArray(palette.colors) || palette.colors.length === 0) {
        return { ok: false, error: `palettes[${i}] must have a non-empty "colors" array.` };
      }
      for (let j = 0; j < palette.colors.length; j++) {
        const color = palette.colors[j];
        if (!isString(color) || !HEX_COLOR_RE.test(color)) {
          return {
            ok: false,
            error: `palettes[${i}].colors[${j}] "${color}" is not a valid hex color (#RRGGBB or #RRGGBBAA).`,
          };
        }
      }
    }
  }

  // Validate knobs
  if (obj.knobs !== undefined) {
    if (!Array.isArray(obj.knobs)) {
      return { ok: false, error: '"knobs" must be an array.' };
    }
    for (let i = 0; i < obj.knobs.length; i++) {
      const knob = obj.knobs[i] as Record<string, unknown>;
      if (!isString(knob.id) || knob.id.trim() === "") {
        return { ok: false, error: `knobs[${i}] must have a non-empty string "id".` };
      }
      if (knob.label !== undefined && !isString(knob.label)) {
        return { ok: false, error: `knobs[${i}].label must be a string.` };
      }
      if (!isNumber(knob.min)) {
        return { ok: false, error: `knobs[${i}].min must be a finite number.` };
      }
      if (!isNumber(knob.max)) {
        return { ok: false, error: `knobs[${i}].max must be a finite number.` };
      }
      if (!isNumber(knob.default)) {
        return { ok: false, error: `knobs[${i}].default must be a finite number.` };
      }
      if ((knob.min as number) > (knob.max as number)) {
        return { ok: false, error: `knobs[${i}]: min (${knob.min}) must be <= max (${knob.max}).` };
      }
      if (
        (knob.default as number) < (knob.min as number) ||
        (knob.default as number) > (knob.max as number)
      ) {
        return {
          ok: false,
          error: `knobs[${i}]: default (${knob.default}) must be between min (${knob.min}) and max (${knob.max}).`,
        };
      }
    }
  }

  return {
    ok: true,
    manifest: parsed as StylePackManifest,
  };
}
