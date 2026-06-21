# Design System
**Project**: MemoryOS Startup Upgrade Phase 1.0

## 1. Color Palette

### Base Theme (Dark Mode Only)
- **Deep Background**: `#050505` (True Black with slight warmth)
- **Surface Level 1**: `#111111` (Cards and panels)
- **Surface Level 2**: `#1A1A1A` (Hover states and active elements)

### Accents
- **Primary (Emerald)**: `#10B981`
  - *Usage*: Success states, primary buttons, positive trend metrics.
  - *Glow*: `rgba(16, 185, 129, 0.2)`
- **Secondary (Purple)**: `#8B5CF6`
  - *Usage*: AI activity, memory nodes, deep insights.
  - *Glow*: `rgba(139, 92, 246, 0.2)`
- **Tertiary (Cyan/Blue)**: `#06B6D4`
  - *Usage*: Agent connections, neutral data charts.

### Typography
- **Primary Font**: `Inter` or `Outfit`
- **Headings**: Clean, high contrast (`#FFFFFF`), tight letter spacing.
- **Body Text**: Muted grays (`#A3A3A3`) for readability against the dark theme.
- **Monospace**: `JetBrains Mono` for code snippets, JSON memory blocks, and terminal logs.

## 2. UI Paradigms

### Glassmorphism
- **Background Blur**: Base components will utilize `backdrop-filter: blur(12px)` to allow animated background blobs to softly shine through.
- **Translucent Surfaces**: Card backgrounds set to `rgba(255, 255, 255, 0.03)`.
- **Gradient Borders**: Components will feature 1px borders using linear gradients transitioning from `rgba(255,255,255,0.1)` to transparent to give depth.

### Shapes & Edges
- **Border Radius**: Consistent rounding.
  - Global cards: `16px` (xl)
  - Inner elements / buttons: `8px` (md)
  - Badges / tags: Fully rounded (`9999px`)

## 3. Data Visualization Styling
- **Recharts**: Stripped of default grid lines. Tooltips will utilize the glassmorphism blur effect. Lines will use smooth curves (`monotone`) with heavy drop shadows to create a glowing neon effect.
