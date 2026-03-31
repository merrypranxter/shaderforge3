<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/67bc0e6f-9898-4bf8-9942-8ea3638389e9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Style Packs

ShaderForge supports loading **Style Packs** from public GitHub repositories. A style pack is a JSON manifest file that defines palettes and shader knob ranges, letting you bring your visual aesthetic into the shader engine without touching any renderer code.

### Loading a Style Pack

In the **Tools** panel (⚡ icon), find the **Style Pack** section. Enter the `owner` and `repo` of a GitHub repository that contains a `shaderforge.style.json` at its root, then click **Load Style Pack**.

- Once loaded, select a palette and click **Apply** to register the pack's data.
- Click **Re-roll** to randomize knob values within their defined ranges using a new deterministic seed.
- The last successfully applied pack is saved in `localStorage` and restored on page refresh.
- If anything goes wrong during apply, the app automatically reverts to the last known good pack.

### Creating a Style Pack Repo

Add a file named `shaderforge.style.json` at the **root** of a public GitHub repository. The schema is v1:

```json
{
  "schemaVersion": 1,
  "id": "my-style-pack",
  "name": "My Style Pack",
  "description": "Optional description of the vibe.",
  "palettes": [
    {
      "id": "candy-groove",
      "name": "Candy Groove",
      "colors": ["#ff2bd6", "#ff8a00", "#ffe600", "#00ffd1", "#6a00ff"]
    }
  ],
  "knobs": [
    { "id": "warp",  "label": "Warp",  "min": 0.0, "max": 2.0, "default": 0.6 },
    { "id": "grain", "label": "Grain", "min": 0.0, "max": 1.0, "default": 0.15 }
  ]
}
```

#### Schema rules

| Field | Type | Required | Notes |
|---|---|---|---|
| `schemaVersion` | `1` | ✅ | Must be exactly `1` |
| `id` | `string` | ✅ | Unique identifier, non-empty |
| `name` | `string` | ✅ | Display name |
| `description` | `string` | — | Optional free text |
| `palettes` | `array` | — | Each palette has `id`, optional `name`, and `colors` |
| `knobs` | `array` | — | Each knob has `id`, optional `label`, `min`, `max`, `default` |

- **Palette colors** must be valid hex strings: `#RRGGBB` or `#RRGGBBAA` (case-insensitive).
- **Knobs** must satisfy `min ≤ default ≤ max`.

#### Seeded Chaos Mixer

The **Re-roll** button generates a new seed and re-randomizes all knob values within `[min, max]` using a deterministic xorshift32 PRNG. The same seed always produces the same values — great for reproducible experiments.

