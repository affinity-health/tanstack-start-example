---
name: Affinity Agent-Native Telehealth
description: Editorial warmth outside, precise clinical utility inside.
colors:
  ink: "#151512"
  paper: "#f3efe5"
  paper-deep: "#e6dfd0"
  line: "#c9c0af"
  muted: "#6f695f"
  signal-orange: "#f05a28"
  signal-acid: "#d8ff3e"
  clinical-teal: "#0b665f"
  clinical-surface: "#f7faf8"
typography:
  display:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
    fontSize: "clamp(64px, 8.5vw, 118px)"
    fontWeight: 400
    lineHeight: 0.84
    letterSpacing: "-0.04em"
  body:
    fontFamily: '"Avenir Next", Avenir, "Century Gothic", sans-serif'
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.55
  label:
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.04em"
rounded:
  control: "8px"
  panel: "10px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "18px"
  lg: "24px"
components:
  public-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "12px 18px"
  clinical-panel:
    backgroundColor: "{colors.clinical-surface}"
    rounded: "{rounded.panel}"
    padding: "18px"
---

# Design System: Affinity Agent-Native Telehealth

## Overview

**Creative North Star: "The Clinical Field Guide"**

The public experience pairs the warmth and confidence of an editorial field guide with a compact,
trustworthy clinical workspace. Large serif headlines introduce the product; the authenticated UI
switches to denser sans-serif controls, restrained teal status color, and explicit Test-mode labels.
Safety information is visible, never decorative or hidden behind motion.

**Key Characteristics:** warm paper, black ink, rare signal orange, precise clinical teal, strong
type contrast, flat bordered surfaces, and human-readable state changes.

## Colors

The public palette is paper-and-ink with sparing high-energy signals; clinical screens use cooler
neutral surfaces and teal for verified, safe state.

**The Signal Rarity Rule.** Orange and acid are reserved for emphasis and interaction, not large
background fields. Red is reserved for errors. Affinity Test and synthetic-data labels must remain
plainly visible wherever clinical context appears.

## Typography

**Display Font:** Iowan Old Style with Palatino and Georgia fallbacks  
**Body Font:** Avenir Next with Avenir and Century Gothic fallbacks  
**Label/Mono Font:** SFMono-Regular with Consolas and Liberation Mono fallbacks

Editorial serif display type gives the public page a human voice. Sans-serif body type keeps product
copy direct; monospaced labels identify technical evidence without becoming visual wallpaper.

## Layout

Public content uses an 1180px maximum shell with 24px minimum side gutters, asymmetric hero columns,
and generous vertical separation. The demo becomes a two-column directory/detail workspace on wide
screens and a single reading-order column on mobile. Clinical screens favor compact panels and
four-column form grids that collapse at existing breakpoints. Keep the safety context inside the
first mobile viewport.

## Elevation & Depth

The system is flat by default. One-pixel borders, small tonal shifts, and nested paper colors express
hierarchy; shadows are exceptional interaction feedback, not persistent decoration.

## Shapes

Public calls to action are firm and mostly square. Clinical controls use 8px corners and contained
panels use 10px corners. Pills are reserved for terse status labels. Avoid rounding every section
into a floating card.

## Components

Buttons are direct and high-contrast, with obvious hover and keyboard-focus treatment. Patient rows
act as a sequence leading to one detail panel, not a grid of equal feature cards. Agent status bars
combine an icon, a plain-language capability statement, and current registration state. The
prescribing form places its explicit clinician-confirmation control immediately before the create
button; changing any draft field clears confirmation.

## Do's and Don'ts

- Do show agent-triggered changes in the same UI the clinician uses.
- Do pair Test mode with synthetic-data language when confusion could create risk.
- Do maintain keyboard focus rings and live-region announcements.
- Don't use eyebrow labels as generic decoration.
- Don't let agent status text fall below 11px.
- Don't animate consequential clinical state or hide it in transient feedback.
