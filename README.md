<div align="center">
<img width="1200" height="475" alt="ShaderForge Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ⚡ ShaderForge 3

**Describe a vibe. Get a live GLSL shader. Reload, remix, record.**

*A Gemini-powered shader generator personalized to your own tastes and aesthetics.*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev)

</div>

---

## What It Does

ShaderForge 3 is a personal shader art tool. Type a vibe — "coral reef dissolving into static", "hyperbolic tiling that breathes", "Lorenz attractor in acid rain" — and Gemini generates live GLSL fragment shader code that runs instantly in the browser.

It's opinionated: it's built for *your* aesthetics, not generic presets. The Style Pack system lets you load custom palettes and shader knob ranges from any GitHub repo, bending the outputs toward your visual language.

---

## Features

- **Vibe → Shader** — Gemini generates GLSL from natural language prompts
- **Live canvas** — shader runs immediately, no compile step
- **Chat refinement** — keep iterating with a conversation thread
- **Shader history** — every generation saved locally, reload any past sketch
- **Style Packs** — load custom palettes + knob ranges from GitHub repos
- **Seeded chaos mixer** — Re-roll knobs deterministically with xorshift32 PRNG
- **Export** — screenshot (PNG) and screen record (WebM)
- **Voice input** — speak your prompt
- **Resizable panels** — code / canvas split layout

---

## Quick Start

```bash
git clone https://github.com/merrypranxter/shaderforge3.git
cd shaderforge3
npm install
```

Create `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

```bash
npm run dev
```

---

## Style Packs

Style Packs let you define custom palettes and shader knob ranges in a GitHub repo and load them into ShaderForge. The generator uses them to bias outputs toward your aesthetic.

Drop a `shaderforge.style.json` at the root of any public GitHub repo:

```json
{
  "schemaVersion": 1,
  "id": "my-style",
  "name": "My Style",
  "palettes": [
    {
      "id": "void-candy",
      "name": "Void Candy",
      "colors": ["#ff2bd6", "#6a00ff", "#00ffd1", "#ffe600", "#ff0055"]
    }
  ],
  "knobs": [
    { "id": "warp",    "label": "Warp",    "min": 0.0, "max": 3.0, "default": 1.2 },
    { "id": "grain",   "label": "Grain",   "min": 0.0, "max": 1.0, "default": 0.2 },
    { "id": "speed",   "label": "Speed",   "min": 0.1, "max": 5.0, "default": 1.0 }
  ]
}
```

In the app: **Tools panel (⚡) → Style Pack → enter `owner/repo` → Load → Apply.**

The **Re-roll** button re-randomizes all knob values from the same seed for reproducible experiments.

---

## Part of the Ecosystem

ShaderForge 3 is one node in a larger generative art pipeline:

- **[RepoScripter2](https://github.com/merrypranxter/reposcripter2)** — uses your GitHub repos as AI context for art generation
- **[THE-LISTS](https://github.com/merrypranxter/THE-LISTS)** — mathematical taxonomy for visual chaos
- **[Mathgasm](https://github.com/merrypranxter/Mathgasm)** — provider-agnostic AI art pipeline
- Style repos (`merry-style`, `glitchcore_style`, etc.) — load as Style Packs

---

<div align="center">
<sub>type weird things. run weird shaders. that's the whole app.</sub>
</div>
