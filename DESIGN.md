# DESIGN.md

## Luminous Neo-Glass Design Language

---

# Overview

A premium visual system combining:

* Dark luxury surfaces
* Soft glassmorphism
* Gradient illumination
* Editorial spacing
* Photo-first hierarchy
* Ambient depth

This system should feel **celebratory, emotional, and tactile** rather than technical or minimal.

Design inspiration:

```text
Apple Photos
Arc Browser
Linear
Modern social + event platforms
```

Core principle:

```text
Content floats above illuminated glass.
```

---

# Brand Personality

```text
Premium
Warm
Social
Modern
Celebratory
Night-native
Elegant
```

Avoid:

```text
Corporate
Dense
Industrial
Utility-first
Harsh contrast
```

---

# Visual Formula

```text
Deep Indigo Background
+
Glass Surfaces
+
Pink → Purple Gradient
+
Ambient Glow
+
Rounded Geometry
+
Editorial Spacing
+
Photo-First Layout
=
Luminous Neo-Glass
```

---

# Color System

## Background Layers

```css
--bg-900: #090918;
--bg-850: #0F1023;
--bg-800: #151735;
--bg-700: #1D1F42;
```

Base background:

```css
background:
linear-gradient(
180deg,
#090918 0%,
#10122C 40%,
#0C0D20 100%
);
```

Atmospheric overlay:

```css
background:
radial-gradient(
circle at top center,
rgba(117,84,255,.18),
transparent 60%
);
```

---

## Accent Gradient

Primary accent:

```css
--accent:
linear-gradient(
135deg,
#FF6AA9 0%,
#B65DFF 100%
);
```

Extended palette:

```text
Pink      → #F973B7
Purple    → #D26CFF
Indigo    → #7C5CFF
```

Glow:

```css
box-shadow:
0 0 24px rgba(214,108,255,.28);
```

---

## Semantic Colors

```css
Success → #56D892
Warning → #FFBE55
Danger  → #FF5F7B

Text Primary   → rgba(255,255,255,.92)
Text Secondary → rgba(255,255,255,.55)
Text Tertiary  → rgba(255,255,255,.30)
```

---

# Typography

## Font Stack

```text
SF Pro
Inter
Geist
```

Weights:

```text
Title     → 700
Section   → 600
Body      → 500
Metadata  → 400
```

Tracking:

```css
letter-spacing:
-0.02em;
```

---

## Type Scale

```text
Display → 32
Title   → 24
Heading → 20
Body    → 16
Caption → 14
Meta    → 12
```

---

# Surface Language

## Glass Cards

```css
background:
rgba(255,255,255,.03);

backdrop-filter:
blur(18px);

border:
1px solid rgba(255,255,255,.08);

box-shadow:
0 8px 32px rgba(0,0,0,.32);

border-radius:
24px;
```

---

## Elevated Glass

```css
background:
rgba(255,255,255,.06);

border:
1px solid rgba(255,255,255,.10);

box-shadow:
0 0 40px rgba(165,112,255,.15);
```

---

# Layout Principles

## Floating Stack

Structure:

```text
Header

Controls

Search

Content

Primary CTA

Bottom Navigation
```

Vertical spacing:

```text
20–32px
```

---

## Rounded Masonry Grid

Photo cards:

```text
2 columns
12px spacing
24px radius
```

Cards should feel soft and editorial.

---

# Spacing System

Base scale:

```text
4
8
12
16
20
24
32
40
```

Usage:

```text
Screen padding → 24
Section gap    → 28
Card spacing   → 12
Button inset   → 18 × 24
```

---

# Components

## Primary Button

```css
height:56px;

background:
linear-gradient(
90deg,
#FF6DAE,
#B35DFF
);

border-radius:
999px;

box-shadow:
0 12px 40px rgba(205,95,255,.25);
```

---

## Secondary Button

```css
background:
rgba(255,255,255,.04);

border:
1px solid rgba(255,255,255,.06);
```

---

## Segmented Controls

Selected:

```text
Gradient fill
Inner glow
```

Inactive:

```css
opacity:.45;
```

---

# Photo Treatment

Images are primary content.

```css
border-radius:24px;

overflow:hidden;
```

Overlay:

```css
background:
linear-gradient(
transparent,
rgba(0,0,0,.10)
);
```

Action chips:

```text
40×40
Glass circle
Top-right
Gradient active state
```

---

# Navigation

Bottom navigation:

```css
background:
rgba(255,255,255,.02);

backdrop-filter:
blur(20px);

border-radius:
28px;
```

Active:

```text
Gradient
Glow
```

Inactive:

```css
opacity:.60;
```

---

# Motion System

Timing:

```text
Fast   → 140ms
Medium → 200ms
```

Curves:

```text
ease-out
spring
```

Transitions:

### Enter

```text
fade
scale 96 → 100
```

### Press

```text
scale(.98)
brightness(1.08)
```

### Hover / Focus

```text
translateY(-2)
```

No exaggerated bounce.

---

# Lighting

Use ambient lighting.

Never:

```text
Hard shadows
Pure black
```

Preferred:

```css
0 10px 50px rgba(0,0,0,.35)

+

0 0 32px rgba(185,109,255,.12)
```

---

# Iconography

Style:

```text
Rounded
Thin
Monoline
```

Specs:

```text
Stroke → 1.75–2
Size   → 20–22
```

Container:

```css
background:
rgba(255,255,255,.03);

border:
1px solid rgba(255,255,255,.06);
```

---

# Design Tokens

```json
{
  "radius": {
    "sm": 12,
    "md": 18,
    "lg": 24,
    "xl": 28,
    "pill": 999
  },

  "blur": {
    "card": 18,
    "nav": 24
  },

  "spacing": [4,8,12,16,20,24,32],

  "motion": {
    "fast": 140,
    "medium": 200
  }
}
```

---

# Anti-Patterns

Avoid:

❌ Flat white cards
❌ Dense screens
❌ Sharp corners
❌ Over-saturated gradients
❌ Heavy outlines
❌ Utility-first layouts

Prefer:

✅ Atmosphere
✅ Selective glow
✅ Depth
✅ Breathing room
✅ Floating interaction surfaces

---

# Success Metric

If users describe the UI as:

```text
Elegant
Expensive
Calm
Smooth
Premium
Photo-first
```

the design language is working.
