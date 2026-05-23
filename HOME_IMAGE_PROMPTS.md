# Home Page — AI Image Prompts

Generate these with ChatGPT (DALL·E) or Gemini, then drop the files into:

```
public/Home/
```

The home page already references these exact filenames and **falls back to icons/gradients** until the files exist — so nothing breaks if some are missing. Just add them one by one.

> ✅ Heroes (`hero1.png`, `hero2.png`, `hero3.png`) are already added and auto-optimized to
> `.webp` (~160 KB each). Still needed: `ai-assistant.png`, `product-placeholder.png`,
> `empty-state.png`, and optional `cat-*.png`.

> Tip: when a tool offers a size, pick the closest. Keep file sizes small (ideally < 300 KB each; run through https://tinypng.com after generating).

---

## Shared style (paste this into every prompt)

```
Style: modern glassmorphism, light mode, premium B2B e-commerce for an electrical,
plumbing and lighting products company. Clean, airy, professional. Soft frosted-glass
surfaces, gentle shadows, smooth gradients. Brand colors: indigo #4F6DFF transitioning
to violet #7C3AED, with white and soft blue-grey (#EEF2FF) accents. No text, no words,
no logos, no watermarks. High detail, crisp studio lighting, subtle depth.
```

---

## 1. Hero artwork (3 slides) — ✅ DONE

- **Files:** `hero1.png`, `hero2.png`, `hero3.png` (added; auto-converted to `.webp`)
- **Size:** 900 × 700 px (or larger), **PNG with transparent background**
- **Where:** right side of the big purple hero banner (sits over the indigo→violet gradient, so the subject must read on a dark/purple background)
- **Composition:** subject grouped on the **right** ~45% of the frame; leave the left empty for headline text. Floating / hero-product arrangement.

**hero-1.png — "New Arrivals"**
```
<shared style>
A floating arrangement of modern electrical and lighting products on a transparent
background: a glowing LED bulb, a sleek ceiling light, a modular wall switch, a coil of
red and blue electrical wire, and a chrome water tap. Products float with soft reflections
and a subtle indigo-to-violet glow rim light, as if showcased mid-air. Designed to sit on
the RIGHT side of a purple gradient banner. Transparent background, PNG.
```

**hero-2.png — "Top Sellers"**
```
<shared style>
A hero cluster of best-selling electrical hardware floating on a transparent background:
a 1200mm ceiling fan, an MCB circuit breaker, an LED panel light, and stacked PVC pipes,
arranged dynamically with a soft golden "best seller" glow and indigo-violet rim lighting.
Right-weighted composition for a purple gradient banner. Transparent background, PNG.
```

**hero-3.png — "Catalogs"**
```
<shared style>
A glassmorphism product catalog concept floating on a transparent background: an open
digital catalog / tablet showing product cards, surrounded by small floating product
thumbnails (bulb, switch, pipe fitting) and a glowing "share" arrow motif. Indigo-violet
glow. Right-weighted composition for a purple gradient banner. Transparent background, PNG.
```

---

## 2. AI assistant mascot — REQUIRED

- **File:** `ai-assistant.png`
- **Size:** 480 × 480 px, **PNG with transparent background**
- **Where:** the "Need help finding something?" card (sits inside a small rounded violet tile)

```
<shared style>
A friendly, minimal robot assistant mascot, head-and-shoulders, facing forward with a warm
expression and softly glowing cyan eyes. Rounded, approachable, modern design in white and
indigo-violet with a subtle metallic sheen. Centered, clean silhouette. Transparent
background, PNG. No text.
```

---

## 3. Product placeholder — REQUIRED

- **File:** `product-placeholder.png`
- **Size:** 800 × 600 px (4:3), PNG or JPG
- **Where:** shown on product cards when a product has no photo (ERP images often missing)

```
<shared style>
A generic, elegant product placeholder: a softly lit frosted-glass cube/box on a clean
light blue-grey gradient background (#EEF2FF), with a subtle indigo-violet glow and a faint
"image coming soon" feel conveyed only through a minimalist box/package icon silhouette in
the center. Calm, neutral, premium. No text. 4:3 aspect ratio.
```

---

## 4. Empty-state illustration — RECOMMENDED

- **File:** `empty-state.png`
- **Size:** 400 × 400 px, **PNG with transparent background**
- **Where:** centered inside "no data for this period" cards (sits in a small round tile)

```
<shared style>
A small friendly empty-state illustration: an open empty cardboard/parcel box with a soft
indigo-violet glow rising from it and a few tiny floating sparkles, suggesting "nothing here
yet, check back soon." Minimal, cute, professional. Centered. Transparent background, PNG.
No text.
```

---

## 5. Category tiles — OPTIONAL (nice polish)

Categories are currently shown with vector icons (always crisp, no files needed). If you
want richer category art, generate these and tell me — I'll wire them in mapped by name.

- **Files:** `cat-lighting.png`, `cat-electrical.png`, `cat-plumbing.png`, `cat-hardware.png`, `cat-tools.png`
- **Size:** 240 × 240 px, **PNG transparent**

```
<shared style>
A single [CATEGORY] product icon-illustration, centered, floating with a soft indigo-violet
glow on a transparent background. Clean, simple, recognizable, premium 3D-ish look.
[CATEGORY] = a glowing LED bulb (lighting) / a wall switch + wire (electrical) /
a chrome pipe fitting + tap (plumbing) / a wrench + bolts (hardware) / a power drill (tools).
Transparent background, PNG. No text.
```

---

## Quick checklist

| File | Status | Size | Background |
|------|--------|------|-----------|
| `hero1.png` | ✅ done | 900×700 | transparent |
| `hero2.png` | ✅ done | 900×700 | transparent |
| `hero3.png` | ✅ done | 900×700 | transparent |
| `ai-assistant.png` | ⏳ needed | 480×480 | transparent |
| `product-placeholder.png` | ⏳ needed | 800×600 | any |
| `empty-state.png` | ⭐ recommended | 400×400 | transparent |
| `cat-*.png` (×5) | optional | 240×240 | transparent |

Drop files into `public/Home/`, hard-refresh, and they appear automatically. PNGs are fine —
large ones can be optimized to `.webp` like the heroes were.
