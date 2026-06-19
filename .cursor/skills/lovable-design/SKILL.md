---
name: lovable-design
description: >-
  Vitamin-AI UI and design language inspired by Lovable — warm cream canvas,
  charcoal typography, opacity-based neutrals, inset-button depth, and shadcn
  components. Use when building or updating pages, components, layouts, styling,
  typography, spacing, colors, buttons, cards, navigation, or onboarding/feed UI.
---

# Lovable Design System (Vitamin-AI)

Apply this design language consistently across the entire Vitamin-AI website.
Full reference: [DESIGN-lovable.md](DESIGN-lovable.md)

## Quick tokens

| Token | Value | Use |
|-------|-------|-----|
| Cream background | `#f7f4ed` | Page, cards, inputs |
| Charcoal text | `#1c1c1c` | Headings, primary text |
| Muted gray | `#5f5f5d` | Body secondary, captions |
| Off-white on dark | `#fcfbf8` | Button text on charcoal |
| Passive border | `#eceae4` | Cards, dividers, inputs |
| Interactive border | `rgba(28,28,28,0.4)` | Outlines, ghost buttons |
| Focus shadow | `rgba(0,0,0,0.1) 0px 4px 12px` | Focus/active states |
| Ring | `rgba(59,130,246,0.5)` | Keyboard focus on inputs |

## Typography

- **UI/body**: `Inter`, `ui-sans-serif`, `system-ui` (stand-in until Camera Plain Variable is licensed)
- **Wordmark only**: `Cal Sans` for "Vitamin-AI" logo text
- **Weights**: 400 (body/UI), 600 (headings) — never 700
- **Display letter-spacing**: -1.5px @ 60px, -1.2px @ 48px, -0.9px @ 36px
- **Body**: 16px / 1.5; captions 14px; muted `#5f5f5d`

## Components (shadcn)

Always prefer shadcn/Radix primitives styled with Tailwind + CSS variables from `globals.css`.

### Buttons
- **Primary**: charcoal bg, off-white text, 6px radius, inset shadow (`.shadow-inset-button`)
- **Outline**: transparent, `rgba(28,28,28,0.4)` border, 6px radius
- **Secondary/cream**: `#f7f4ed` bg, no border
- **Pill/icon**: `9999px` radius only for icon toggles — not rectangular CTAs
- Active: `opacity-80`

### Cards
- Background `#f7f4ed`, border `1px solid #eceae4`, radius 12px
- No drop shadows — borders define containment
- Hover: border darkens slightly, not heavy shadow

### Inputs
- Cream bg, `#eceae4` border, 6px radius, placeholder `#5f5f5d`

### Navigation / sidebar
- Cream background, charcoal text at 14–16px weight 400
- Hover: `rgba(28,28,28,0.04)` tint
- Dividers: `#eceae4`

## Spacing

Base unit 8px. Section gaps: 80px–128px desktop, 64px mobile. Card internal: 12–24px.

## Do

- Use cream `#f7f4ed` — never pure white page backgrounds
- Derive grays from `#1c1c1c` opacity (4%, 40%, 82%)
- Use `#eceae4` borders instead of card shadows
- Use semantic Tailwind tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`
- Keep Vitamin-AI wordmark in Cal Sans; everything else follows this system

## Don't

- Don't use orange/saturated accent colors (legacy theme removed)
- Don't use heavy box-shadows on cards
- Don't use weight 700
- Don't use 9999px radius on standard rectangular buttons
- Don't mix `#f7f7f5` or ad-hoc `black/xx` when tokens exist

## Implementation files

- Tokens & utilities: `src/app/globals.css`
- Primitives: `src/components/ui/*`
- Layout: `src/components/layout/*`
- Pages: `src/app/*`

When adding UI, read tokens from CSS variables first — do not hardcode hex unless matching a one-off from this spec.
