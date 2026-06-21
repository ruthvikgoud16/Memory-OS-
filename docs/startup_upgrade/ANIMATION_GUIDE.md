# Animation Guide
**Project**: MemoryOS Startup Upgrade Phase 1.0

Animations are critical to achieving the premium, startup-quality feel of MemoryOS. They must be hardware-accelerated, smooth (60fps), and purposeful.

## 1. Background Animations
- **Floating Blobs**: 2-3 large, highly blurred, low-opacity CSS radial gradients (Emerald and Purple) slowly shifting position in the background layer.
  - *Timing*: 20s-30s infinite linear loop.
- **Particle Background**: A subtle canvas-based particle system linking nodes together, visible primarily on the Submission Demo Page to signify neural networks/distributed memory.

## 2. Structural Transitions
- **Smooth Page Transitions**: Utilizing Framer Motion or CSS transitions to fade in and slide up `Y: 20px -> 0px` when navigating between routes.
  - *Easing*: `cubic-bezier(0.4, 0, 0.2, 1)`
  - *Duration*: 300ms

## 3. Micro-Interactions (Hover Effects)
- **Card Hover Effects**: 
  - Slight upward translation (`translateY(-2px)`).
  - Increase in border opacity.
  - Intensification of drop shadow (`box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.3)`).
- **Button Hover**: Soft glow effect expansion. Text or icon subtle scale (`1.05`).

## 4. Data Visualization Animations
- **Animated Agent Graph**: SVG lines drawing themselves to connect agent nodes when a simulated message is passed via Pub/Sub.
- **Timeline Animations**: New events entering the timeline should smoothly slide down from the top and fade in, pushing older events down seamlessly without abrupt jumping.
- **Metric Counters**: Numbers in the `MetricCard` should rapidly count up from 0 to their actual value on initial load.

## 5. Global Timing Functions
- **Fast**: 150ms (Button hovers, toggles)
- **Standard**: 300ms (Modal opens, page transitions, card expansions)
- **Slow**: 800ms (Complex graph rendering, initial page load staggers)
