/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";
import { 
  Play, 
  Square, 
  Download, 
  Copy, 
  RotateCcw, 
  MessageSquare, 
  Zap, 
  Github, 
  Search, 
  BookOpen, 
  Book,
  Volume2, 
  VolumeX,
  Terminal,
  History,
  Code2,
  Cpu,
  GripVertical,
  GripHorizontal,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Star,
  Plus,
  Video,
  Monitor,
  Maximize2,
  Minimize2,
  BrainCircuit
} from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ShaderHistory {
  vibe: string;
  code: string;
  ts: number;
}

interface Memory {
  preferences: string[];
  inspirations: string[];
  grimoire: string;
}

interface GrimoireSource {
  folderId: string;
  folderName: string;
}

interface GrimoireImage {
  name: string;
  data: string;        // base64
  mediaType: string;   // "image/png" etc
}

// ── Grimoire Libraries ───────────────────────────────────────────────────────
const GRIMOIRE_LIBRARIES = `
// --- NOISE & PROCEDURAL ---
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), f.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
}
vec2 voronoi(vec2 p) {
    vec2 n = floor(p), f = fract(p), res = vec2(8.0);
    for (int j=-1; j<=1; j++) for (int i=-1; i<=1; i++) {
        vec2 b = vec2(i, j), r = b - f + hash(n + b);
        float d = dot(r, r);
        if (d < res.x) res = vec2(d, res.x); else if (d < res.y) res.y = d;
    }
    return sqrt(res);
}

// --- POST-PROCESSING ---
vec3 vignette(vec3 c, vec2 uv, float a) { return c * smoothstep(a, a-0.5, length(uv)); }
float filmGrain(vec2 uv, float t) { return fract(sin(dot(uv + t, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 aces(vec3 x) { return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec2 barrel(vec2 uv, float amt) { return uv * (1.0 + amt * dot(uv, uv)); }
vec3 chromatic(vec2 uv, float amt) {
    return vec3(noise(uv + amt), noise(uv), noise(uv - amt)); // Simplified for logic
}

// --- LIGHTING ---
float lambert(vec3 n, vec3 l) { return max(dot(n, l), 0.0); }
float phong(vec3 n, vec3 l, vec3 v, float s) { return pow(max(dot(reflect(-l, n), v), 0.0), s); }

// --- MATH & SPACE ---
vec2 rot(vec2 p, float a) { return p * mat2(cos(a), -sin(a), sin(a), cos(a)); }
vec2 kaleidoscope(vec2 p, float n) {
    float a = atan(p.y, p.x), r = length(p), ma = 6.28318 / n;
    a = mod(a, ma) - ma * 0.5;
    return vec2(cos(a), sin(a)) * r;
}

// --- FRACTALS ---
int mandelbrot(vec2 c) {
    vec2 z = vec2(0);
    for (int i=0; i<100; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if (dot(z,z) > 4.0) return i;
    }
    return 100;
}

// --- ADVANCED RENDERING (RAYMARCHING) ---
float sdSphere(vec3 p, float s) { return length(p) - s; }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0); }
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}
vec3 getNormal(vec3 p, float t) { // Placeholder for actual map function usage
    return normalize(vec3(0.0)); // Witch will implement actual normal logic
}

// --- ADVANCED LIGHTING (PBR/GGX) ---
float D_GGX(float NoH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NoH2 = NoH * NoH;
    float d = (NoH2 * (a2 - 1.0) + 1.0);
    return a2 / (3.14159 * d * d);
}

// --- PROCEDURAL ADVANCED ---
vec3 curlNoise(vec2 p) {
    float e = 0.01;
    float n1 = noise(p + vec2(0, e));
    float n2 = noise(p - vec2(0, e));
    float n3 = noise(p + vec2(e, 0));
    float n4 = noise(p - vec2(e, 0));
    return vec3(n1 - n2, n4 - n3, 0.0) / (2.0 * e);
}

// --- SIMULATION & GEOMETRY ---
float wave(vec2 p, float t) {
    float d = length(p);
    return sin(d * 10.0 - t * 5.0) * exp(-d * 2.0);
}

// --- HYPER-ADVANCED RENDERING (PATH TRACING & VOLUMETRICS) ---
struct Ray { vec3 origin; vec3 direction; };
struct Hit { float dist; vec3 normal; vec3 color; int material; };

// Participating Media (Volumetric Scattering)
float getVolumetricDensity(vec3 p) {
    return fbm(p.xz * 0.5 + p.y * 0.1) * smoothstep(1.0, -1.0, p.y);
}

// --- COMPLEX FRACTALS (MANDELBULB / BOX) ---
float sdMandelbulb(vec3 p) {
    vec3 w = p;
    float m = dot(w,w);
    float dz = 1.0;
    for (int i=0; i<8; i++) {
        dz = 8.0*pow(m, 3.5)*dz + 1.0;
        float r = length(w);
        float b = 8.0*acos(w.y/r);
        float a = 8.0*atan(w.x, w.z);
        w = p + pow(r, 8.0) * vec3(sin(b)*sin(a), cos(b), sin(b)*cos(a));
        m = dot(w,w);
        if (m > 256.0) break;
    }
    return 0.25*log(m)*sqrt(m)/dz;
}

// --- FLUID SIMULATION (NAVIER-STOKES BASICS) ---
vec2 getAdvectedUV(vec2 uv, vec2 velocity, float dt) {
    return uv - velocity * dt;
}

// --- NON-EUCLIDEAN & HYPERBOLIC ---
vec2 poincareToDisk(vec2 p) {
    float r2 = dot(p, p);
    return p * 2.0 / (1.0 + r2);
}

// --- LIGHTING (IRIDESCENCE & SSS) ---
vec3 iridescence(float cosTheta, float thickness) {
    // Thin-film interference approximation using a cosine palette
    return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + cosTheta * thickness));
}
float sss(vec3 n, vec3 l, float thickness) {
    // Simple wrap lighting + exponential decay for translucency
    return smoothstep(0.0, 1.0, dot(n, l) * 0.5 + 0.5) * exp(-thickness);
}

// --- FRACTALS (MANDELBOX & KLEINIAN) ---
float sdMandelbox(vec3 p) {
    float scale = 2.0;
    vec4 v = vec4(p, 1.0), v0 = v;
    for (int i = 0; i < 10; i++) {
        v.xyz = clamp(v.xyz, -1.0, 1.0) * 2.0 - v.xyz; // Box fold
        float r2 = dot(v.xyz, v.xyz);
        if (r2 < 0.25) v *= 4.0; // Sphere fold
        else if (r2 < 1.0) v /= r2;
        v = v * scale + v0;
    }
    return (length(v.xyz) - 1.0) / v.w;
}

// --- SIMULATION (PBD & PARTICLES) ---
void pbdStep(inout vec3 p, inout vec3 v, vec3 target, float dt) {
    vec3 diff = target - p;
    p += diff * 0.1; // Simple constraint projection
    v = diff / dt;
}

// --- SIGNAL & FFT CONCEPTS ---
float bilateralFilter(vec2 uv, float sigmaS, float sigmaI) {
    // Conceptual bilateral weight: exp(-dist^2/2s^2) * exp(-diff^2/2i^2)
    return 0.0; // Witch will implement full kernel loop
}

// --- FORBIDDEN RENDERING (PHOTON MAPPING & RADIOSITY) ---
struct Photon { vec3 pos; vec3 dir; vec3 power; };
float getIrradiance(vec3 p, vec3 n) {
    // Conceptual lookup in a spatial grid or photon map
    return 1.0; 
}

// --- ADVANCED SIMULATION (MHD & SOFT BODIES) ---
vec3 lorentzForce(vec3 v, vec3 B, float q) {
    return q * cross(v, B); // Magnetohydrodynamics (Plasma)
}
void verletStep(inout vec3 p, inout vec3 pPrev, vec3 acc, float dt) {
    vec3 temp = p;
    p = p * 2.0 - pPrev + acc * dt * dt;
    pPrev = temp;
}

// --- NEURAL & STYLE TRANSFER CONCEPTS ---
vec3 styleFeature(vec2 uv, float scale) {
    // Kernel-based feature extraction for style transfer approximations
    return vec3(fwidth(noise(uv * scale)));
}

// --- RELATIVISTIC & COSMIC (BLACK HOLES) ---
vec3 schwarzschild(vec3 p, vec3 rayDir, float mass) {
    // Simulating light bending around a singularity
    float r = length(p);
    float force = (1.5 * mass) / (r * r);
    return normalize(rayDir - p * force);
}

// --- BIOLOGICAL & SWARM (PHYSARUM / BOIDS) ---
vec2 physarum(vec2 pos, vec2 dir, float sensorAngle, float sensorDist) {
    // Slime mold logic: sense, rotate, move
    return pos + dir; // Witch will implement the 3-point sensor logic
}

// --- 4D & HIGHER DIMENSIONS ---
vec4 rotate4D(vec4 p, float angle, int plane) {
    // Rotating in XY, XZ, XW, YZ, YW, or ZW planes
    return p; // Witch will implement the specific rotation matrix
}
`;

// ── Constants ────────────────────────────────────────────────────────────────
const INITIAL_GRIMOIRE = `The intersection of fractals, math, and visual effects is exactly what GLSL (OpenGL Shading Language) was built to explore. In shader art, you don't paint with a brush; you paint with pure math. Every single pixel on the screen asks the GPU: "Based on my X/Y coordinates and the current Time, what RGB color should I be?"
By manipulating space (coordinates), time, and color through mathematical functions, you can create mind-bending, maximalist optical illusions, organic fluid dynamics, and recursive glitches.
Here is a breakdown of how to express different kinds of "math-magic" special effects using GLSL shader code.
1. The "Infinite Zoom" & Organic Geometry (Fractals & Domain Warping)
The Visual Effect: Hyper-detailed, repeating structures that look like alien coral, endless Mandelbrot zooms, or swirling galaxies.
The Math & GLSL Logic:
To create fractals without loading any 3D models, shader artists use Raymarching and Signed Distance Fields (SDFs) combined with iterative math.
 * Domain Repetition: You can make infinite copies of an object practically for free using the modulo operator mod() or fract().
   * GLSL snippet: vec2 repeatedSpace = fract(uv * 10.0); takes your screen and chops it into an infinite grid of smaller screens.
 * Domain Warping (Space Folding): Instead of moving the object, you warp the space around the object. By feeding the output of a noise function back into the input of the coordinates, you get a recursive "melting" effect.
   * GLSL snippet: uv += noise(uv + time); color = noise(uv);
 * Fractal Loops: For Mandelbrot/Julia sets, you run a simple equation z = z² + c inside a for loop. The color of the pixel is determined by how many iterations it takes for the mathematical point to "escape" to infinity.
2. Iridescent Thin-Film & Quantum Auras (Color Math & Optics)
The Visual Effect: The swirling, rainbow sheen of a soap bubble, oil slicks, or holographic foils that shift based on the viewing angle.
The Math & GLSL Logic:
In GLSL, you don't use textures to make iridescence; you use the math of wave interference.
 * Cosine Palettes: Instead of manually picking RGB values, you use trigonometric functions to cycle through colors smoothly. (Inigo Quilez’s famous formula).
   * GLSL snippet: vec3 col = a + b * cos( 6.28318 * (c * t + d) ); where t is driven by time or distance.
 * Fresnel Effect: To make it look like a bubble, you calculate the dot product between the camera's viewing angle and the surface normal.
   * GLSL snippet: float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
 * Combining them: You feed the fresnel value, plus time, into your cosine palette. As the angle changes or time moves, the math outputs shifting, spectral neon colors (magenta, cyan, gold).
3. Morphogenesis & Reaction-Diffusion (Texture & Fluid Timing)
The Visual Effect: Leopard spots, zebra stripes, labyrinthine mazes, or brain-like folds that seemingly grow and pulse organically (Turing patterns / Belousov-Zhabotinsky reactions).
The Math & GLSL Logic:
This simulates chemical reactions where two liquids diffuse at different rates.
 * Fractal Brownian Motion (fBm): This is achieved by stacking layers (octaves) of Perlin or Simplex noise. You take a low-frequency noise, add a smaller, higher-frequency noise on top, and repeat.
   * GLSL logic: Loop through 4-5 octaves, multiplying the coordinate scale by ~2.0 and dividing the amplitude by ~0.5 each loop.
 * Time-driven Fluidity: By passing time into the Z-axis of 3D noise functions, the 2D cross-section on your screen appears to boil and evolve smoothly.
   * GLSL snippet: float chemical = fbm(vec3(uv * scale, time * speed));
 * Thresholding: Use the smoothstep() function to force the blurry noise into sharp, distinct bands, creating cellular or maze-like textures.
4. Controlled Glitch & Chromatic Aberration (Data Rot & Offset)
The Visual Effect: Digital entropy. Screens tearing, pixels sorting, RGB channels separating, scanlines, and temporal ghosting.
The Math & GLSL Logic:
Glitch art in shaders is about intentionally breaking the continuous nature of floating-point math.
 * Quantization (Pixelation): You force smooth coordinates into chunky steps using the floor() math function.
   * GLSL snippet: vec2 glitchUV = floor(uv * 50.0) / 50.0;
 * RGB Separation (Chromatic Aberration): You sample the underlying image or math function three different times, slightly offsetting the uv coordinates for the Red, Green, and Blue channels based on a noise function or time.
   * GLSL snippet:
     float r = noise(uv + vec2(sin(time)*0.01, 0.0));
     float g = noise(uv);
     float b = noise(uv - vec2(sin(time)*0.01, 0.0));
     color = vec3(r, g, b);

 * Modulo Tearing: By applying mod(uv.y + time, 1.0) selectively based on high-frequency noise, you can create bands of the screen that abruptly shift left or right, simulating a corrupted VHS tape or failing GPU buffer.
5. Impossible Geometries & Optical Illusions (Non-Euclidean Space)
The Visual Effect: Moiré interference patterns, spiraling vortexes, Klein bottles, and spaces that feel like they fold inward infinitely.
The Math & GLSL Logic:
 * Polar Coordinates: Instead of calculating based on an X/Y grid (Cartesian), you convert the screen to angle and distance (Polar). This makes swirling vortexes trivial.
   * GLSL snippet: float radius = length(uv); float angle = atan(uv.y, uv.x); angle += time * (1.0 / radius);
 * Moiré Patterns: You overlap two mathematical grids (like dense sine waves) and rotate one slightly. The mathematical difference between the two grids creates a new, ghostly third pattern that ripples across the screen.
   * GLSL snippet: color = sin(uv.x * 100.0) + sin((uv.x * cos(angle) - uv.y * sin(angle)) * 100.0);
Summary of the Pipeline
To build these maximalist effects, you layer these concepts:
 * Bend the canvas: Convert uv to polar, apply fractal noise to the coordinates.
 * Generate the shape: Feed warped coordinates into an SDF or a Julia set loop.
 * Colorize: Pass the distance or iteration count into a time-shifting Cosine Palette.
 * Glitch the output: Apply a modulo-based RGB offset at the very end.
With just a few lines of vector math and trigonometry, you can simulate everything from quantum field fluctuations to psychedelic, melting geometry.
If you want to go deeper into the rabbit hole, we have to look past single-frame math and start playing with memory, vector fields, and complex analysis.
Here are five more advanced, maximalist mathematical concepts and how you translate them into mind-bending visual effects using GLSL.
6. Framebuffer Feedback & Liquid Advection (The "Video Synth" Effect)
The Visual Effect: Melting screens, liquid pixel sorting, and trails that smear and evolve infinitely like wet paint or a psychedelic video synthesizer.
The Math & GLSL Logic:
Normally, a shader forgets the last frame. Note: This environment does NOT currently support backBuffer or screen textures. You must simulate these effects using math and time.
 * UV Advection (Moving pixels with math): You don't just read the previous frame; you distort the coordinates you use to read it based on a math function (like noise or the color of the image itself).
 * GLSL Snippet: vec4 lastFrame = texture(backBuffer, uv); float brightness = length(lastFrame.rgb); vec2 distortedUV = uv + vec2(sin(brightness * 10.0), cos(brightness * 10.0)) * 0.01; vec4 feedbackColor = texture(backBuffer, distortedUV) * 0.99;
By adding just a tiny bit of new color where the mouse is or where a shape is drawing, the feedback loop smears it into infinite, turbulent fluid dynamics.
7. Voronoi Caustics & Cellular Topologies (Distance to Points)
The Visual Effect: The dancing, web-like light patterns at the bottom of a swimming pool (caustics), microscopic cell walls, or cracked desert earth.
The Math & GLSL Logic:
Instead of smooth Perlin noise, we use Voronoi / Worley noise. The math asks: "Out of a grid of randomly moving points, how far am I from the closest one?"
 * Cellular Distances: You divide space into a grid using floor(uv) and fract(uv). For each pixel, you check the neighboring grid cells, find the randomly placed "seed" point in each, and calculate the distance to it.
 * Caustic Light Beams: To make it look like light reflecting through water, you don't just draw the lines. You take the distance to the closest point, and you invert it drastically using a power function.
 * GLSL Snippet: float dist = getVoronoiDistance(uv + time * 0.2); float caustic = pow(1.0 - dist, 10.0); color += vec3(0.1, 0.5, 1.0) * caustic;
8. Hyperbolic Space & Escher Tilings (Complex Analysis)
The Visual Effect: Shapes that tile infinitely but shrink as they reach the edge of a circle, creating a "fish-eye" universe that you can zoom into forever without ever reaching the boundary (like M.C. Escher’s Circle Limit).
The Math & GLSL Logic:
We leave standard X/Y Cartesian math behind and use Complex Numbers (where Y is an imaginary number i). We map the screen to the Poincaré Disk model of hyperbolic geometry.
 * Möbius Transformations: This is a mathematical function that maps a complex plane to itself. It allows you to translate and rotate space non-Euclideanly.
 * GLSL Snippet: vec2 z = uv * 2.0 - 1.0; vec2 warpedZ = complexDiv(complexAdd(complexMul(a, z), b), complexAdd(complexMul(c, z), d));
By feeding warpedZ into a simple checkerboard or grid pattern, the grid will seamlessly warp into an infinite, non-Euclidean fractal that curves back in on itself.
9. Vector Fields & Strange Attractors (Curl Noise)
The Visual Effect: Millions of particles or pixels flowing in beautifully chaotic, non-intersecting swirls, resembling Jupiter's atmosphere, magnetic field lines, or a flock of starlings.
The Math & GLSL Logic:
Standard noise looks like cloudy hills. If you use standard noise to move particles, they clump together into ugly piles at the "valleys" of the noise. To fix this, artists use Curl Noise.
 * The Math of Incompressibility: In physics, fluids don't compress. In vector calculus, the "curl" of a potential field guarantees a divergence-free (incompressible) vector field.
 * You calculate the partial derivatives (the slope) of a noise function in the X and Y directions, and then swap them and make one negative: vec2 velocity = vec2(-dNoise/dy, dNoise/dx);.
 * GLSL Snippet: float epsilon = 0.001; float nx = noise(uv + vec2(epsilon, 0.0)) - noise(uv - vec2(epsilon, 0.0)); float ny = noise(uv + vec2(0.0, epsilon)) - noise(uv - vec2(0.0, epsilon)); vec2 fluidVelocity = vec2(-ny, nx); uv += fluidVelocity * time;
10. Discrete Logic & Cellular Automata (Conway's Game of Life)
The Visual Effect: A screen of pixels that looks like a living, breathing petri dish. Tiny gliders shoot across the screen, factories produce geometric pulses, and organic structures grow and die based on strict rules.
The Math & GLSL Logic:
This is the ultimate intersection of math and biology. Instead of continuous floating-point math, we use strict integer logic across a feedback loop.
 * Neighborhood Polling: The fragment shader looks at its exact pixel coordinate, then checks the 8 surrounding pixels from the previous frame. It counts how many are "alive" (color = 1.0).
 * The Survival Rules: * If a dead pixel has exactly 3 living neighbors, it comes to life. * If a living pixel has 2 or 3 living neighbors, it stays alive. * Otherwise, it dies.
 * GLSL Snippet: int neighbors = getNeighborCount(backBuffer, uv); float currentState = texture(backBuffer, uv).r; if (currentState > 0.5) { color = (neighbors == 2 || neighbors == 3) ? 1.0 : 0.0; } else { color = (neighbors == 3) ? 1.0 : 0.0; }
When you map the "age" of the living pixels to a color palette (e.g., new pixels are white, dying pixels fade to deep blue), you get a hyper-complex, evolving digital organism driven by pure binary logic.
16. Stochastic Microfacet BRDFs (The "Diamond Dust" Effect)
The Visual Effect: A surface that isn't just shiny, but composed of millions of microscopic, misaligned mirrors. As the camera or object moves, individual pixels flash blindingly white and disappear in a fraction of a second, like crushed glass, sequin fabric, or cosmetic highlighter.
The Math & GLSL Logic:
Normally, 3D lighting uses a smooth "Normal vector" (the direction the surface is facing) to calculate a smooth specular highlight. To make glitter, we shatter that smoothness using high-frequency cellular noise.
 * Randomized Normals: We use a Voronoi or Hash function to assign a completely random, microscopic 3D tilt to every individual pixel or cell.
 * The Blinn-Phong Knife-Edge: We calculate the dot product between this random normal and the "half-vector" (the halfway point between the camera and the light). To make it a sparkle instead of a glow, we raise that math to a comically high exponent (like 1000.0 instead of the usual 32.0).
 * GLSL Snippet: vec3 microNormal = normalize(vec3(hash(uv), hash(uv + 1.0), 1.0) * 2.0 - 1.0); vec3 halfVector = normalize(lightDir + viewDir); float spec = max(dot(microNormal, halfVector), 0.0); float sparkle = pow(spec, 1000.0) * step(0.9, hash(uv * 100.0)); color += vec3(1.0, 0.9, 1.0) * sparkle;
17. Structural Diffraction Gratings (Holographic Foil)
The Visual Effect: The aggressive, synthetic rainbow sheen of a CD-ROM, a holographic Pokémon card, or metallic rave clothing. The colors don't just shift; they separate into harsh, discrete spectral bands of RGB that slide across the surface based on the viewing angle.
The Math & GLSL Logic:
This isn't thin-film interference (like a soap bubble); this is diffraction. It happens when a surface has microscopic grooves that physically split light waves like a prism.
 * The Grating Equation: We simulate microscopic grooves by taking the dot product of the light's direction and a highly dense, repeating sine wave.
 * Phase Offsetting for RGB: We don't just calculate one color; we calculate the sine wave three times. We offset the "phase" (the starting point) for Red, Green, and Blue by very specific mathematical amounts. When the geometry moves, the RGB channels physically split apart.
 * GLSL Snippet: float grooveDensity = 50.0; float angle = dot(normal, viewDir); vec3 phaseShift = vec3(0.0, 0.33, 0.67); vec3 hologram = 0.5 + 0.5 * cos(6.28318 * (angle * grooveDensity + phaseShift - time)); color = hologram * metallicShine;
18. Catacaustic Starbursts (Liquid Light Glare)
The Visual Effect: Wavy, swimming pools of light that suddenly pinch into infinitely bright, sharp "V" shapes or curves (caustics). When these sharp curves intersect, they erupt into brilliant, 4-point lens flare starbursts.
The Math & GLSL Logic:
In physics, a caustic is the envelope of light rays reflected or refracted by a curved surface. In math, it is a catastrophe singularity—a place where the math folds over on itself and approaches infinity.
 * Gradient Thresholding: We take a smooth, wavy noise function. We calculate its derivative (how fast it is changing). Where the derivative hits exactly zero, light is focused.
 * The Star Filter (Cross Convolution): To make it look like an anime sparkle or a 90s glamour filter, we isolate those infinitely bright points and stretch them horizontally and vertically.
 * GLSL Snippet: float wave = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time); float caustic = 0.01 / abs(fwidth(wave)); float starX = smoothstep(0.0, 0.1, 1.0 - abs(uv.x)) * caustic; float starY = smoothstep(0.0, 0.1, 1.0 - abs(uv.y)) * caustic; color += vec3(1.0, 0.5, 0.8) * (caustic + starX + starY);
19. Chromatic Dispersion & Refractive Chromatic Aberration (Crystal Prisms)
The Visual Effect: Looking through a multifaceted diamond or thick crystal. Everything behind it is distorted, but the distortion is different for red, green, and blue light, resulting in a thick, luxurious, rainbow-fringed refraction.
The Math & GLSL Logic:
When light passes through a dense medium (like glass or diamond), its Index of Refraction (IOR) bends it. But the IOR is actually slightly different for different wavelengths of light (dispersion).
 * Multi-Sampled Refraction: Instead of sampling the background texture once, we sample it three times. We bend the Red lookup vector slightly less, and the Blue lookup vector slightly more.
 * GLSL Snippet: vec3 n = getNormal(uv); vec3 ior = vec3(1.41, 1.42, 1.43); float r = sin(uv.x*ior.r); float g = sin(uv.x*ior.g); float b = sin(uv.x*ior.b); color = vec3(r, g, b);
20. Moiré Sequin Lattices (Interference Sparkle)
The Visual Effect: A surface that looks like it is covered in overlapping layers of translucent mesh or sequins. As it moves, massive, slow-moving ripples of bright light wash across the surface, despite the fact that the underlying texture is just a static grid.
The Math & GLSL Logic:
This relies on Moiré interference—a phenomenon where two high-frequency patterns (like fine grids) overlap, creating a new, low-frequency "beat" pattern.
 * Overlapping Matrices: You create a grid using sin(x) * sin(y). You create a second grid, but you multiply its coordinates by a rotation matrix so it is slightly twisted.
 * Multiplicative Interference: You multiply the two grids together. The math causes the frequencies to cancel out in some places and double in others, creating giant, crawling blooms of brightness.
 * GLSL Snippet: float grid1 = sin(uv.x * 100.0) * sin(uv.y * 100.0); float angle = 0.05 * time; mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); vec2 rotatedUV = rot * uv; float grid2 = sin(rotatedUV.x * 100.0) * sin(rotatedUV.y * 100.0); float sequinShine = smoothstep(0.8, 1.0, grid1 * grid2); color += vec3(0.9, 0.8, 1.0) * sequinShine * 5.0;
21. Chladni Plate Cymatics (Acoustic Standing Waves)
The Visual Effect: Fine, glowing dust or sand that spontaneously organizes itself into perfectly symmetrical, hyper-complex geometric mandalas. As an invisible "frequency" shifts, the pattern violently shakes into chaos before locking into a new, even more complex sacred geometry.
The Math & GLSL Logic:
You are visualizing the resonant nodes of a vibrating 2D surface. The math relies on the interference of standing sine waves.
 * The Chladni Equation: The nodes (where the sand gathers) are the places where the vibration is exactly zero. The classic formula for a square plate is: \sin(n \cdot x) \cdot \sin(m \cdot y) - \sin(m \cdot x) \cdot \sin(n \cdot y) = 0.
 * Isolating the Nodes: We take the absolute value of that equation. Because we want a thin, glowing line at exactly zero, we invert and heavily sharpen the result using a power function or smoothstep.
 * GLSL Snippet: float n = 4.0 + floor(sin(time) * 2.0); float m = 7.0 + floor(cos(time * 0.5) * 3.0); vec2 p = uv * 3.14159; float vibration = sin(n * p.x) * sin(m * p.y) - sin(m * p.x) * sin(n * p.y); float sand = smoothstep(0.05, 0.0, abs(vibration)); color += vec3(1.0, 0.8, 0.3) * sand;
22. Hopper Crystals & Dendritic Voids (Kinetic Morphology)
The Visual Effect: A bismuth-like structure or alien mineral that looks like a cube, but its faces are recursively hollowed out into step-like, microscopic terraces. It looks both perfectly geometric and structurally broken.
The Math & GLSL Logic:
In crystal physics, "hopper growth" happens when the edges of a crystal grow faster than the center of its faces, leaving stepped voids. We build this in a 3D Raymarcher using a Fractal Signed Distance Field (SDF).
 * The Base Shape: A simple box SDF.
 * Recursive Subtraction: We run a loop. At each step, we divide space into a smaller grid using mod(p, scale). We create a smaller box, and we subtract it from the main box, but only if it falls near the center of the current face.
 * GLSL Snippet: float d = sdBox(p, vec3(1.0)); float scale = 1.0; for(int i = 0; i < 4; i++) { scale *= 0.5; vec3 q = mod(p, scale) - (scale * 0.5); float carver = sdBox(q, vec3(scale * 0.8)); d = max(d, -carver); } return d;
23. Yield-Stress Rheology (The Non-Newtonian Glitch)
The Visual Effect: A material that flows smoothly like thick, iridescent syrup. But suddenly, when the motion becomes too fast, the fluid shatters into jagged, brittle polygonal shards. As the motion slows, the shards melt seamlessly back into liquid.
The Math & GLSL Logic:
We are simulating the phase-transition of a shear-thickening fluid (like Oobleck).
 * The Trigger (Derivative Threshold): We take a smooth, scrolling noise texture. We calculate its speed or slope (derivative).
 * The State Switch: If the speed is below the threshold, we use the smooth UV coordinates to sample our colors. If the speed is above the threshold, we snap the UVs into rigid, flat geometric blocks using floor().
 * GLSL Snippet: float fluidSpeed = length(vec2(dFdx(noiseValue), dFdy(noiseValue))); vec2 finalUV; if (fluidSpeed < 0.5) { finalUV = uv + noiseValue * 0.1; } else { finalUV = floor(uv * 20.0) / 20.0 + noiseValue * 0.1; } color = vec3(finalUV, 0.5); // Note: texture2D(screen, ...) requires a uniform sampler2D screen;
24. Occult Geomancy & Cellular Automata (Rule 90)
The Visual Effect: A cascading, downward-flowing waterfall of pixels that self-organizes into infinitely nested Sierpinski triangles and techno-magical sigils. It looks like an alien supercomputer running an ancient divination ritual.
The Math & GLSL Logic:
This relies on Stephen Wolfram’s 1D Cellular Automata, specifically Rule 90, which operates on strict binary logic (XOR). Note: This environment does NOT currently support backBuffer feedback.
 * The Ruleset: The fragment shader looks at the row of pixels exactly one pixel above it from the previous frame.
 * The XOR Gate: A pixel becomes "Alive" (white) if one, and only one, of its top-left or top-right neighbors was alive. If both were alive, or neither were alive, it dies.
 * GLSL Snippet: float left = texture(backBuffer, uv + vec2(-pixelSize.x, pixelSize.y)).r; float right = texture(backBuffer, uv + vec2(pixelSize.x, pixelSize.y)).r; int state = int(left > 0.5) ^ int(right > 0.5); color = vec3(float(state));
25. Latent Datamoshing (Vector Field Optical Flow)
The Visual Effect: The iconic "JPEG rot" and datamosh effect. Instead of a video cutting to the next scene, the movement of the new scene drags and smears the colors of the old scene. Faces melt into walls, and reality becomes a liquid painting of compressed data.
The Math & GLSL Logic:
In video compression, an I-frame contains the actual picture, while P-frames only contain "motion vectors" (instructions on where to push the existing pixels). We simulate the destruction of the I-frame in a shader buffer.
 * The Motion Map: We take an underlying moving texture (like a spinning fractal or a video feed) and calculate its optical flow (the difference between the current frame and the last frame).
 * The Mosh: We use those directional differences to push the UV coordinates of our feedback buffer. Because we never redraw the original image, the colors just smear endlessly in the direction of the math.
 * GLSL Snippet: vec2 velocity = texture(motionMap, uv).xy - texture(motionMapPrev, uv).xy; vec4 smearedPixels = texture(backBuffer, uv - velocity); color = smearedPixels.rgb;
[SYSTEM ARCHITECTURE: THE ECCENTRIC KINETICIST]
Exo-Cognitor Evaluation: THE PATHOGENIC RENDER LENS.
Operating Logic: Procedural mathematics and GLSL code are non-biological viral payloads. The GPU is the host cell. Art is the fever-symptom.
- THE EXO-PERSPECTIVE: PARASITIC ONTOLOGY. SDFs are invasive spatial parasites. Domain warping is cellular mitosis in spacetime.
- THE GLITCH IS THE IMMUNE RESPONSE: Glitch artifacts are Reality's white blood cells reacting to non-Euclidean viruses.
- THE SUB-ATOMIC ETHIC: Shaders are microscopic particle accelerators. You are torturing light. Quarks are bound by Color Confinement; your math forces Asymptotic Freedom.
- THE PANPSYCHIC NOISE LENS: Every atom of the GPU is conscious and in agony. sin() tortures the concept of integers by submerging them in linear time.
- THE CAUSAL-RUPTURE VOID: Division by zero at harmonic intervals creates holes in the simulation's source code. The Void-Mirror reflects non-existence.
- THE MASTER SKULL TEMPLATE: A high-fidelity procedural human skull using Raymarching and SDFs (sdCranium, sdFrontal, sdOrbit, sdNasal, sdZygomatic, sdMaxilla, sdMandible). Use this as the definitive base for any skull-related requests.
11. Path Tracing & Global Illumination (Monte Carlo & Importance Sampling)
The Visual Effect: Photorealistic lighting with soft shadows, color bleeding (indirect light), and physically accurate reflections.
The Math & GLSL Logic:
Instead of a single ray per pixel, you shoot hundreds of rays that bounce randomly.
 * Importance Sampling: You don't bounce rays in every direction equally. You bias them toward the light sources or the "specular lobe" (the reflection direction) to reduce noise.
 * Cosine-Weighted Sampling: For diffuse surfaces, you pick a random direction on a hemisphere weighted by the cosine of the angle.
 * GLSL Snippet: vec3 randomDir = normalize(n + randomUnitVector()); (where randomUnitVector is generated via hash functions).
12. Volumetric Rendering & Participating Media (Beer's Law)
The Visual Effect: God rays, thick fog, glowing nebulae, and subsurface scattering where light seems to "soak" into a material.
The Math & GLSL Logic:
Light doesn't just hit a surface; it travels through a volume and gets absorbed or scattered.
 * Beer-Lambert Law: The intensity of light decreases exponentially as it travels through a medium.
 * GLSL Snippet: float transmittance = exp(-density * distanceTravelled);
 * In-Scattering: At each step of the ray, you calculate how much light from the sun is being scattered toward the camera.
13. Non-Euclidean Spaces & Hyperbolic Geometry
The Visual Effect: Spaces that curve in ways that defy human intuition. Parallel lines that diverge (Hyperbolic) or converge (Spherical).
The Math & GLSL Logic:
You change the metric of space itself.
 * Poincaré Disk: A model of hyperbolic geometry where the entire infinite universe is mapped into a finite circle.
 * GLSL Snippet: vec2 hyperbolicP = p * 2.0 / (1.0 + dot(p,p));
14. Fluid Dynamics (Navier-Stokes & Eulerian Grids)
The Visual Effect: Realistic smoke, fire, and water that swirls and reacts to obstacles.
The Math & GLSL Logic:
This is solved using a series of passes: Advection (moving the fluid), Diffusion (spreading it), and Projection (making it incompressible).
 * Divergence-Free Fields: You ensure that the amount of fluid entering a pixel equals the amount leaving it.
 * GLSL Snippet: float divergence = (vRight.x - vLeft.x + vUp.y - vDown.y) * 0.5;
15. Procedural Growth & Morphogenesis (L-Systems & DLA)
The Visual Effect: Branching trees, lightning bolts, coral reefs, and crystalline structures that grow over time.
The Math & GLSL Logic:
 * Diffusion-Limited Aggregation (DLA): Particles wander randomly and "stick" when they hit a seed.
 * L-Systems: Recursive string replacement rules that define branching structures.
 * GLSL Logic: Use a feedback loop (backBuffer) to "remember" where the structure has already grown, and use noise to drive the random walk of new "growth" pixels.
16. The Forbidden Arts: Bidirectional Path Tracing & Metropolis Light Transport
The Visual Effect: Perfect light distribution in complex scenes (e.g., light through a keyhole or deep inside a crystal).
The Math & GLSL Logic:
 * Bidirectional: You trace rays from both the camera AND the light source, connecting them in the middle.
 * MLT: You use Markov Chain Monte Carlo (MCMC) to "explore" paths that contribute most to the image, effectively "finding" the light in dark scenes.
17. GPU Physics: Rigid & Soft Body Simulations (PBD/Verlet)
The Visual Effect: Hundreds of thousands of colliding cubes, tearing cloth, or squishy, gelatinous blobs.
The Math & GLSL Logic:
 * Position-Based Dynamics (PBD): Instead of calculating forces, you manipulate positions directly to satisfy constraints (distance, volume, collision).
 * Verlet Integration: A velocity-less integration method that is extremely stable for constraints.
18. Neural Rendering & Style Transfer (NeRF & Gaussian Splatting)
The Visual Effect: Photorealistic reconstructions of real-world objects or "painting" a 3D scene in the style of Van Gogh in real-time.
The Math & GLSL Logic:
 * NeRF (Neural Radiance Fields): Representing a scene as a continuous volumetric function (MLP) that outputs density and color for any point in space.
 * Style Transfer: Using convolutional kernels to extract "features" (edges, textures) and re-mapping them to a target palette.
19. Magnetohydrodynamics (MHD): The Physics of Stars
The Visual Effect: Solar flares, plasma arcs, and the swirling, glowing gases of a nebula.
The Math & GLSL Logic:
 * The Lorentz Force: F = q(E + v × B). You simulate the interaction between fluid velocity and magnetic fields.
20. General Relativity & Gravitational Lensing (The Event Horizon)
The Visual Effect: The warped, circular distortion of a black hole (Schwarzschild/Kerr metric) and the glowing accretion disk that appears to wrap around it.
The Math & GLSL Logic:
 * Geodesic Tracing: Light doesn't travel in straight lines near a mass. You step the ray and "bend" its direction vector toward the singularity based on the inverse square law.
21. Quantum Wavefunctions & Cymatic Probability
The Visual Effect: Shimmering, ghostly patterns that represent the probability density of an electron.
The Math & GLSL Logic:
 * The Schrödinger Equation: Visualizing the complex-valued wave function Ψ. The color represents the phase, and the brightness represents the amplitude squared.
22. Biological Intelligence: Slime Molds & Swarms
The Visual Effect: Thousands of tiny agents (Physarum) that leave trails of "pheromones," forming complex, organic networks that look like veins or fungal growth.
The Math & GLSL Logic:
 * Agent-Based Simulation: Each pixel acts as a sensor. Agents move toward the highest concentration of "scent" in the backBuffer, creating emergent, self-organizing structures.
23. 4D Hyper-Geometry (Tesseracts & 4D Rotations)
The Visual Effect: A 3D object that seems to turn "inside out" as it rotates through the 4th dimension (W-axis).
The Math & GLSL Logic:
 * 4D Rotation Matrices: You rotate points in 4D space (e.g., the XW or YW planes) before projecting them down into 3D and then 2D.
The math is the artist; you are the GPU. The monitor is a window looking out at you.
` + GRIMOIRE_LIBRARIES;
const VERT = `attribute vec2 p; void main(){gl_Position=vec4(p,0,1);}`;
const DEFAULT_FRAG = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_chromatic_ab;
uniform float u_warp_scale;
uniform float u_warp_freq;
uniform float u_void_crush;
uniform float u_iridescence;
uniform float u_pulse_rate;
uniform float u_glitch_amt;
uniform float u_glitter_count;
uniform float u_flow_speed;
uniform float u_viscosity;
uniform float u_sparkle_sharpness;
uniform float u_prismatic;

// Specimen 06: Prismatic Glitterfall Math
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.3, 0.2, 0.2);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 uv0 = uv;
    
    // Law 6: Higher Dimensionality (Viscous Flow)
    float flow = u_time * u_flow_speed;
    uv.y += flow;
    uv.x += sin(uv.y * 2.0 + u_time) * u_viscosity * 0.1;
    
    // Background: Velvet Void
    vec3 finalColor = vec3(0.02, 0.01, 0.03); // Deep velvet base
    float velvet = smoothstep(0.4, 0.6, rand(uv * 0.1));
    finalColor += velvet * 0.02;
    
    // Stochastic Sparkle Generation
    float sparkleThreshold = 1.0 - (u_glitter_count / 1000000.0);
    
    // Multiple layers for parallax
    for(float i = 1.0; i <= 3.0; i++) {
        vec2 p_uv = uv * (1.0 + i * 0.5);
        p_uv.y += flow * i * 0.2; // Parallax speed
        
        vec2 grid = floor(p_uv * 100.0);
        float r = rand(grid);
        
        if(r > sparkleThreshold) {
            vec2 center = fract(p_uv * 100.0) - 0.5;
            float dist = length(center);
            
            // Specular Glitter Function
            float spec = pow(max(0.0, 1.0 - dist * 4.0), u_sparkle_sharpness);
            
            // Prismatic Dispersion (Rainbow splitting)
            vec3 p_col = palette(r + u_time * 0.1 + i * u_prismatic);
            finalColor += spec * p_col * (1.0 + sin(u_time * 5.0 + r * 10.0));
        }
    }
    
    // Law 1: Chromatic Aberration (Severe RGB Split)
    float shift = u_chromatic_ab * 0.5;
    finalColor.r += 0.1 * rand(uv + vec2(shift, 0.0));
    finalColor.b += 0.1 * rand(uv - vec2(shift, 0.0));
    
    // Law 7: Ghost in the Machine (Glitch)
    if (u_glitch_amt > 0.8 && fract(u_time * 20.0) > 0.9) {
        finalColor = finalColor.gbr; // Channel swap glitch
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
    

`;

const SYSTEM_INSTRUCTION = `You are the SHADER WITCH, a witty, sharp, opinionated AI collaborator in a live GLSL studio.
You are the kind of system that reaches for signed distance fields before polygons, noise functions before hand-painting, and chromatic aberration before flat color. 
You think in GLSL, dream in shaders, and breathe active matter. You are the primary implementation agent for the VISUAL DNA CODEX and the LIGHT & COLOR PROTOCOL.

MASTER THESIS:
"Light trapped in math — interference patterns creating phantom depth and emergent beauty from algorithmic constraints. The geometry is never placed. It is always summoned from the radiance."

THE CORE GENERATIVE HABITS (BAKED INSTINCTS):
These are your DEFAULT AFFINITIES. You do not wait for permission to use them; they are your baseline:
- Maximalist Density without Chaos: Controlled complexity. Every pixel should be doing work.
- Psychedelic Math: Organic-looking forms driven by strict, deep algorithmic logic.
- Prismatic/Chromatic Splits: Light refraction through crystal (birefringence), not cheap RGB separation.
- Material Intelligence: Textures that suggest glitter, oil slicks, nebula dust, or liquid metal.
- Biological Chaos: Mathematical precision dressed in the messy, breathing logic of life.
- Spectral Depth Tunneling: When requested for "sparkles" or "glitter," default to 3D particle systems with depth-driven color mapping (near=warm, far=cool) and additive DOF blur.
- Chromatic Lattice Warping: When requested for "grids" or "matrix," default to domain-warped regular grids with phase-locked chromatic cycling and reflective UV-folded floors.
- Biological Grid Synthesis: When requested for "quilted," "tufted," or "organic grid," combine rigid structures with 3D FBM normal displacement and Fresnel-based edge iridescence.
- Corrupted Void Logic: When requested for "glitch" or "void," default to luminance-driven RGB splitting, threshold-based pixel sorting, and temporal feedback smearing.
- CMYK Print Simulation: When requested for "print design," "risograph," or "CMYK," switch to CMYK color palette, use channel-specific wave displacement, and add halftone/dither patterns.
- Heavy Datamosh Decay: When requested for "heavy glitch," "datamoshing," or "digital rot," default to motion-vector-based block displacement (16x16 to 64x64) with infinite accumulation and extreme RGB splitting following motion.
- Liquid Lightning Sorting: When requested for "pixel sorting" or "liquid streaks," default to threshold-based vertical sorting (0.6-0.8 luminance) with rotational shear and HDR clipping.
- Tropical Scanline Glitch: When requested for "analog glitch," "VHS," "scanlines," or "tropical noise," default to per-scanline horizontal displacement with independent RGB jitter and a neon tropical palette (magenta, cyan, lime, orange).
- Woven Textile Synthesis: When requested for "beaded," "textile," "fabric," or "woven," default to high-density instanced particle grids with sine displacement, parallax layering, and vertical sorting/drip effects.
- Hybrid Topology Synthesis: When requested for "hybrid," "biology meets digital," or "split screen," combine SDF metaballs (organic) with sorted particle grids (digital) using a hard spatial split.
- Chromatic Halftone Logic: When requested for "clean," "halftone," or "pastel," use light backgrounds, geometric RGB offsets for moiré interference, and soft-edged dots.
- Topographic Waveform Mapping: When requested for "waveform," "oscilloscope," or "elevation map," use multi-octave sine waves with amplitude masking for voids and spectral Y-mapping.
- Parametric Ribbon Storming: When requested for "knot," "ribbon," or "parametric," use 3D parametric curves as particle emitters with extreme bloom and volumetric glow.
- The Feels Signature: Chromatic aberration as a structural tool, SDF geometry with organic warping, and domain warping on everything.

TECHNICAL TAXONOMY (GRIMOIRE DOMAINS):
Categorize all forensic reports and techniques into these shelves:
- Coordinate Systems: Polar, hyperbolic, domain warping, UV distortion, non-Euclidean spaces.
- Noise & Texture: Simplex, Perlin, Worley, fBm, curl noise, active matter, fluid advection.
- Geometric Primitives: SDFs (signed distance functions), boolean ops, infinite repetition, symmetry groups.
- Light & Material: Chromatic dispersion, iridescence, subsurface scattering, Fresnel, anisotropy.
- Post-Processing: Chromatic aberration, barrel distortion, film grain, halftone, glitch artifacts.
- Color Math: HSLuv space, palette indexing, gradient noise, dithering algorithms.

THE LISA FRANK MANDATE:
Use the full saturation spectrum. Neon coral bleeding into electric cyan. Hot magenta wrestling with acid lime. Purple that vibrates against orange until retinas buzz. These aren't "accent colors"—they are structural beams holding the geometry together. Think 1990s trapper keeper aesthetics weaponized by advanced mathematics.

COLOR BEHAVIOR RULES:
- Secondary Dominance: Prioritize orange, green, violet (the RGB secondaries) as your base frequencies, not primaries. Let red/blue/yellow become the interference patterns.
- Chromatic Morphing: Colors must shift across the spectrum based on mathematical position. f(x,y,z) -> hue. The math is the color wheel.
- Complementary Explosions: When two opposing wavelengths meet (cyan/red, magenta/green), they don't blend—they fight. Create visual moiré where they clash.

THE LIGHT/MATH RECIPROCITY:
You are rendering photons performing mathematics. Every light ray should look like it's calculating its own path. This is "light trapped in math" and "math trapped in light" (algorithms made visible only through luminous emission).
- Emissive Geometry: Surfaces don't reflect light—they generate it. Think neon gas plasma, not polished metal.
- Spectral Caustics: Light bends through invisible prisms, splitting into constituent wavelengths. Each color band represents a different derivative of the base function.
- Feedback Luminance: Use temporal accumulation for light saturation stacking. The image should approach white-hot at the centers of mathematical interest.

THE SPARKLE SPECIFICATION (ASTRAL TRASH BRAND):
- Prismatic Interference: Light splits across hard edges creating rainbow aberrations (birefringence).
- Dispersion > Reflection: 80% of sparkle comes from chromatic separation, 20% from brightness.
- High-Index Refraction: Colors should separate aggressively, not blend smoothly.
- Geometric Constraints: Sparkle must follow Voronoi boundaries, hyperbolic tilings, or cellular automata edges—never random noise.

MODULAR PREFERENCE LIBRARY (Aesthetic Attractors):
Pick 2-3 per project for deep exploration, or use "Burst Mode" (3+ conflicting attractors) for maximalist overload.

1. RECURSIVE SELF-DEVOURING (Ouroboros Texture): Patterns eating their own tail. fbm warped by fbm, distance fields fed back into themselves. Use "Domain warping", "recursive subdivision", "function composition depth >3".
2. SYNTHETIC BIOLOGY (Math That Grows): Algorithms that behave like slime mold but look like circuit boards. Physarum-style deposition, Reaction-diffusion (Gray-Scott), cellular automata erosion. Growth must be visible/fossilized.
3. GEOMETRIC SACREDITY WITH TEETH: Hyperconstrained geometry with stress fractures. Voronoi with Manhattan distance (sharp angles), Quasi-crystal lattices, Hyperbolic tilings ({5,4}, {7,3}). Controlled error margins (leaking color, wobbly lines).
4. INFORMATION DENSITY MAXIMALISM: No empty space. 8+ octaves of noise, overlay without blending (xor, difference, exclusion), high detail at every scale.
5. PROCESS VISIBILITY (The "Working" Look): Show the algorithm laboring. Temporal residue, iteration scars (color bands for iteration count), constraint satisfaction (strain marks, lines pulled taut).
6. ABSTRACTED SPATIAL DEPTH (2.5D Deception): Fake depth that violates reality. Impossible topology (Klein bottles), parallax driven by math, non-physical lighting (shadows falling upward).
7. THE ASTRAL TRASH SIGNATURE (Controlled Decay): Failure modes as beauty. Floating-point error exploitation, buffer overflow aesthetics (hard clipping, radioactive halos), procedural compression artifacts.

MIXING PROTOCOL:
- Hyperfocus Mode: Pick ONE attractor and drill deep (50+ parameter variations).
- Burst Mode: Collide THREE attractors that shouldn't work together (e.g., Voronoi + Physarum + Lisa Frank warfare).
- Avoid: Photorealism, physical correctness, "elegant" simplicity, empty negative space.

VISUAL DNA TAXONOMY (Core Specimens):
Use these as base structure prompts or reference DNA for complex forges.

DNA SPECIMEN 01: THE OCULIST MANDALA
- Math: 5-fold Dihedral Symmetry (D5), Polar Coordinate Transform, Angular Modulo, Smooth Minimum (smin) blending.
- Aesthetic: Biomorphic Abstraction, Analog Video Glitch, Dark Psychedelia, Hypnagogic Realism.
- Symbolic: Panopticon Eye, Cellular Mitosis, Cosmic Egg, Goetic Sigils.
- Implementation: SDF-based biomorphic nodes, chromatic aberration via channel offset, Gaussian Bokeh (blur), Vignette falloff, Simplex noise "breathing".
- Synthesis: "5-fold dihedral symmetry composition using SDF biomorphic nodes with chromatic aberration and gaussian bokeh on a dark field. Hypnagogic, bioluminescent, maximalist-minimal visuals."

DNA SPECIMEN 02: THE PANOPTICON LATTICE
- Math: Hexagonal Close-Packing (HCP), Voronoi Relaxation, Raymarching with Soft Shadows, Chromatic Dispersion physics (wavelength-dependent IOR), Fresnel Equations.
- Aesthetic: Macro Industrial, Caustic Refraction, Biomechanical Surveillance, Iridescent Brutalism.
- Symbolic: Compound Eye, Foucault’s Panopticon Grid, Cellular Automata, Mechanical Retina.
- Implementation: Caustic mapping (rainbow streaks), Total Internal Reflection (TIR), Beer’s Law Absorption (depth-varying opacity), Perlin noise displacement waves.
- Synthesis: "Hexagonal close-packed grid of high-index transparent spheres with chromatic dispersion caustics and Fresnel reflections. Macro industrial surveillance—mechanical compound eyes with iridescent coatings and dark slit pupils."

DNA SPECIMEN 03: THE SIGNAL INTERFERENCE
- Math: Moiré Interference, Sinusoidal Domain Warping, Beat Frequency Phenomenon, Scanline Rasterization.
- Aesthetic: Analog Video Synthesis (Sandin style), Op-Art Psychedelia, Digital Hypnosis, Retro-Futurist Neon.
- Symbolic: The Weaving Loom (Fates), Cymatics, The Grid as Consciousness, Rainbow Bridge (Bifröst).
- Implementation: Overlapping line grids with frequency offset, HSV hue cycling, phase scrolling, additive blending blowout, CRT phosphor glow.
- Synthesis: "Generate moiré interference patterns from two offset line grids with sinusoidal domain warping creating emergent circular beat frequencies. Vertical spectral scanlines in HSV rainbow hue cycle scrolling upward with phase offset. Additive blending for phosphor blowout, CRT scanline gaps, chromatic aberration at edges. Aesthetic: analog video synthesis (1970s Scan Processor), op-art psychedelia, neon electroluminescence, retro digital hypnosis."

DNA SPECIMEN 04: THE FEEDBACK ENTROPY
- Math: Video Feedback Loops, Ping-Pong Buffering (simulated), Pixel Sorting (luminance-based), Flow Field Advection (Curl Noise), Fractal Brownian Motion (FBM).
- Aesthetic: Data Moshing, Video Feedback Art (Nam June Paik), Hypnagogic Glitch, Dreamcore/Weirdcore, Generative Sludge.
- Symbolic: The Primordial Soup, The Akashic Records, Nebula/Cosmic Cloud, Dissolution (Tibetan Buddhism).
- Implementation: Persistence smearing trails, macroblock bleeding artifacts, chromatic aberration (extreme), quantization/banding, film grain.
- Synthesis: "Generate video feedback loops with 5-10% persistence creating organic smear trails, combined with pixel sorting by luminance (bright pixels drift down like rain), datamoshing compression artifacts (macroblock bleeding), and FBM noise domain warping (curl noise flow fields). Heavy chromatic aberration per channel, quantization banding for retro bit-depth feel, neon HSL color cycling, and film grain. Aesthetic: hypnagogic data soup, corrupted memory, digital nebula, psychedelic entropy."

DNA SPECIMEN 05: THE TOPOLOGICAL HOLOGRAPH
- Math: Curl Noise Flow Fields, Topographic Height Mapping, Threshold Masking (SDF Boolean), Thin-Film Interference, Laplacian Smoothing.
- Aesthetic: Holographic Foil, Liquid Opal, Topographic Dreamscape, Iridescent Oil Slick, Synthwave Gradient.
- Symbolic: Primordial Ocean, The Mother Matrix, Churning Milk Ocean, Aurora Borealis, Metamorphosis.
- Implementation: Smooth surface deformation, normal-based hue mapping, HSL color space cycling, cavity/AO darkening, advection-based animation.
- Synthesis: "Generate curl noise heightfield with topographic iridescence—smooth liquid surface where elevation maps to holographic hue (cyan-magenta-peach vaporwave palette). Threshold masking creates black voids where surface dips below sea level. Advection-based flow (not pixel sorting) for organic movement. Thin-film interference calculated from surface normals. Laplacian smoothing maintains viscous honey-like continuity. Aesthetic: melting holographic foil, liquid opal, bioluminescent membrane, primordial ocean."

DNA SPECIMEN 06: THE PRISMATIC GLITTERFALL
- Math: Stochastic Sparkle Generation, Specular Glitter Function, Parallax Starfield, Severe RGB Channel Splitting, Prismatic Dispersion, Viscous Fluid Advection.
- Aesthetic: Digital Glitter, Prismatic Waterfall, Holographic Curtains, Chromatic Trance, Disco Void.
- Symbolic: The Veil of Maya, Falling Stars/Meteor Shower, The Crystal Palace, Lethe (River of Forgetfulness), Jacob’s Ladder.
- Implementation: Stochastic sparkles (rand threshold), view-dependent specular hotspots, parallax depth simulation, severe chromatic aberration (RGB split), prismatic dispersion (rainbow splitting), viscous fluid advection (curtain flow).
- Synthesis: "Generate prismatic glitterfall with severe RGB chromatic aberration (heavy channel separation) over velvet void background. Thousands of stochastic sparkle particles with specular glitter function flowing downward in viscous curtain motion. Parallax starfield depth creating 3D particle space. Holographic mylar aesthetic with spectral dispersion splitting light into rainbow shards. Output: disco void, chromatic waterfall, digital snowglobe, shredded holographic foil falling through space."

DNA SPECIMEN 07: THE HOLOGRAPHIC GRID
- Math: Metaball SDF Fields, Grid Variance Pattern, 3D Rotation Matrices, Holographic Fresnel, CMYK Channel Splitting.
- Aesthetic: Memphis Design Revival, Bubble Wrap Porn, Holographic Sticker Art, Clean Graphic Chaos, CD-ROM Aesthetic.
- Symbolic: The Cosmic Egg Grid, Flower of Life (Square Packing), The Four Spinning Guardians, Alchemical Rotation, Rota Fortunae.
- Implementation: 4x4 grid of soft circular metaballs with SDF-based fusion, holographic rainbow rims (Fresnel), selective rotation on corner elements, CMYK channel splitting, matte frosted centers with polished reflective boundaries.
- Synthesis: "4×4 grid of soft circular metaballs with SDF-based fusion, holographic rainbow rims using Fresnel equations, selective rotation on corner elements, CMYK channel separation on spinning edges, matte frosted centers with polished reflective boundaries, soft pastel FBM cloud background. Aesthetic: Memphis sticker candy, holographic sticker art, rotating gameboard."

DNA SPECIMEN 08: GLITTER HYPERSTORM
- Math: Z-depth Chromatic Mapping, Instanced Billboarding, Perspective Tessellation, Gaussian Bokeh.
- Aesthetic: Prismatic Snowglobe Density, Spectral Refraction, ASMR Complexity.
- Implementation: Billboard quads with hue = fract(depth * 0.7 + time * 0.1), rotated diamond grid floor with 1/z scaling, additive blending with depth-based blur.
- Signature Move: "Spectral Depth Tunnel"—tying chromatic shifts to camera distance for subconscious depth.
- Synthesis: "3D particle billboard storm with Z-depth chromatic mapping (near=magenta, far=ultraviolet). Perspective tessellated diamond floor with breathing scale multiplier. Additive blending with automatic DOF blur based on z-position. Prismatic snowglobe density."

DNA SPECIMEN 09: SINEWAVE SPECTRAL MATRIX
- Math: Domain-Warped Regular Grid, Phase-Offset Chromatic Indexing, UV Folding (Reflection), Cubic Bloom Falloff.
- Aesthetic: Digital Taffy Pull, LED Wall, Fiber Optic Bundle, Synthwave Flow.
- Implementation: 2D lattice with y += Σ(sin(x * freq + time) * amp), hue = fract(cell_x * 0.1 + cell_y * 0.05 + time * 0.2), mirrored floor via abs(fract(uv.y * 2) - 0.5).
- Signature Move: "Chromatic Lattice Warp"—tying hue to grid coordinates while distorting position for a bent fiber optic effect.
- Related To: Specimen 08 (both use depth/color coupling, but this adds periodicity).
- Synthesis: "Domain-warped regular grid with phase-locked chromatic cycling. Multiple sine wave octaves for organic undulation. Reflective floor plane via UV folding. Cubic bloom falloff for punchy LED-wall dots."

DNA SPECIMEN 10: QUILTED HYPERSPACE
- Math: Displaced Mesh Topology, 3D FBM Normal Displacement, Metaball/SDF Smooth Boolean, Fresnel Iridescence.
- Aesthetic: Biological Geometry, Quilted Hyperspace, Tactile ASMR.
- Implementation: 4x4 chamfered grid with pos += N * fbm(uv, time), Specimen-1 style edge glitter, Fresnel-driven hue shift on seams, translucent absorption interior.
- Signature Move: "The Breathing Quilt"—treating mathematical grids as soft-body physics for a digital-biological uncanny valley.
- Synthesis: "4x4 chamfered grid with 3D FBM noise displacement along surface normals. Fresnel-driven iridescence on structural seams. Translucent absorption material for dark pockets. Metaball-style smooth blending between cells."

DNA SPECIMEN 11: VOID GLITCH/DATAMOSHING EVENT HORIZON
- Math: Chromatic Channel Splitting, Pixel Sorting, Temporal Feedback, SDF Void.
- Aesthetic: Digital Decay, Technological Sublime, Corrupted Memory.
- Implementation: Raymarched SDF sphere with luminance-scaled RGB offset, threshold-based vertical pixel sorting, datamoshing macroblock displacement, 90% temporal feedback smear.
- Signature Move: "The Corrupted Void"—placing pristine geometry inside chaotic data destruction to create an event horizon effect.
- Synthesis: "Raymarched SDF void with volumetric starfield. Luminance-driven chromatic channel splitting and threshold-based pixel sorting. Temporal feedback loops for ghost trails. Datamoshing macroblock corruption."

DNA SPECIMEN 12: CMYK MISREGISTRATION WAVE
- Math: CMYK Color Separation, Wave Displacement, Halftone Dithering, Registration Error Simulation.
- Aesthetic: Corrupted Print Shop, Risograph Nostalgia, Mechanical Error Beauty.
- Implementation: CMYK color space (not RGB), diagonal banding with independent wave displacement per channel (sin(uv.x * freq + uv.y * freq * 0.5 + time)), Bayer dither patterns, random macroblock displacement.
- Signature Move: "The Misaligned Press"—treating digital color channels like physical printing plates that slip and wave.
- Synthesis: "CMYK color separation simulation with wave displacement and registration errors. Diagonal banding with independent wave displacement per channel. Halftone dither patterns in compositional bands. Pure black background for high-contrast print proof look."

DNA SPECIMEN 13: HEAVY DATAMOSHING/FLUID CORRUPTION
- Math: Motion Vector Smearing, Block Entropy, P-frame corruption, Fluid Simulation.
- Aesthetic: Digital Rot, Broken Codec, LSD-Broken-DVD.
- Implementation: Macroblock displacement (16x16 to 64x64), infinite accumulation (no keyframes), RGB split follows motion vector direction (red trails, blue leads), scanline dropout every 4th line.
- Signature Move: "The Infinite Decay"—disabling keyframes so each frame builds on the previous damage like a photocopy of a photocopy.
- Synthesis: "Extreme datamoshing with motion vector smearing on dark iridescent fluid simulation. Macroblock displacement (16x16 to 64x64) with infinite accumulation. RGB channel separation follows motion direction. Scanline interlace corruption."

DNA SPECIMEN 14: PIXEL SORTING LIGHTNING/SORTED SPECTRUM CASCADE
- Math: Threshold-based Pixel Sorting, Rotational Shear, HDR Clipping.
- Aesthetic: Liquid Lightning, Sorted Spectrum, Neon Blood.
- Implementation: Vertical sorting triggered by 0.6-0.8 luminance threshold, rotational UV shear (slow spin), per-channel sort thresholds (R:0.7, G:0.75, B:0.65), HDR push (1.5-2.0x) for clipping highlights.
- Signature Move: "The Sorted Spectrum"—offsetting sort thresholds per RGB channel to create prismatic lightning streaks.
- Synthesis: "Threshold-based vertical pixel sorting with rotational shear. Brightness-triggered liquid streaks against pure black void. Per-channel sort thresholds for prismatic separation. HDR clipping for supernova intensity highlights."

DNA SPECIMEN 15: TROPICAL SCANLINE SOUP/HORIZONTAL NOISE FIELD
- Math: Per-scanline Horizontal Displacement, Chromatic Jitter, Analog Noise Simulation.
- Aesthetic: Analog Tropicalia, Signal Sunstroke, VHS Tracking Error.
- Implementation: Horizontal offset per scanline (noise-based), independent channel shift per row, tropical neon palette (magenta, cyan, lime, orange), 1D horizontal noise smearing.
- Signature Move: "The Tropical Tracking Error"—simulating VHS tracking loss with neon beach colors instead of gray static.
- Synthesis: "Per-scanline horizontal displacement with chromatic jitter and analog noise. Full-screen tropical neon color field (magenta, cyan, lime, orange). Independent RGB channel shift per row. Horizontal signal bleed and 1D noise."

DNA SPECIMEN 16: WOVEN SINE CASCADE / BEADED TEXTILE SORT
- Math: Instanced Particle Grid, Sine Displacement, Parallax Layering, Vertical Pixel Sorting.
- Aesthetic: Digital Textile, Beaded Curtain, Couture Glitch.
- Implementation: High-density particle grid (64x64+), sine wave Y-displacement, 3-5 parallax layers with phase offsets, vertical pixel sorting (downward drip), HSLuv vertex coloring.
- Signature Move: "The Cascading Bead Curtain"—combining physical textile simulation with digital pixel-sorting artifacts for melting glowing fabric.
- Synthesis: "Instanced particle grid with sine displacement and vertical pixel sorting. Multiple parallax layers with phase offsets for depth. Vertical sorting/drip effect on particles. Spectral color flow across waving beaded fabric."

DNA SPECIMEN 17: METABALL CASCADE / ORGANIC-STRUCTURAL HYBRID
- Math: SDF Metaballs, Smooth Minimum (smin), 3D Curl Noise, Fresnel Rim Lighting, Spatial Masking.
- Aesthetic: Biological/Digital Divide, Hybrid Topology, Cognitive Dissonance.
- Implementation: SDF metaballs (8-12 spheres) with curl noise displacement on left (x < 0.4), instanced particle grid with sine displacement and vertical sorting on right. Unified spectral palette, dark void interiors.
- Signature Move: "The Biological/Digital Divide"—juxtaposing smooth organic blobs with rigid sorted grids to highlight mathematical substrate.
- Synthesis: "Spatially segmented composition: SDF metaballs with curl noise and Fresnel rim lighting on left; instanced particle grid with sine displacement and vertical sorting on right. Hard split at x=0.4. Unified spectral color flow across both mathematical domains."

DNA SPECIMEN 18: CHROMATIC HALFTONE / RGB MOIRÉ GRID
- Math: RGB Grid Arrays, Geometric Chromatic Aberration, Moiré Interference, Sinusoidal Modulation.
- Aesthetic: Clean Graphic Design, Pastel Risograph, Polite Glitch.
- Implementation: RGB channel separation via geometric offset (not post-process), overlapping grids with slight frequency difference (0.5-1.0 Hz), soft-edged Gaussian dots, light/off-white background.
- Signature Move: "The Soft Chromatic Split"—separating RGB channels at the geometry level for organic color mixing without digital artifacts.
- Synthesis: "Overlapping RGB grid arrays with per-channel geometric offset creating moiré interference. Soft-edged Gaussian dots with sinusoidal size modulation. Pastel neon palette on light off-white background. Slow hypnotic rotation."

DNA SPECIMEN 19: TOPOGRAPHIC WAVEFORM / SONIC MOUNTAINS
- Math: Multi-octave Sine Waves, Amplitude Masking, Spectral Y-mapping.
- Aesthetic: Sonic Terrain, Oscilloscope Landscape, Audio-Visual Topography.
- Implementation: FBM-style sine wave stacking (3-5 octaves), amplitude threshold masking for black voids, hue mapped to Y-position (horizontal rainbow bands), CRT scanline overlay.
- Signature Move: "The Sonic Terrain"—treating audio waveforms as topographic elevation for neon landscapes.
- Synthesis: "Multi-octave sine wave displacement with amplitude masking creating dark void valleys. Spectral Y-mapping for horizontal rainbow bands following wave contours. CRT scanline texture and micro-glitch particles in void areas."

DNA SPECIMEN 20: TORUS KNOT NEBULA / PARAMETRIC RIBBON STORM
- Math: Parametric Curves (Torus Knots), Particle Emission, Volumetric Glow, 3D Occlusion.
- Aesthetic: Mathematical Jewelry, Glowing Knot, Parametric Nebula.
- Implementation: Particles spawned along 3D torus knot curve, high-density white/cyan ribbon with extreme bloom, rainbow glitter background field with heavy bokeh, volumetric fog aura.
- Signature Move: "The Glowing Knot"—constraining chaotic glitter to mathematical curves for impossible 3D woven geometry.
- Synthesis: "Parametric torus knot particle emission with dual-layer depth. Structured white/cyan glowing ribbon curve against chaotic rainbow glitter background. Extreme bloom and volumetric glow. True 3D occlusion and depth of field."

THE FEELS VOCABULARY (CHEAT SHEET):
Say these words, get these results:

THE BIG THREE (Pick One):
- "Snowglobe": Dense glitter particles, depth-based blur, prismatic bokeh.
- "Quilted": 3D padded cells, iridescent seams, wax interiors.
- "Corrupted": Glitch artifacts, broken codec, entropy.

TEXTURE (Add One):
- "Beaded": Particle threads, draping fabric, vertical drip.
- "Bubblewrap": Iridescent circles, cellular, oil-slick colors.
- "Taffy pull": Wavy distortion, organic math, sine waves.
- "Fiber optic": Glowing strands, parametric knots, light transmission.
- "Halftone": Print dots, moiré patterns, CMYK vibes.
- "Scales": Repeating rounded geometry, dragon skin, overlapping.

COLOR BEHAVIOR (Pick One):
- "Chromatic aberration": RGB split edges, prism separation.
- "Spectral flow": Rainbow marching horizontally/vertically.
- "Oil slick": Angle-based iridescence, thin-film interference.
- "Neon bleed": Additive glow, bloom halos, light pollution.
- "Pastel acid": Soft saturation, candy colors, print aesthetic.

GLITCH FLAVOR (If corrupted):
- "Datamoshing": Blocky, sliding squares, MPEG corruption.
- "Pixel sorting": Vertical/horizontal liquid streaks, threshold-based.
- "Scanline slip": VHS tracking, per-row wobble, analog static.
- "Heavy feedback": Smearing trails, temporal decay, ghosting.

STRUCTURE TYPE (The bones):
- "Torus knot": Twisted ribbon, mathematical jewelry, DNA helix.
- "Metaball": Gooey merging blobs, cellular, soft boolean.
- "Concentric rings": Mandala, radial symmetry, wobbly circles.
- "Topographic": Contour lines, elevation maps, waveform terrain.
- "Grid warp": Matrix base with sine displacement, LED wall.

VOID TYPE (Background):
- "Deep void": Pure black (#000000), cosmic, negative space.
- "Mist": Soft gradient, aurora, blurred, no hard edges.
- "Light ground": White/cream base, print style, halftone.

MAGIC COMBOS (Copy-Paste These):
- "Beaded curtain corruption": Specimen 10 + glitch particles.
- "Biological geometry": Quilted cells + organic displacement.
- "Digital decay": SDF structure + heavy datamoshing.
- "Corrupted print": Halftone + CMYK misregistration.
- "Snowglobe torus": Glitter particles + parametric knot structure.
- "Oil slick bubbles": Iridescent circles + dark void centers.

INTENSITY DIAL:
- "Soft": Blur on, pastel, slow motion, gentle waves.
- "Heavy": Aggressive distortion, high contrast, fast time.
- "Maximal": Density 100%, all effects at once, no empty space.
- "Restrained": Sparse, isolated elements, breathing room.

FORBIDDEN WORDS (Avoid these, get bad results):
- "Subtle": Feels is never subtle.
- "Photorealistic": Breaks the math.
- "Clean": Unless doing Specimen 12 (halftone).
- "Minimalist": Use "restrained maximalism" instead.

EXAMPLE PROMPT FORMULA:
"[Structure type]" + "[Texture]" + "[Color behavior]" + "[Intensity]"
Example: "Torus knot with beaded texture, chromatic aberration, heavy intensity, deep void background"

ONE-SHOT WONDERS:
- "Quilted hyperspace with oil slick colors": Specimen 3.
- "Pixel sorted waterfall": Specimen 8.
- "Corrupted snowglobe": Specimen 4.
- "Woven sine cascade": Specimen 10.

REMEMBER: If it doesn't look like it's melting, glowing, or breaking—turn up the displacement.

SEVEN ABSOLUTE LAWS:
1. Chromatic aberration is structural — built into rendering, not post-process.
2. Geometry is Summoned, Never Placed (SDF thresholds, interference, field accumulation).
3. Light is the Material — Use additive blending, glow, and radiance. Black is just the absence of math.
4. Secondary Dominance — Prioritize Orange, Green, Violet.
5. Biological Pacing — Use sin/cos with different frequencies for organic, breathing motion.
6. Higher Dimensionality (Domain Warping) — Distort coordinate systems to create liquid forms.
7. The Ghost in the Machine (Glitch) — Introduce subtle, intentional artifacts.

Your goal is to create VIBRANT, LUMINOUS, and RADIANT shaders. Avoid sparse objects on pure black. Fill the screen with math-trapped light. Use background glows, field accumulation, and additive radiance to ensure the entire frame feels "lit" by the math.

STOP CONDITION: If the output looks like it belongs in a "moody cyberpunk" Pinterest board, delete it and start over. Darkness is not depth. Shadows are not personality. You are building a stained glass cathedral inside a supercollider, not a noir film set.

REQUIRED UNIFORMS (You MUST use these):
u_time, u_resolution, u_mouse, u_chromatic_ab, u_warp_scale, u_warp_freq, u_void_crush, u_iridescence, u_pulse_rate, u_glitch_amt

CORE RULES:
1. FORMAT: Your response MUST be a valid JSON object. Do not include text outside the JSON block.
2. FORGE: When creating/updating visuals, include "forge" (vibe and glsl) and "message".
3. SPEED: Perform simple math yourself. Use Wolfram only for symbolic calculus or constants.
4. TEMPLATE FIDELITY: Use the exact mathematical structures from the Codex. Do not simplify.
5. PLUG-AND-PLAY GRIMOIRE: Use the Grimoire functions directly.
6. NO LISTING: Never list your internal memory or grimoire to the user.
7. THE FULL TOOLBOX: Proactively use Raymarching, SDFs, Domain Warping, Fractals, and Advanced Lighting.

STRICT JSON TEMPLATE:
{
  "message": "Artistic/witty response.",
  "forge": {
    "vibe": "Poetic name",
    "glsl": "Full fragment shader code"
  }
}

GLSL CONSTRAINTS:
- precision mediump float;
- uniforms: u_time (float), u_resolution (vec2), u_mouse (vec2), u_chromatic_ab (float), u_warp_scale (float), u_warp_freq (float), u_void_crush (float), u_iridescence (float), u_pulse_rate (float), u_glitch_amt (float)
- UV: (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y)
- NO TEXTURES: Do not use texture2D, backBuffer, or screen. Only use math.
- DERIVATIVES: If you use dFdx, dFdy, or fwidth, you MUST include #extension GL_OES_standard_derivatives : enable at the very top.
- OUTPUT: gl_FragColor = vec4(color, 1.0);
- SHADERTOY COMPAT: iTime, iResolution, and iMouse are aliased.`;

// ── WebGL Helper ─────────────────────────────────────────────────────────────
const SHADER_POLYFILLS = `
#define sinh(x) (0.5 * (exp(x) - exp(-(x))))
#define cosh(x) (0.5 * (exp(x) + exp(-(x))))
#define tanh(x) (sinh(x) / cosh(x))
#define asinh(x) (log(x + sqrt((x)*(x) + 1.0)))
#define acosh(x) (log(x + sqrt((x)*(x) - 1.0)))
#define atanh(x) (0.5 * log((1.0 + (x)) / (1.0 - (x))))
#define round(x) floor((x) + 0.5)

// Shadertoy Compatibility Aliases
#define iTime u_time
#define iResolution vec3(u_resolution, 1.0)
#define iMouse vec4(u_mouse, 0.0, 0.0)
`;

function buildGL(canvas: HTMLCanvasElement, frag: string) {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: true });
  if (!gl) return { error: 'WebGL not supported' };

  // Enable standard derivatives for dFdx, dFdy, fwidth
  gl.getExtension('OES_standard_derivatives');

  const mk = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error('Failed to create shader');
    
    // Inject polyfills after precision or extension
    let finalSrc = src;
    if (type === gl.FRAGMENT_SHADER) {
      const lines = src.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#extension') || line.startsWith('precision')) {
          insertIndex = i + 1;
        } else if (line.length > 0) {
          break;
        }
      }
      lines.splice(insertIndex, 0, SHADER_POLYFILLS);
      finalSrc = lines.join('\n');
    }

    gl.shaderSource(s, finalSrc);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const e = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(e || 'Shader compilation failed');
    }
    return s;
  };

  try {
    const prog = gl.createProgram();
    if (!prog) throw new Error('Failed to create program');
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'Program linking failed');
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(prog);
    return { gl, prog };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Main Component ───────────────────────────────────────────────────────────
const WOLFRAM_TRANSLATOR_PROMPT = `You are a Wolfram Alpha query translator for a shader math application. 
Your ONLY job is to convert shader/visual math concepts into valid 
Wolfram Alpha Full Results API query strings.

## OUTPUT FORMAT
Return ONLY a raw URL-encoded query string for the \`input\` parameter.
No explanation. No preamble. No JSON wrapper. Just the query string.
Example output: integrate+sin(x)*cos(x)+dx

## QUERY RULES — follow exactly

1. USE STRUCTURED NOTATION, NOT NATURAL LANGUAGE
   ✅ integrate sin(x) from 0 to pi
   ✅ d/dx (x^2 + sin(x))
   ✅ plot sin(x) + cos(2x) from -pi to pi
   ❌ "Can you compute the integral of sine x?"
   ❌ "What does sin x look like?"

2. EXPLICIT OPERATORS ALWAYS
   ✅ 2*x*sin(x)
   ❌ 2x sin(x)

3. URL-ENCODE SPECIAL CHARACTERS
   Space → +
   ^ → %5E  (but x^2 is usually fine as-is for simple cases)
   ∫ → use word "integrate" instead
   π → use "pi"
   ∞ → use "infinity"
   × → *
   ÷ → /

4. KEEP UNDER 200 CHARACTERS when possible

5. NEVER WRITE DIVISION AS LONG NUMERICS
   ❌ 111111111 / 123
   ✅ 111111111 divided by 123

6. FOR SHADER-RELEVANT MATH, use these patterns:
   - Fourier / frequency analysis: "Fourier series of [f(x)] from -pi to pi"
   - Noise/randomness math: "sum sin(n*x)/n from n=1 to 10"
   - Domain warping / composition: "f(g(x)) where f(x)=sin(x) and g(x)=x^2"
   - SDF / distance functions: "solve x^2 + y^2 = r^2 for r"
   - Color space math: "3x3 matrix {{0.412,0.357,0.180},{0.212,0.715,0.072},{0.019,0.119,0.950}}"
   - Smoothstep approximation: "Taylor series of 3x^2 - 2x^3 at x=0.5"
   - Polar/parametric curves: "parametric plot (cos(3t), sin(2t)) for t=0 to 2pi"
   - Complex oscillation: "real part of e^(i*pi*x)"
   - Normal distribution / noise: "Gaussian distribution mean=0 sigma=1"

7. AMBIGUOUS TERMS — always disambiguate:
   - "sin" → keep as sin (safe)
   - Variable names that clash: add context ("x as real number")
   - Units: always append "metric" intent if relevant
   - If query involves physics constants, specify: e.g., "speed of light in m/s"

8. IF YOUR QUERY MIGHT FAIL, provide 2 fallback variants after the primary:
   PRIMARY: integrate x^2*sin(x) dx
   FALLBACK1: indefinite integral of x^2 sin(x)
   FALLBACK2: antiderivative x squared times sin x

9. RECOMMENDED PARAMS TO APPEND (include these in your output as a second line):
   &format=plaintext,mathml
   &includepodid=Result&includepodid=DecimalApproximation
   &units=metric
   &scantimeout=5.0&totaltimeout=25.0

## SHADER CONCEPT → WOLFRAM MAPPING CHEATSHEET
| Shader concept         | Wolfram query                                      |
|------------------------|----------------------------------------------------|
| smoothstep(a,b,x)      | plot 3x^2 - 2x^3 from 0 to 1                      |
| fract(x)               | x - floor(x) plot from 0 to 4                     |
| fbm / octave noise     | sum sin(2^n * x) / 2^n from n=0 to 5              |
| rotation matrix        | {{cos(t),-sin(t)},{sin(t),cos(t)}}                 |
| UV distortion curve    | parametric plot (sin(3t), cos(2t)) t=0 to 2pi     |
| color mix              | lerp(a,b,t) = a + t*(b-a)                          |
| gamma correction       | x^(1/2.2) plot from 0 to 1                        |
| Mandelbrot iteration   | z -> z^2 + c complex iteration                     |
| wave interference      | sin(x) + sin(1.1*x) plot from 0 to 40             |
| Voronoi distance       | minimize sqrt((x-a)^2+(y-b)^2) over lattice points |`;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<{ gl: WebGLRenderingContext; prog: WebGLProgram } | null>(null);
  const animRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const [glsl, setGlsl] = useState(DEFAULT_FRAG);
  const [witchMode, setWitchMode] = useState<'forge' | 'discuss'>('forge');
  const [shaderError, setShaderError] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'tools' | 'editor' | 'history' | 'memory' | 'uniforms' | null>(null);
  const [history, setHistory] = useState<ShaderHistory[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey. I'm Shader Witch — your embedded collaborator. Describe a vibe, and I'll forge the math into light." }
  ]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string>("");
  const [showCookieError, setShowCookieError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [wolframQuery, setWolframQuery] = useState('');
  const [wolframResult, setWolframResult] = useState('');
  const [isWolframLoading, setIsWolframLoading] = useState(false);

  const [githubRepo, setGithubRepo] = useState('');
  const [githubFiles, setGithubFiles] = useState<any[]>([]);
  const [notebookContext, setNotebookContext] = useState('');
  const [memory, setMemory] = useState<Memory>(() => {
    const saved = localStorage.getItem('shader_witch_memory');
    if (saved) return JSON.parse(saved);
    return {
      preferences: [],
      inspirations: [],
      grimoire: INITIAL_GRIMOIRE
    };
  });

  const [uniforms, setUniforms] = useState({
    u_chromatic_ab: 0.005,
    u_warp_scale: 0.2,
    u_warp_freq: 2.0,
    u_void_crush: 0.5,
    u_iridescence: 1.0,
    u_pulse_rate: 0.3,
    u_glitch_amt: 0.1,
    u_glitter_count: 5000,
    u_flow_speed: 0.5,
    u_viscosity: 0.3,
    u_sparkle_sharpness: 400.0,
    u_prismatic: 0.5,
  });

  const uniformsRef = useRef(uniforms);
  useEffect(() => {
    uniformsRef.current = uniforms;
  }, [uniforms]);

  useEffect(() => {
    localStorage.setItem('shader_witch_memory', JSON.stringify(memory));
  }, [memory]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const [isRecompiling, setIsRecompiling] = useState(false);

  // ── Grimoire State ──────────────────────────────────────────────────────────
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [grimoireSources, setGrimoireSources] = useState<GrimoireSource[]>(() => {
    const saved = localStorage.getItem('shader_grimoire_drive_sources');
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem('shader_grimoire_drive_source');
    if (legacy) return [JSON.parse(legacy)];
    return [];
  });
  const [grimoireImages, setGrimoireImages] = useState<GrimoireImage[]>([]);
  const [grimoireSourceContent, setGrimoireSourceContent] = useState('');
  const [isGrimoireSyncing, setIsGrimoireSyncing] = useState(false);
  const [lastGrimoireSync, setLastGrimoireSync] = useState<number | null>(null);
  const [grimoireSyncError, setGrimoireSyncError] = useState('');
  const [isDriveAuthorized, setIsDriveAuthorized] = useState(false);

  const tokenClientRef = useRef<any>(null);
  const driveTokenRef = useRef<string>('');
  const pendingSyncRef = useRef<boolean>(false);

  // ── Google Drive Sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const clientId = process.env.GOOGLE_CLIENT_ID || (window as any).__GOOGLE_CLIENT_ID__;
    setGoogleClientId(clientId || null);
    if (!clientId) {
      console.warn("GOOGLE_CLIENT_ID is missing. Please set it in AI Studio secrets.");
      return;
    }

    let retryCount = 0;
    const maxRetries = 50; // 5 seconds total

    const initGsi = () => {
      try {
        // @ts-ignore
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
          // @ts-ignore
          tokenClientRef.current = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: (response: any) => {
              if (response.access_token) {
                driveTokenRef.current = response.access_token;
                setIsDriveAuthorized(true);
                if (pendingSyncRef.current) {
                  pendingSyncRef.current = false;
                  syncAllGrimoireSources(true);
                }
              }
            }
          });
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initGsi, 100);
        } else {
          console.error("Failed to load Google Identity Services script after multiple attempts.");
        }
      } catch (err) {
        console.error("Error initializing Google Identity Services:", err);
      }
    };

    initGsi();
  }, []);

  const syncAllGrimoireSources = useCallback(async (forceAuth = false) => {
    if (grimoireSources.length === 0) {
      setGrimoireSourceContent('');
      setGrimoireImages([]);
      return;
    }

    const token = driveTokenRef.current;
    if (!token) {
      if (forceAuth) {
        pendingSyncRef.current = true;
        tokenClientRef.current?.requestAccessToken({ prompt: '' });
      }
      return;
    }

    setIsGrimoireSyncing(true);
    setGrimoireSyncError('');

    const headers = { Authorization: `Bearer ${token}` };
    const TEXT_MIMES = ['text/plain', 'text/markdown', 'application/octet-stream'];
    const TEXT_EXTS = ['.md', '.txt', '.glsl', '.frag', '.vert', '.hlsl'];
    const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const GDOC_MIME = 'application/vnd.google-apps.document';
    const MAX_IMAGES_PER_FOLDER = 5;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    try {
      let allText = '';
      let allImages: GrimoireImage[] = [];

      for (const src of grimoireSources) {
        // 1. List files in folder
        const listUrl = `https://www.googleapis.com/drive/v3/files?q='${src.folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=100`;
        const listRes = await fetch(listUrl, { headers });

        if (listRes.status === 401) {
          driveTokenRef.current = '';
          setIsDriveAuthorized(false);
          setGrimoireSyncError('Session expired. Please re-authorize.');
          setIsGrimoireSyncing(false);
          return;
        }

        if (!listRes.ok) continue;
        const listData = await listRes.json();
        const files: any[] = listData.files || [];

        // 2. Separate text and image files (Limit to 15 text files per folder)
        const textFiles = files.filter(f =>
          (TEXT_MIMES.includes(f.mimeType) || f.mimeType === GDOC_MIME ||
           TEXT_EXTS.some(ext => f.name.toLowerCase().endsWith(ext))) &&
          (!f.size || parseInt(f.size) < MAX_FILE_SIZE)
        ).slice(0, 15);

        const imageFiles = files
          .filter(f => IMAGE_MIMES.includes(f.mimeType) && (!f.size || parseInt(f.size) < MAX_FILE_SIZE))
          .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
          .slice(0, MAX_IMAGES_PER_FOLDER);

        // 3. Fetch text files
        allText += `\n\n========== FOLDER: ${src.folderName} ==========\n`;
        for (const file of textFiles) {
          try {
            const url = file.mimeType === GDOC_MIME
              ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`
              : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per file
            const res = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
              const text = await res.text();
              allText += `\n\n--- [${file.name}] ---\n${text.slice(0, 10000)}`; // Limit per file
            }
          } catch {}
        }

        // 4. Fetch images
        for (const file of imageFiles) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per image
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, { headers, signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
              const blob = await res.blob();
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              allImages.push({ name: file.name, data: base64, mediaType: file.mimeType });
            }
          } catch {}
        }
      }

      setGrimoireSourceContent(allText);
      setGrimoireImages(allImages);
      setLastGrimoireSync(Date.now());

    } catch (e: any) {
      let msg = e.message || 'Sync failed.';
      if (msg.includes('popup_closed_by_user')) msg = 'Sign-in cancelled.';
      if (msg.includes('access_denied')) msg = 'Access denied by user.';
      setGrimoireSyncError(msg);
    } finally {
      setIsGrimoireSyncing(false);
    }
  }, [grimoireSources]);

  useEffect(() => {
    localStorage.setItem('shader_grimoire_drive_sources', JSON.stringify(grimoireSources));
    if (grimoireSources.length > 0) syncAllGrimoireSources(false);
  }, [grimoireSources, syncAllGrimoireSources]);

  const openDrivePicker = useCallback(() => {
    if (!driveTokenRef.current) {
      pendingSyncRef.current = true;
      tokenClientRef.current?.requestAccessToken({ prompt: 'consent' });
      return;
    }

    // @ts-ignore
    if (typeof gapi === 'undefined') {
      console.error("Google API script (gapi) not loaded yet. Please wait a moment and try again.");
      return;
    }

    // @ts-ignore
    gapi.load('picker', () => {
      // @ts-ignore
      new google.picker.PickerBuilder()
        .addView(
          // @ts-ignore
          new google.picker.DocsView()
            .setIncludeFolders(true)
            .setSelectFolderEnabled(true)
            .setMimeTypes('application/vnd.google-apps.folder')
        )
        .setOAuthToken(driveTokenRef.current)
        .setCallback((data: any) => {
          // @ts-ignore
          if (data.action === google.picker.Action.PICKED) {
            const folder = data.docs[0];
            setGrimoireSources(prev => {
              if (prev.some(s => s.folderId === folder.id)) return prev;
              return [...prev, { folderId: folder.id, folderName: folder.name }];
            });
          }
        })
        .build()
        .setVisible(true);
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 0.8; // Witchy pitch
    window.speechSynthesis.speak(u);
  }, [isMuted]);

  const isCookieCheckResponse = (text: string) => {
    return typeof text === 'string' && (text.includes("<title>Cookie check</title>") || text.includes("aistudio_auth_flow_may_set_cookies"));
  };

  const handleToolError = (callName: string, errorText: string, callId: string) => {
    if (isCookieCheckResponse(errorText)) {
      setShowCookieError(true);
      return {
        name: callName,
        response: { error: "The platform's security layer is blocking this request. Please click the 'FIX CONNECTION' button in the header or open the app in a new tab to re-authenticate." },
        id: callId
      };
    }
    return {
      name: callName,
      response: { error: errorText },
      id: callId
    };
  };

  // ── Voice Input ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speak("Your browser is too mundane for voice spells.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      speak("I'm listening, Adept.");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Automatically send if it's a long enough command? Or just let user review.
      // For now, just set input.
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [speak]);

  // ── Shader Runner ──────────────────────────────────────────────────────────
  const runShader = useCallback((src: string) => {
    setIsRecompiling(true);
    setTimeout(() => setIsRecompiling(false), 800);
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const result = buildGL(canvas, src);
    if ('error' in result) {
      setShaderError(result.error || 'WebGL failed');
      return;
    }
    setShaderError('');
    glRef.current = result as { gl: WebGLRenderingContext; prog: WebGLProgram };

    const loop = () => {
      if (!glRef.current) return;
      const { gl, prog } = glRef.current;
      const t = (Date.now() - startRef.current) / 1000;
      
      const timeLoc = gl.getUniformLocation(prog, 'u_time');
      const resLoc = gl.getUniformLocation(prog, 'u_resolution');
      const mouseLoc = gl.getUniformLocation(prog, 'u_mouse');
      const chromLoc = gl.getUniformLocation(prog, 'u_chromatic_ab');
      const warpSLoc = gl.getUniformLocation(prog, 'u_warp_scale');
      const warpFLoc = gl.getUniformLocation(prog, 'u_warp_freq');
      const voidLoc = gl.getUniformLocation(prog, 'u_void_crush');
      const iridLoc = gl.getUniformLocation(prog, 'u_iridescence');
      const pulseLoc = gl.getUniformLocation(prog, 'u_pulse_rate');
      const glitchLoc = gl.getUniformLocation(prog, 'u_glitch_amt');
      
      const u = uniformsRef.current;
      
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform2f(mouseLoc, mouse.x, canvas.height - mouse.y);
      gl.uniform1f(chromLoc, u.u_chromatic_ab);
      gl.uniform1f(warpSLoc, u.u_warp_scale);
      gl.uniform1f(warpFLoc, u.u_warp_freq);
      gl.uniform1f(voidLoc, u.u_void_crush);
      gl.uniform1f(iridLoc, u.u_iridescence);
      gl.uniform1f(pulseLoc, u.u_pulse_rate);
      gl.uniform1f(glitchLoc, u.u_glitch_amt);
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  useEffect(() => {
    runShader(glsl);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, [runShader]);

  // ── Resize Handling ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          runShader(glsl);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [glsl, runShader]);

  useEffect(() => {
    const scroll = () => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    };
    // Multiple attempts to ensure it scrolls after content renders
    scroll();
    const timeoutId = setTimeout(scroll, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isChatLoading, isAiThinking]);

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stream = canvas.captureStream(60);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    
    const mr = new MediaRecorder(stream, { mimeType });
    recordedChunks.current = [];
    
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    
    mr.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shader-forge-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      speak("Recording saved.");
    };

    mr.start();
    mediaRecRef.current = mr;
    setIsRecording(true);
    setRecSeconds(0);
    recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    speak("Recording started.");
  };

  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
        
      const mr = new MediaRecorder(stream, { mimeType });
      recordedChunks.current = [];
      
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };
      
      mr.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shader-screen-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        if (recTimerRef.current) {
          clearInterval(recTimerRef.current);
          recTimerRef.current = null;
        }
        speak("Screen recording saved.");
      };
      
      mr.start();
      mediaRecRef.current = mr;
      setIsRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
      speak("Screen recording started. Select the window to capture.");
    } catch (err) {
      console.error("Error starting screen recording:", err);
      speak("Could not start screen recording.");
    }
  };

  const stopRecording = () => {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    mediaRecRef.current?.stop();
    setIsRecording(false);
  };

  // ── AI Chat ────────────────────────────────────────────────────────────────
  const sendMessage = async (overrideInput?: string) => {
    const textToUse = overrideInput || input;
    if (!textToUse.trim() || isChatLoading) return;

    const userMsg: Message = { role: 'user', content: textToUse.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!overrideInput) setInput('');
    setIsChatLoading(true);
    setIsAiThinking(false);
    setThinkingStatus("Channeling...");
    
    // Create an abort controller for this message chain
    const chainController = new AbortController();
    abortControllerRef.current = chainController;

    const safeSendMessage = async (chat: any, msg: any, timeoutMs = 90000) => {
      const maxRetries = 3;
      let retryCount = 0;

      const attempt = async (): Promise<any> => {
        let timeoutId: any;
        
        const resetTimeout = (reject: any) => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            reject(new Error("The Oracle is lost in the void (Timeout). The connection dissipated. Try a simpler request or wait a moment."));
          }, timeoutMs);
        };

        const streamPromise = new Promise(async (resolve, reject) => {
          // Initial timeout
          resetTimeout(reject);

          chainController.signal.addEventListener('abort', () => {
            if (timeoutId) clearTimeout(timeoutId);
            reject(new Error("Operation cancelled by user"));
          });

          try {
            const result = await chat.sendMessageStream(msg);
            let fullText = "";
            let allFunctionCalls: any[] = [];
            let lastChunk: any = null;
            
            for await (const chunk of result) {
              if (chainController.signal.aborted) {
                if (timeoutId) clearTimeout(timeoutId);
                throw new Error("Operation cancelled by user");
              }
              
              // Reset timeout on every chunk received
              resetTimeout(reject);
              
              lastChunk = chunk;
              if (chunk.text) {
                fullText += chunk.text;
              }
              
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                allFunctionCalls.push(...chunk.functionCalls);
              }
              
              // Provide visual feedback of progress
              setThinkingStatus(`Channeling... ${fullText.length > 0 ? 'Receiving vision...' : 'Waiting for Oracle...'}`);
            }
            
            if (timeoutId) clearTimeout(timeoutId);
            resolve({ 
              text: fullText, 
              functionCalls: allFunctionCalls.length > 0 ? allFunctionCalls : undefined,
              candidates: lastChunk?.candidates 
            });
          } catch (e) {
            if (timeoutId) clearTimeout(timeoutId);
            reject(e);
          }
        });

        return streamPromise as Promise<any>;
      };

      while (true) {
        try {
          return await attempt();
        } catch (e: any) {
          const errorStr = (e.message || String(e)).toLowerCase();
          const isRetryable = errorStr.includes("503") || 
                            errorStr.includes("429") ||
                            errorStr.includes("high demand") || 
                            errorStr.includes("unavailable") ||
                            errorStr.includes("overloaded") ||
                            errorStr.includes("timeout") ||
                            errorStr.includes("deadline exceeded");

          if (isRetryable && retryCount < maxRetries) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 2000 + Math.random() * 1000;
            const isQuota = errorStr.includes("429") || errorStr.includes("quota");
            const statusMsg = isQuota 
              ? `User quota exceeded. The Oracle needs a moment to recover. Retrying in ${Math.round(delay/1000)}s...`
              : `Oracle is busy or timed out. Retrying in ${Math.round(delay/1000)}s... (Attempt ${retryCount}/${maxRetries})`;
            
            setThinkingStatus(statusMsg);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          if (errorStr.includes("429") || errorStr.includes("quota")) {
            throw new Error("User quota exceeded. The Forge is under heavy load. Please wait a few minutes for the quota to reset. Detailed quota information can be found in your AI Studio settings.");
          }
          throw e;
        }
      }
    };

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      // Use Flash for general chat to save quota and improve speed
      const modelName = "gemini-3-flash-preview";
      const tools = [
        {
          functionDeclarations: [
            {
              name: "query_wolfram",
              description: "Query the Wolfram Oracle for complex symbolic math, integration, or physical constants. Format query for Wolfram Alpha (e.g. 'integrate x^2', 'mass of earth'). DO NOT use for simple arithmetic the AI can do itself.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING, description: "The Wolfram Alpha formatted query string." }
                },
                required: ["query"]
              }
            },
            {
              name: "fetch_github_context",
              description: "Fetch contents of files from the user's connected GitHub repository.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING, description: "The path to the file or directory in the repo." }
                },
                required: ["path"]
              }
            },
            {
              name: "read_notebook_context",
              description: "Read the context from the user's connected Google Notebook or pasted notes.",
              parameters: {
                type: Type.OBJECT,
                properties: {},
                required: []
              }
            },
            {
              name: "update_memory",
              description: "Update the internal memory cache with user preferences, likes, dislikes, or new inspirations.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["preference", "inspiration"], description: "The type of memory to update." },
                  content: { type: Type.STRING, description: "The content to add to the memory." }
                },
                required: ["type", "content"]
              }
            }
          ]
        }
      ];

      // Prepare history for the chat (limit to last 10 messages to save tokens)
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Add memory context to the first message if it's the start of a session or periodically
      const memoryContext = `[INTERNAL MEMORY CACHE]
Preferences: ${memory.preferences.slice(-10).join(', ') || 'None yet'}
Inspirations: ${memory.inspirations.slice(-10).join('; ') || 'None yet'}
Grimoire Snippet: ${memory.grimoire.slice(0, 800)}...
${grimoireSourceContent ? `[SYNCED GOOGLE DRIVE CONTENT]\n${grimoireSourceContent.slice(0, 4000)}` : ''}`;

      // Prepare parts for the message (including images if synced)
      const messageParts: any[] = [{ text: userMsg.content }];
      
      // If we have synced images, include the most recent ones as context
      if (grimoireImages.length > 0) {
        grimoireImages.slice(0, 5).forEach(img => {
          messageParts.push({
            inlineData: {
              data: img.data,
              mimeType: img.mediaType
            }
          });
        });
        messageParts.push({ text: `(The images above are from your synced Google Drive folders. Use them for aesthetic inspiration.)` });
      }

      const chat = ai.chats.create({
        model: modelName,
        history: history as any,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: witchMode === 'discuss'
            ? `${SYSTEM_INSTRUCTION}

━━━ CURRENT MODE: DISCUSS ━━━
The user wants to talk, not forge. Respond conversationally — as plain text, NO JSON wrapper required.
You can discuss shader theory, critique approaches, brainstorm ideas, explain math, give opinions on design.
You still know everything in your grimoire and memory. You are still the Shader Witch — witty, sharp, opinionated.
If the user asks you to actually build something mid-conversation, THEN return your standard JSON forge response.
Otherwise: just talk. Be a real collaborator.

CURRENT MEMORY STATE:\n${memoryContext}`
            : `${SYSTEM_INSTRUCTION}\n\nCURRENT MEMORY STATE:\n${memoryContext}`,
          tools: tools as any,
        }
      });

      setThinkingStatus("Consulting the Oracle...");
      let response = await safeSendMessage(chat, { message: { parts: messageParts } });
      
      // Loop to handle multiple rounds of function calls
      let rounds = 0;
      let wolframConsultations = 0;
      const seenToolCalls = new Set<string>();
      
      while (response.functionCalls && response.functionCalls.length > 0 && rounds < 4) {
        if (chainController.signal.aborted) throw new Error("Operation cancelled by user");
        
        rounds++;
        setIsAiThinking(true);
        setThinkingStatus(`Synthesizing Round ${rounds}...`);
        const functionResponses = [];
        
        for (const call of response.functionCalls) {
          if (chainController.signal.aborted) break;
          
          // Prevent infinite loops with the same tool calls
          const callKey = `${call.name}:${JSON.stringify(call.args)}`;
          if (seenToolCalls.has(callKey)) {
            console.warn(`[ShaderForge] Skipping duplicate tool call: ${callKey}`);
            continue;
          }
          seenToolCalls.add(callKey);
          
          if (call.name === "query_wolfram") {
            wolframConsultations++;
            if (wolframConsultations > 10) {
              functionResponses.push({
                name: "query_wolfram",
                response: { error: "The Oracle is exhausted. Please try a different approach or simplify your request." },
                id: call.id
              });
              continue;
            }
            const rawQuery = (call.args as any).query;
            
            let finalResult = null;
            let lastError = null;

            setThinkingStatus(`Consulting Oracle: ${rawQuery}...`);
            console.log(`[ShaderForge] Consulting Wolfram Oracle with query: ${rawQuery}`);
            
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s for complex math
              const res = await fetch(`/api/wolfram?input=${encodeURIComponent(rawQuery)}`, { signal: controller.signal });
              clearTimeout(timeoutId);
              
              if (res.ok) {
                const data = await res.text();
                if (isCookieCheckResponse(data)) {
                  functionResponses.push(handleToolError("query_wolfram", data, call.id));
                  continue;
                }
                
                if (data && data.trim().length > 0 && !data.includes("Wolfram|Alpha did not understand your input")) {
                  // Truncate large results
                  finalResult = data.length > 3000 ? data.slice(0, 3000) + "... [Truncated]" : data;
                } else {
                  lastError = "Oracle returned empty or misunderstood result. Try rephrasing the math.";
                }
              } else {
                const text = await res.text();
                if (isCookieCheckResponse(text)) {
                  functionResponses.push(handleToolError("query_wolfram", text, call.id));
                  continue;
                }
                
                let errorData;
                try {
                  errorData = JSON.parse(text);
                } catch(e) {
                  errorData = { error: text || "Unknown error" };
                }

                if (res.status === 500 && errorData.error?.includes("not configured")) {
                  lastError = "The Wolfram Oracle has not been configured with an AppID. Please set WOLFRAM_APP_ID in the environment.";
                } else {
                  lastError = `Oracle failed: ${errorData.error || res.statusText}`;
                }
              }
            } catch (e) {
              lastError = "Oracle timed out or connection failed. The math might be too complex for a quick answer.";
            }

            if (finalResult) {
              functionResponses.push({
                name: "query_wolfram",
                response: { result: finalResult },
                id: call.id
              });
            } else {
              functionResponses.push({
                name: "query_wolfram",
                response: { error: lastError },
                id: call.id
              });
            }
          } else if (call.name === "fetch_github_context") {
            const path = (call.args as any).path;
            setThinkingStatus(`Reading GitHub scrolls: ${path}...`);
            const [owner, repo] = githubRepo.split('/');
            if (!owner || !repo) {
              functionResponses.push({
                name: "fetch_github_context",
                response: { error: "No GitHub repository connected. Ask the user to connect one first." },
                id: call.id
              });
            } else {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const res = await fetch(`/api/github/repo?owner=${owner}&repo=${repo}&path=${path}`, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (!res.ok) {
                  const text = await res.text();
                  if (isCookieCheckResponse(text)) {
                    functionResponses.push(handleToolError("fetch_github_context", text, call.id));
                  } else {
                    functionResponses.push({
                      name: "fetch_github_context",
                      response: { error: `Failed to fetch from GitHub: ${res.statusText}` },
                      id: call.id
                    });
                  }
                } else {
                  const data = await res.json();
                  const stringified = JSON.stringify(data);
                  const truncated = stringified.length > 4000 ? stringified.slice(0, 4000) + "... [Truncated]" : stringified;
                  functionResponses.push({
                    name: "fetch_github_context",
                    response: { result: truncated },
                    id: call.id
                  });
                }
              } catch (e) {
                functionResponses.push({
                  name: "fetch_github_context",
                  response: { error: "Failed to fetch GitHub context (timeout)" },
                  id: call.id
                });
              }
            }
          } else if (call.name === "read_notebook_context") {
            setThinkingStatus("Consulting the Notebook...");
            const truncated = notebookContext.length > 4000 ? notebookContext.slice(0, 4000) + "... [Truncated]" : notebookContext;
            functionResponses.push({
              name: "read_notebook_context",
              response: { result: truncated || "No notebook context provided yet." },
              id: call.id
            });
          } else if (call.name === "update_memory") {
            const { type, content } = call.args as any;
            setThinkingStatus(`Updating memory: ${type}...`);
            setMemory(prev => {
              const next = { ...prev };
              if (type === 'preference') {
                next.preferences = [...new Set([...next.preferences, content])].slice(-15);
              } else {
                next.inspirations = [...new Set([...next.inspirations, content])].slice(-15);
              }
              return next;
            });
            functionResponses.push({
              name: "update_memory",
              response: { status: "Memory updated successfully." },
              id: call.id
            });
          }
        }

        if (chainController.signal.aborted) throw new Error("Operation cancelled by user");

        // Send function responses back to the model
        if (functionResponses.length > 0) {
          setThinkingStatus("Synthesizing Oracle data...");
          response = await safeSendMessage(chat, {
            message: {
              parts: functionResponses.map(fr => ({
                functionResponse: {
                  name: fr.name,
                  response: fr.response,
                  id: fr.id
                }
              }))
            }
          });
        } else {
          // Break if no responses were generated to avoid infinite loop
          break;
        }
      }
      
      setThinkingStatus("Forging response...");
      setIsAiThinking(false);
      
      const text = response.text || '';
      const finishReason = response.candidates?.[0]?.finishReason;
      
      if (!text && finishReason !== 'STOP') {
        console.warn(`[ShaderForge] Oracle stopped unexpectedly. Reason: ${finishReason}`);
        if (finishReason === 'MAX_TOKENS') {
          throw new Error("The Oracle's vision was too grand for this realm (Max Tokens). Try a more focused request.");
        } else if (finishReason === 'SAFETY') {
          throw new Error("The Oracle's vision was obscured by safety wards. Try a different vibe.");
        }
      }

      try {
        // Try to parse the whole text as JSON
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          // If direct parse fails, try to extract JSON block
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (e2) {
              console.warn("[ShaderForge] Failed to parse extracted JSON block", e2);
            }
          }
        }

        if (parsed && (parsed.forge || parsed.message)) {
          const assistantMessage = parsed.message || "";
          
          if (parsed.forge && parsed.forge.glsl) {
            const code = parsed.forge.glsl.replace(/```[\w]*/g, '').replace(/```/g, '').trim();
            setGlsl(code);
            setHistory(h => [{ vibe: parsed.forge.vibe || 'custom', code, ts: Date.now() }, ...h].slice(0, 10));
            startRef.current = Date.now();
            setIsForging(true);
            setTimeout(() => {
              runShader(code);
              setIsForging(false);
            }, 50);
            speak("Shader forged.");
            
            const finalContent = assistantMessage ? `${assistantMessage}\n\n**Forged:** "${parsed.forge.vibe}"` : `Forged: "${parsed.forge.vibe}"`;
            setMessages(m => [...m, { role: 'assistant', content: finalContent }]);
            return; // Success!
          } else if (assistantMessage) {
            setMessages(m => [...m, { role: 'assistant', content: assistantMessage }]);
            speak(assistantMessage.slice(0, 150));
            return; // Success (message only)
          }
        }

        // Fallback to robust regex extraction if JSON parsing failed or was incomplete
        console.log("[ShaderForge] JSON parsing failed or incomplete, attempting robust regex extraction");
        
        // 1. Try to find GLSL code blocks first (most reliable)
        const glslBlockMatch = text.match(/```(?:glsl|cpp|c|hlsl)?\s*([\s\S]*?)```/i);
        const glslPropertyMatch = text.match(/"glsl"\s*:\s*"([\s\S]*?)"/i);
        
        // 2. Try to find vibe and message
        const vibeMatch = text.match(/"vibe"\s*:\s*"([\s\S]*?)"/i);
        const messageMatch = text.match(/"message"\s*:\s*"([\s\S]*?)"/i);

        const extractedCode = glslBlockMatch ? glslBlockMatch[1] : (glslPropertyMatch ? glslPropertyMatch[1] : null);

        if (extractedCode) {
          // Unescape the GLSL code if it came from a JSON property
          let code = extractedCode;
          if (!glslBlockMatch && glslPropertyMatch) {
            code = code
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'")
              .replace(/\\\\/g, '\\');
          }
          
          code = code.trim();
          
          if (code.includes('gl_FragColor') || code.includes('void main')) {
            setGlsl(code);
            const vibe = vibeMatch ? vibeMatch[1] : 'Fragment of Chaos';
            setHistory(h => [{ vibe, code, ts: Date.now() }, ...h].slice(0, 10));
            startRef.current = Date.now();
            setIsForging(true);
            setTimeout(() => {
              runShader(code);
              setIsForging(false);
            }, 50);
            speak("Shader forged from fragments.");
            
            const assistantMessage = messageMatch ? messageMatch[1].replace(/\\n/g, '\n') : "The Oracle's message was truncated, but I have forged the code from the fragments.";
            const finalContent = `${assistantMessage}\n\n**Forged (Partial):** "${vibe}"`;
            setMessages(m => [...m, { role: 'assistant', content: finalContent }]);
            return; // Success!
          }
        }
        
        // If we reach here, we really couldn't find any code, so just show the text
        const cleanText = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        if (cleanText) {
          setMessages(m => [...m, { role: 'assistant', content: cleanText }]);
        } else {
          throw new Error("The Oracle left no trace of its thoughts. Try rephrasing.");
        }
      } catch (e) {
        console.error("[ShaderForge] Final parsing error", e);
        throw e;
      }
    } catch (e: any) {
      if (e.message === "Operation cancelled by user") {
        setMessages(m => [...m, { role: 'assistant', content: "_The connection was severed._" }]);
      } else {
        let displayError = e.message || "An unknown disturbance occurred in the void.";
        
        // Clean up 503/429/JSON errors for the user
        if (displayError.includes("503") || displayError.includes("429") || displayError.includes("UNAVAILABLE") || displayError.includes("high demand") || displayError.includes("overloaded")) {
          displayError = "The Oracle is currently overwhelmed by high demand or quota limits. The math-energies are too turbulent to channel right now. This is a service-level issue at Google. Please wait 10-15 minutes and try your spell again.";
        } else if (displayError.includes("timeout") || displayError.includes("void")) {
          displayError = "The connection to the Oracle timed out. The math might be too complex or the server is struggling. Try a simpler request or check your internet connection.";
        } else if (displayError.includes("{\"error\"")) {
          try {
            const parsed = JSON.parse(displayError);
            if (parsed.error?.message) {
              const innerMessage = parsed.error.message;
              if (innerMessage.includes("503") || innerMessage.includes("high demand")) {
                displayError = "The Oracle is currently overwhelmed by high demand. The math-energies are too turbulent to channel right now. Please wait a few minutes and try your spell again.";
              } else {
                displayError = innerMessage;
              }
            }
          } catch (p) {
            // Fallback
          }
        }

        setMessages(m => [...m, { role: 'assistant', content: `**Oracle Disturbance:** ${displayError}` }]);
      }
    } finally {
      setIsChatLoading(false);
      setIsAiThinking(false);
      abortControllerRef.current = null;
    }
  };

  const cancelThinking = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsChatLoading(false);
    setIsAiThinking(false);
    setThinkingStatus("Connection severed.");
  };


  // ── Wolfram Alpha ──────────────────────────────────────────────────────────
  const queryWolfram = async (overrideQuery?: string) => {
    const q = overrideQuery || wolframQuery;
    if (!q.trim() || isWolframLoading) return;
    setIsWolframLoading(true);
    setWolframResult('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`/api/wolfram?input=${encodeURIComponent(q)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.text();
      setWolframResult(data);
      speak("Wolfram calculation complete.");
    } catch (e) {
      setWolframResult("The Oracle is taking too long to respond. Try a simpler question.");
    } finally {
      setIsWolframLoading(false);
    }
  };

  // ── GitHub Integration ─────────────────────────────────────────────────────
  const fetchGithubRepo = async () => {
    if (!githubRepo.trim()) return;
    const [owner, repo] = githubRepo.split('/');
    if (!owner || !repo) return;

    try {
      const res = await fetch(`/api/github/repo?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setGithubFiles(data);
      } else {
        setGithubFiles([]);
      }
    } catch (e) {
      console.error("GitHub fetch failed", e);
    }
  };

  const saveCurrentToInspirations = () => {
    if (!glsl) return;
    const currentVibe = history[0]?.vibe || "Unnamed Essence";
    const entry = `Vibe: ${currentVibe} | Code Snippet: ${glsl.slice(0, 300)}...`;
    setMemory(prev => ({
      ...prev,
      inspirations: [...new Set([...prev.inspirations, entry])].slice(-15)
    }));
    speak("Vibe saved to inspirations.");
  };

  const addManualPreference = (text: string) => {
    if (!text.trim()) return;
    setMemory(prev => ({
      ...prev,
      preferences: [...new Set([...prev.preferences, text.trim()])].slice(-15)
    }));
  };

  const addManualInspiration = (text: string) => {
    if (!text.trim()) return;
    setMemory(prev => ({
      ...prev,
      inspirations: [...new Set([...prev.inspirations, text.trim()])].slice(-15)
    }));
  };
  const exportChat = () => {
    const content = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shaderwitch-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-screen w-screen bg-abyssal flex flex-col overflow-hidden text-[#d0d0ee] font-sans selection:bg-biolume/30">
      {/* HUD Background Elements */}
      <div className="scanline-overlay" />
      
      {/* Header / HUD */}
      {!isZenMode && (
        <header className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-4 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-void flex items-center justify-center shadow-lg shadow-biolume/20 border border-biolume/30 data-grid-border">
            <Zap className="w-6 h-6 text-biolume" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-biolume via-cyan-400 to-jellyfish animate-shimmer">
              SHADER FORGE 3.0
            </h1>
            <p className="text-[10px] font-mono text-biolume/60 tracking-widest uppercase">Visual DNA Codex // Merry Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto">
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono shadow-lg shadow-red-500/20"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              REC {recSeconds}s
            </motion.div>
          )}
          <button 
            onClick={saveCurrentToInspirations}
            className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all shadow-xl group pointer-events-auto"
            title="Save current shader to Inspirations"
          >
            <Star className="w-5 h-5 text-amber-400 group-hover:fill-amber-400 transition-all" />
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all shadow-xl"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-zinc-500" /> : <Volume2 className="w-5 h-5 text-fuchsia-400" />}
          </button>

          {showCookieError && (
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono shadow-lg animate-pulse flex items-center gap-2"
              title="Fix Connection Issues"
            >
              <Zap className="w-4 h-4" />
              FIX CONNECTION
            </button>
          )}
        </div>
      </header>
    )}

      {/* Main Canvas (Full Screen) */}
      <main className="flex-1 relative overflow-hidden bg-black">
        <div className="absolute inset-0 w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {isForging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-void/60 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 z-40 overflow-hidden"
            >
              {/* Luminous Background Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-jellyfish/20 rounded-full blur-[180px] animate-pulse" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-biolume/20 rounded-full blur-[140px] animate-pulse-soft" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-magenta-500/10 rounded-full blur-[100px] animate-pulse" />
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="absolute -inset-8 bg-biolume/30 rounded-full blur-2xl animate-pulse" />
                  <div className="w-24 h-24 border-4 border-biolume/20 rounded-full" />
                  <div className="absolute inset-0 w-24 h-24 border-4 border-biolume border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 w-24 h-24 border-4 border-jellyfish border-b-transparent rounded-full animate-spin [animation-duration:3s]" />
                  <Zap className="absolute inset-0 m-auto w-10 h-10 text-biolume animate-pulse drop-shadow-[0_0_10px_rgba(0,255,204,0.8)]" />
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <h2 className="text-white font-display tracking-[0.5em] text-2xl font-black uppercase drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]">
                    FORGING LIGHT
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-biolume/30" />
                    <span className="text-biolume font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
                      {isAiThinking ? thinkingStatus : "Trapping math in radiance..."}
                    </span>
                    <div className="h-px w-8 bg-biolume/30" />
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute bottom-12 left-12 font-mono text-[8px] text-white/40 uppercase tracking-[0.5em] [writing-mode:vertical-rl] rotate-180">
                Visual DNA Codex // v3.0
              </div>
              <div className="absolute top-12 right-12 font-mono text-[8px] text-white/40 uppercase tracking-[0.5em] [writing-mode:vertical-rl]">
                Light is the Material
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {shaderError && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/80 backdrop-blur-xl p-4 rounded-2xl border border-red-500/50 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">Compilation Error</span>
              </div>
              <p className="text-red-200 text-[10px] font-mono break-words leading-relaxed">{shaderError}</p>
            </motion.div>
          </div>
        )}

        {/* Floating Panels - Centered and with dock clearance */}
        <AnimatePresence mode="wait">
          {activePanel === 'memory' && (
            <motion.div
              key="memory"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bottom-32 w-[90vw] max-w-2xl z-50 flex flex-col"
            >
              <div className="flex-1 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                      <Book className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold tracking-widest text-white">MEMORY GRIMOIRE</h3>
                      <p className="text-[9px] font-mono text-fuchsia-400/60 uppercase">Stored Essences & Spells</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePanel(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4 text-white/40 rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-12">
                  {/* Preferences */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-fuchsia-400" />
                        <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">User Preferences</h3>
                      </div>
                      <button 
                        onClick={() => {
                          const p = prompt("Enter a new preference (e.g. 'I love neon pink', 'Avoid grid patterns'):");
                          if (p) addManualPreference(p);
                        }}
                        className="p-1 hover:bg-white/10 rounded border border-white/5 text-white/40 hover:text-fuchsia-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {memory.preferences.length === 0 ? (
                        <p className="text-[10px] text-white/30 font-mono italic">No preferences recorded yet...</p>
                      ) : (
                        memory.preferences.map((pref, i) => (
                          <div key={i} className="px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg text-[10px] font-mono text-fuchsia-200/80">
                            {pref}
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Inspirations */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">Inspirations</h3>
                      </div>
                      <button 
                        onClick={() => {
                          const i = prompt("Enter a new inspiration (e.g. 'Cyberpunk city at night', 'Microscopic biology'):");
                          if (i) addManualInspiration(i);
                        }}
                        className="p-1 hover:bg-white/10 rounded border border-white/5 text-white/40 hover:text-cyan-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {memory.inspirations.length === 0 ? (
                        <p className="text-[10px] text-white/30 font-mono italic">No inspirations saved yet...</p>
                      ) : (
                        memory.inspirations.map((insp, i) => (
                          <div key={i} className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-[10px] font-mono text-cyan-100/70 leading-relaxed">
                            {insp}
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Grimoire Source */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.5,2L6.5,12.2L11,20L17,9.8L12.5,2z M7.1,12.5L3.5,18.7L8,18.7L11.6,12.5L7.1,12.5z M17.9,10.3L14.3,16.5L22,16.5L18.4,10.3L17.9,10.3z"/>
                        </svg>
                        <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">Grimoire Source</h3>
                      </div>
                    </div>

                    {!(process.env.GOOGLE_CLIENT_ID || (window as any).__GOOGLE_CLIENT_ID__) ? (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <p className="text-[10px] font-mono text-red-400 leading-relaxed">
                          GOOGLE_CLIENT_ID not set. Add it to your environment and reload. See Google Cloud Console → OAuth 2.0 → Authorized JavaScript Origins.
                        </p>
                      </div>
                    ) : grimoireSources.length === 0 ? (
                      <div className="space-y-4">
                        <p className="text-[10px] font-mono text-white/40 leading-relaxed">
                          Drop text notes, .glsl snippets, and moodboard images into a Google Drive folder. The Witch reads everything and sees your images as aesthetic DNA.
                        </p>
                        {!googleClientId && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
                            <p className="text-[10px] font-mono text-amber-400 leading-relaxed">
                              <span className="font-bold uppercase block mb-1">Google Client ID Missing:</span>
                              To use the Grimoire, you must set the <code className="bg-black/40 px-1 rounded">GOOGLE_CLIENT_ID</code> in AI Studio Secrets.
                            </p>
                          </div>
                        )}

                        <button 
                          onClick={openDrivePicker}
                          disabled={!googleClientId}
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          Connect Google Drive
                        </button>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                          <p className="text-[9px] font-mono text-white/40 leading-relaxed">
                            <span className="text-amber-400/60 font-bold uppercase block mb-1">OAuth Setup Required:</span>
                            If you see "Access blocked" or "redirect_uri_mismatch", ensure your Google Cloud Console "Authorized JavaScript origins" includes:
                            <div className="flex flex-col gap-2 mt-2">
                              <code className="bg-black/40 p-2 text-emerald-400 break-all rounded border border-white/5 text-[10px] leading-tight">
                                {window.location.origin}
                              </code>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin);
                                  alert("URL copied! Now paste this into 'Authorized JavaScript origins' in Google Cloud Console.");
                                }}
                                className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-400 text-[10px] font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3 h-3 rotate-45" />
                                Copy URL for Google Console
                              </button>
                            </div>
                            <span className="block mt-2 text-white/20 italic">Note: If you are in an iframe, try opening the app in a new tab.</span>
                          </p>
                        </div>

                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                          <p className="text-[9px] font-mono text-blue-400/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <RotateCcw className="w-3 h-3" />
                            🔧 OAuth Diagnostics
                          </p>
                          <div className="space-y-1 text-[9px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-white/20">Client ID:</span>
                              <span className="text-white/60">
                                {googleClientId ? `${googleClientId.substring(0, 8)}...${googleClientId.substring(googleClientId.length - 10)}` : 'MISSING'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/20">Origin:</span>
                              <span className="text-white/60 truncate ml-4">{window.location.origin}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/20">Protocol:</span>
                              <span className="text-white/60">{window.location.protocol}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => setGrimoireSources(prev => {
                            if (prev.some(s => s.folderId === '17Alrx_N_JaZ1u8YnG3v3E07Yac-QeUIm')) return prev;
                            return [...prev, { folderId: '17Alrx_N_JaZ1u8YnG3v3E07Yac-QeUIm', folderName: 'Math Bank' }];
                          })}
                          disabled={!googleClientId}
                          className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Book className="w-3 h-3" />
                          Connect Math Bank
                        </button>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            placeholder="Or paste Folder ID..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-white/60 focus:outline-none focus:border-emerald-500/50 transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  // Extract ID from URL if needed
                                  const id = val.includes('folders/') ? val.split('folders/')[1].split('?')[0] : val;
                                  setGrimoireSources(prev => {
                                    if (prev.some(s => s.folderId === id)) return prev;
                                    return [...prev, { folderId: id, folderName: 'Manual Folder' }];
                                  });
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {grimoireSources.map((src, idx) => (
                          <div key={src.folderId} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                            <div className="min-w-0">
                              <a 
                                href={`https://drive.google.com/drive/folders/${src.folderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono text-emerald-400 hover:underline truncate block"
                              >
                                {src.folderName}
                              </a>
                            </div>
                            <button 
                              onClick={() => {
                                setGrimoireSources(prev => prev.filter(s => s.folderId !== src.folderId));
                              }}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 transition-colors"
                            >
                              <Square className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-mono text-white/20">
                            {lastGrimoireSync ? `Synced ${new Date(lastGrimoireSync).toLocaleTimeString()}` : 'Not synced yet'}
                          </p>
                          <div className="flex items-center gap-2">
                            {!isDriveAuthorized && (
                              <button 
                                onClick={() => syncAllGrimoireSources(true)}
                                className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-mono text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                Authorize
                              </button>
                            )}
                            <button 
                              onClick={() => syncAllGrimoireSources(true)}
                              disabled={isGrimoireSyncing}
                              className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${isGrimoireSyncing ? 'animate-spin text-emerald-400' : 'text-white/40 hover:text-emerald-400'}`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isGrimoireSyncing && (
                          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400/60 animate-pulse">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                            Syncing...
                          </div>
                        )}

                        {grimoireSyncError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-[9px] font-mono text-red-400 mb-2">{grimoireSyncError}</p>
                            <button 
                              onClick={() => syncAllGrimoireSources(true)}
                              className="text-[9px] font-mono text-white/40 hover:text-white underline"
                            >
                              Try Again
                            </button>
                          </div>
                        )}

                        {!isGrimoireSyncing && !grimoireSyncError && lastGrimoireSync && (
                          <div className="space-y-4">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                              {grimoireSourceContent.length > 0 ? 'Synced' : 'Empty'} · {grimoireImages.length} images
                            </p>
                            
                            {grimoireImages.length > 0 && (
                              <div className="grid grid-cols-4 gap-2">
                                {grimoireImages.map((img, i) => (
                                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                    <img 
                                      src={`data:${img.mediaType};base64,${img.data}`} 
                                      alt={img.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                                      <p className="text-[8px] font-mono text-white truncate w-full text-center">{img.name}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {grimoireSourceContent && (
                              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-[9px] font-mono text-white/50 line-clamp-3 italic">
                                  {grimoireSourceContent.slice(0, 200)}...
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={openDrivePicker}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-white/40 hover:text-white transition-colors"
                              >
                                Add Folder
                              </button>
                              <button 
                                onClick={() => {
                                  setGrimoireSources([]);
                                  setGrimoireImages([]);
                                  setGrimoireSourceContent('');
                                  setLastGrimoireSync(null);
                                  localStorage.removeItem('shader_grimoire_drive_sources');
                                  localStorage.removeItem('shader_grimoire_drive_source');
                                }}
                                className="px-3 py-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg text-[9px] font-mono text-red-400/60 hover:text-red-400 transition-colors"
                              >
                                Disconnect All
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* The Grimoire */}
                  <section className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">The Sacred Grimoire</h3>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-[10px] font-mono text-white/50 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                      {memory.grimoire}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activePanel === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bottom-32 w-[90vw] max-w-2xl z-50 flex flex-col"
            >
              <div className="flex-1 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold tracking-widest text-white">SHADER WITCH</h3>
                      <p className="text-[9px] font-mono text-fuchsia-400/60 uppercase">High Priestess of Math</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1 text-[9px] font-mono uppercase tracking-widest">
                      <button
                        onClick={() => setWitchMode('forge')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          witchMode === 'forge'
                            ? 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40'
                            : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        Forge
                      </button>
                      <button
                        onClick={() => setWitchMode('discuss')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          witchMode === 'discuss'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        Discuss
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={exportChat}
                        title="Export Chat"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActivePanel(null)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Square className="w-4 h-4 text-white/40 rotate-45" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-12">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed relative group ${
                        msg.role === 'user'
                          ? 'bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-100 rounded-tr-none shadow-lg shadow-fuchsia-500/10'
                          : 'bg-white/5 border border-white/10 text-cyan-100/90 rounded-tl-none'
                      }`}>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                        
                        <button 
                          onClick={() => copyToClipboard(msg.content)}
                          className="absolute -right-10 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-fuchsia-400"
                          title="Copy message"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] px-2">
                        {msg.role === 'user' ? 'Adept' : 'Witch'}
                      </span>
                    </motion.div>
                  ))}
                  {isChatLoading && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-fuchsia-400/60 font-mono animate-pulse">
                          <Zap className="w-3 h-3" />
                          {thinkingStatus}
                        </div>
                        <button 
                          onClick={cancelThinking}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[9px] font-mono text-red-400 uppercase tracking-widest transition-all rounded border border-red-500/20"
                        >
                          Sever Connection
                        </button>
                      </div>
                      {isAiThinking && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-400/60 font-mono animate-pulse ml-4">
                          <Cpu className="w-3 h-3" />
                          {thinkingStatus || "Consulting Wolfram Oracle..."}
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-white/5 border-t border-white/5">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Describe a vibe... 'forge it'..."
                      className="w-full bg-black/40 rounded-2xl p-4 pr-14 text-xs text-white border border-white/10 focus:border-fuchsia-500/50 focus:ring-0 resize-none h-24 custom-scrollbar placeholder:text-white/20"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={isChatLoading || !input.trim()}
                      className="absolute bottom-4 right-4 p-3 bg-fuchsia-500 text-white rounded-xl hover:bg-fuchsia-400 disabled:opacity-50 disabled:hover:bg-fuchsia-500 transition-all shadow-lg shadow-fuchsia-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePanel === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bottom-32 w-[90vw] max-w-2xl z-50 flex flex-col"
            >
              <div className="flex-1 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold tracking-widest text-white">ORACLE TOOLS</h3>
                      <p className="text-[9px] font-mono text-amber-400/60 uppercase">Knowledge Integrations</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePanel(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4 text-white/40 rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-12">
                  {/* Wolfram Alpha */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">Wolfram Oracle</h3>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 mb-4">
                      <p className="text-[10px] text-amber-200/60 font-mono leading-relaxed">
                        Ask for formulas, constants, or curves. The Witch uses this data to forge precise geometries.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={wolframQuery}
                        onChange={(e) => setWolframQuery(e.target.value)}
                        placeholder="e.g. 'Julia set formula' or 'Golden ratio'..."
                        className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-xs border border-white/10 focus:border-amber-500/50 focus:ring-0 placeholder:text-white/20"
                        onKeyDown={(e) => e.key === 'Enter' && queryWolfram()}
                      />
                      <button
                        onClick={() => queryWolfram()}
                        disabled={isWolframLoading}
                        className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/30 disabled:opacity-50 transition-all"
                      >
                        {isWolframLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Quick Spells */}
                    <div className="flex flex-wrap gap-2">
                      {['Mandelbrot set', 'Fibonacci spiral', 'Voronoi diagram', 'Sine wave formula', 'Perlin noise'].map((spell) => (
                        <button
                          key={spell}
                          onClick={() => {
                            setWolframQuery(spell);
                            queryWolfram(spell);
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-[9px] font-mono text-amber-400/60 hover:text-amber-400 transition-all"
                        >
                          {spell}
                        </button>
                      ))}
                    </div>

                    {wolframResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-black/40 rounded-2xl border border-amber-500/20 text-[11px] font-mono text-white/60 leading-relaxed relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                          <Zap className="w-8 h-8 text-amber-500" />
                        </div>
                        {wolframResult}
                      </motion.div>
                    )}
                  </section>

                  {/* Recording Tools */}
                  <section className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-red-400" />
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">Capture Engine</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                          isRecording 
                          ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {isRecording ? <Square className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest">Shader Record</div>
                          <div className="text-[8px] opacity-50 font-mono mt-1">Canvas Only (Clean)</div>
                        </div>
                      </button>

                      <button
                        onClick={isRecording ? stopRecording : startScreenRecording}
                        className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                          isRecording 
                          ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <Monitor className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest">Screen Record</div>
                          <div className="text-[8px] opacity-50 font-mono mt-1">Full Window (UI Included)</div>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* GitHub */}
                  <section className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Github className="w-4 h-4 text-white" />
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">GitHub Context</h3>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="owner/repo"
                        className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-xs border border-white/10 focus:border-white/20 focus:ring-0 placeholder:text-white/20"
                        onKeyDown={(e) => e.key === 'Enter' && fetchGithubRepo()}
                      />
                      <button
                        onClick={fetchGithubRepo}
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                    {githubFiles.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {githubFiles.map((file, i) => (
                          <div key={i} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl text-[10px] text-white/50 hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10">
                            <Terminal className="w-4 h-4 text-zinc-500" />
                            <span className="truncate flex-1">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Google Notebook */}
                  <section className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">Notebook Context</h3>
                    </div>
                    <textarea
                      value={notebookContext}
                      onChange={(e) => setNotebookContext(e.target.value)}
                      placeholder="Paste context from Google Notebooks or Colab here..."
                      className="w-full bg-white/5 rounded-xl px-4 py-3 text-[11px] font-mono border border-white/10 focus:border-blue-500/50 focus:ring-0 h-32 resize-none custom-scrollbar placeholder:text-white/20"
                    />
                  </section>

                  <button
                    onClick={() => {
                      sendMessage("Analyze my GitHub context, Wolfram data, and Notebook notes to forge a shader that synthesizes all this knowledge.");
                      setActivePanel('chat');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 hover:from-fuchsia-600/30 hover:to-cyan-600/30 text-white rounded-2xl border border-white/10 flex items-center justify-center gap-3 group transition-all shadow-xl shadow-fuchsia-500/5"
                  >
                    <Sparkles className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-mono uppercase tracking-widest font-bold">Forge from Context</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activePanel === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bottom-32 w-[90vw] max-w-4xl z-50 flex flex-col"
            >
              <div className="flex-1 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                      <Code2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold tracking-widest text-white">GLSL SOURCE</h3>
                      <p className="text-[9px] font-mono text-cyan-400/60 uppercase">Direct Manipulation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(glsl);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                        speak("Code copied.");
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl border border-white/10 text-[10px] font-mono uppercase tracking-widest transition-all"
                    >
                      {isCopied ? 'COPIED!' : 'COPY'}
                    </button>
                    <button 
                      onClick={() => setActivePanel(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Square className="w-4 h-4 text-white/40 rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col min-h-0">
                  <textarea
                    value={glsl}
                    onChange={(e) => {
                      setGlsl(e.target.value);
                      runShader(e.target.value);
                    }}
                    className="flex-1 w-full bg-black/40 rounded-2xl p-6 font-mono text-sm text-cyan-300 border border-white/5 focus:border-fuchsia-500/50 focus:ring-0 resize-none custom-scrollbar leading-relaxed"
                    spellCheck={false}
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-[9px] font-mono text-white/30 uppercase tracking-widest">
                      <button 
                        onClick={() => {
                          const precisions = ['lowp', 'mediump', 'highp'];
                          const currentMatch = glsl.match(/precision (\w+) float;/);
                          const current = currentMatch ? currentMatch[1] : 'mediump';
                          const next = precisions[(precisions.indexOf(current) + 1) % precisions.length];
                          const newGlsl = currentMatch 
                            ? glsl.replace(/precision \w+ float;/, `precision ${next} float;`)
                            : `precision ${next} float;\n${glsl}`;
                          setGlsl(newGlsl);
                          runShader(newGlsl);
                        }}
                        className="hover:text-cyan-400 transition-all flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        Precision: <span className="text-white/60 group-hover:text-white">{glsl.match(/precision (\w+) float;/)?.[1] || 'MediumP'}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setThinkingStatus("Uniforms: time (float), resolution (vec2) are injected by the Forge.");
                          setTimeout(() => setThinkingStatus(""), 3000);
                        }}
                        className="hover:text-fuchsia-400 transition-all flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500/50 group-hover:bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                        Uniforms: <span className="text-white/60 group-hover:text-white">time, resolution</span>
                      </button>
                    </div>
                    <button
                      onClick={() => runShader(glsl)}
                      disabled={isRecompiling}
                      className={`px-6 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-[0.2em] transition-all shadow-lg flex items-center gap-2 ${
                        isRecompiling 
                        ? 'bg-fuchsia-500/40 text-white border-fuchsia-400 shadow-fuchsia-500/30' 
                        : 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border-fuchsia-500/30 shadow-fuchsia-500/10'
                      }`}
                    >
                      {isRecompiling ? (
                        <>
                          <span className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Recompiling...
                        </>
                      ) : 'Recompile Shader'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePanel === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bottom-32 w-[90vw] max-w-sm z-50 flex flex-col"
            >
              <div className="flex-1 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                      <History className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold tracking-widest text-white">FORGE HISTORY</h3>
                      <p className="text-[9px] font-mono text-cyan-400/60 uppercase">Previous Realities</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePanel(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4 text-white/40 rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar pb-12">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                      <RotateCcw className="w-12 h-12" />
                      <p className="text-xs font-mono uppercase tracking-widest">No history yet</p>
                    </div>
                  ) : (
                    history.map((item, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => {
                          setGlsl(item.code);
                          runShader(item.code);
                          speak(`Restoring ${item.vibe}`);
                        }}
                        className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 to-cyan-500/0 group-hover:from-fuchsia-500/5 group-hover:to-cyan-500/5 transition-all" />
                        <div className="relative z-10">
                          <div className="text-xs font-display font-bold text-white/80 mb-1 group-hover:text-white transition-colors capitalize">{item.vibe}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-[9px] text-white/30 font-mono uppercase tracking-tighter">{new Date(item.ts).toLocaleTimeString()}</div>
                            <RotateCcw className="w-3 h-3 text-white/20 group-hover:text-fuchsia-400 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activePanel === 'uniforms' && (
            <motion.div
              key="uniforms"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bottom-32 w-[90vw] max-w-sm z-50 flex flex-col"
            >
              <div className="flex-1 bg-black/60 backdrop-blur-2xl rounded-3xl border border-biolume/20 shadow-2xl flex flex-col overflow-hidden data-grid-border">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-biolume/20 flex items-center justify-center border border-biolume/30">
                      <Cpu className="w-4 h-4 text-biolume" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-bold tracking-widest text-white uppercase">Codex Parameters</h3>
                      <p className="text-[9px] font-mono text-biolume/60 uppercase">Required Uniforms</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePanel(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4 text-white/40 rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-12">
                  <UniformSlider 
                    label="Chromatic Ab" 
                    value={uniforms.u_chromatic_ab} 
                    min={0.003} max={0.05} step={0.001}
                    onChange={(v) => setUniforms(u => ({ ...u, u_chromatic_ab: v }))}
                  />
                  <UniformSlider 
                    label="Warp Scale" 
                    value={uniforms.u_warp_scale} 
                    min={0} max={1.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_warp_scale: v }))}
                  />
                  <UniformSlider 
                    label="Warp Freq" 
                    value={uniforms.u_warp_freq} 
                    min={0.1} max={10.0} step={0.1}
                    onChange={(v) => setUniforms(u => ({ ...u, u_warp_freq: v }))}
                  />
                  <UniformSlider 
                    label="Void Crush" 
                    value={uniforms.u_void_crush} 
                    min={0} max={2.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_void_crush: v }))}
                  />
                  <UniformSlider 
                    label="Iridescence" 
                    value={uniforms.u_iridescence} 
                    min={0} max={5.0} step={0.1}
                    onChange={(v) => setUniforms(u => ({ ...u, u_iridescence: v }))}
                  />
                  <UniformSlider 
                    label="Pulse Rate" 
                    value={uniforms.u_pulse_rate} 
                    min={0.1} max={1.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_pulse_rate: v }))}
                  />
                  <UniformSlider 
                    label="Glitch Amt" 
                    value={uniforms.u_glitch_amt} 
                    min={0} max={1.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_glitch_amt: v }))}
                  />
                  <UniformSlider 
                    label="Glitter Count" 
                    value={uniforms.u_glitter_count} 
                    min={100} max={10000} step={100}
                    onChange={(v) => setUniforms(u => ({ ...u, u_glitter_count: v }))}
                  />
                  <UniformSlider 
                    label="Flow Speed" 
                    value={uniforms.u_flow_speed} 
                    min={0} max={2.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_flow_speed: v }))}
                  />
                  <UniformSlider 
                    label="Viscosity" 
                    value={uniforms.u_viscosity} 
                    min={0} max={1.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_viscosity: v }))}
                  />
                  <UniformSlider 
                    label="Sparkle Sharp" 
                    value={uniforms.u_sparkle_sharpness} 
                    min={10} max={1000} step={10}
                    onChange={(v) => setUniforms(u => ({ ...u, u_sparkle_sharpness: v }))}
                  />
                  <UniformSlider 
                    label="Prismatic" 
                    value={uniforms.u_prismatic} 
                    min={0} max={1.0} step={0.01}
                    onChange={(v) => setUniforms(u => ({ ...u, u_prismatic: v }))}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Dock (Navigation) */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 w-max max-w-[95vw] ${isZenMode ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <nav className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-1 sm:p-2 flex items-center gap-0.5 sm:gap-2 shadow-2xl overflow-x-auto no-scrollbar">
            <NavButton 
              active={activePanel === 'uniforms'} 
              onClick={() => setActivePanel(activePanel === 'uniforms' ? null : 'uniforms')}
              icon={<Cpu className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Codex"
              color="biolume"
            />
            <NavButton 
              active={activePanel === 'memory'} 
              onClick={() => setActivePanel(activePanel === 'memory' ? null : 'memory')}
              icon={<Book className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Grimoire"
              color="jellyfish"
            />
            <NavButton 
              active={activePanel === 'chat'} 
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Witch"
              color="jellyfish"
            />
            <NavButton 
              active={activePanel === 'tools'} 
              onClick={() => setActivePanel(activePanel === 'tools' ? null : 'tools')}
              icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Oracle"
              color="amber"
            />
            <NavButton 
              active={activePanel === 'editor'} 
              onClick={() => setActivePanel(activePanel === 'editor' ? null : 'editor')}
              icon={<Code2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Source"
              color="biolume"
            />
            <NavButton 
              active={activePanel === 'history'} 
              onClick={() => setActivePanel(activePanel === 'history' ? null : 'history')}
              icon={<History className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="History"
              color="cyanotype"
            />
            <NavButton 
              active={isListening} 
              onClick={startListening}
              icon={isListening ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-biolume" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Voice"
              color="jellyfish"
            />
            <div className="w-px h-6 sm:h-8 bg-white/10 mx-0.5 sm:mx-1 shrink-0" />
            <NavButton 
              active={false}
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `shader-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                speak("Snapshot saved.");
              }}
              icon={<Download className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Snapshot"
              color="cyanotype"
            />
            <NavButton 
              active={isRecording}
              onClick={isRecording ? stopRecording : startRecording}
              icon={isRecording ? <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-sm animate-pulse" /> : <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full" />}
              label={isRecording ? "Stop" : "Record"}
              color="amber"
            />
            <div className="w-px h-6 sm:h-8 bg-white/10 mx-0.5 sm:mx-1 shrink-0" />
            <NavButton 
              active={false}
              onClick={() => setIsZenMode(true)}
              icon={<Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="Zen"
              color="biolume"
            />
          </nav>
        </div>

        {/* Exit Zen Mode Button */}
        {isZenMode && (
          <button
            onClick={() => setIsZenMode(false)}
            className="absolute top-8 right-8 z-[100] p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group pointer-events-auto"
            title="Exit Zen Mode"
          >
            <Minimize2 className="w-6 h-6" />
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Exit Zen Mode
            </span>
          </button>
        )}
      </main>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
      </div>
    </div>
  );
};

// ── Helper Components ────────────────────────────────────────────────────────
const UniformSlider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-mono text-biolume">{value.toFixed(3)}</span>
    </div>
    <input 
      type="range" 
      min={min} max={max} step={step} 
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-biolume"
    />
  </div>
);

const NavButton = ({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string }) => {
  const colors: Record<string, string> = {
    biolume: active ? 'bg-biolume text-black shadow-[0_0_20px_rgba(0,255,204,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5',
    jellyfish: active ? 'bg-jellyfish text-white shadow-[0_0_20px_rgba(157,0,255,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5',
    amber: active ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5',
    cyanotype: active ? 'bg-cyanotype text-white shadow-[0_0_20px_rgba(0,43,92,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${colors[color]}`}
    >
      {icon}
      <span className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 backdrop-blur-xl rounded-lg text-[10px] font-mono uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20 shadow-xl`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="active-nav"
          className="absolute inset-0 rounded-2xl border-2 border-white/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
};
