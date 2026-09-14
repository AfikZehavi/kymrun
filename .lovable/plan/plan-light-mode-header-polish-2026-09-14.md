# Plan: Light-mode header polish

## Goal
Make the sticky header feel native in light mode while keeping the existing dark look intact.

## What will change
1. Header background
   - Light mode: solid white (`bg-white`).
   - Dark mode: keep current translucent dark background (`bg-background/85`).
2. Header text
   - Ensure logo, subtitle and desktop nav use theme tokens that read cleanly on white (`text-foreground`, `text-muted-foreground`).
3. Header buttons (cart, theme toggle)
   - Use a light-friendly surface (`bg-card`, `text-foreground`, `border-border`) so they remain visible and clickable in light mode.
   - Keep the same appearance in dark mode via existing tokens.
4. Verify the border under the header still separates it from the page in both modes.

## Files to edit
- `src/routes/index.tsx` — header component classes.
- `src/components/theme-toggle.tsx` — confirm the toggle icon/button adapts to light mode.

## Out of scope
- No backend, catalog, cart, or checkout changes.
- No theme color tokens outside the header.
