---
title: 'CSS Grid Layout Guide'
tags: ['css', 'web-development', 'layout', 'frontend']
author: 'Frontend Team'
date: '2025-01-14'
status: 'published'
description: 'Comprehensive guide to CSS Grid for modern web layouts'
---

# CSS Grid Layout Guide

CSS Grid is a powerful layout system that provides precise control over both rows and columns, making it ideal for creating complex, responsive web layouts.

## Introduction to CSS Grid

CSS Grid Layout is a two-dimensional layout method that allows you to control both rows and columns simultaneously, unlike Flexbox which is primarily one-dimensional.

### When to Use Grid

- **Complex layouts** with multiple rows and columns
- **Precise positioning** of elements
- **Responsive designs** that adapt to different screen sizes
- **Overlapping content** requirements
- **Magazine-style** or dashboard layouts

## Basic Concepts

### Grid Container and Items

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 100px 200px 100px;
  gap: 10px;
}

.grid-item {
  background-color: #f0f0f0;
  padding: 20px;
  text-align: center;
}
```

### Grid Terminology

- **Grid Container** - The element with `display: grid`
- **Grid Items** - Direct children of the grid container
- **Grid Lines** - Dividing lines that make up the structure
- **Grid Tracks** - Space between two adjacent grid lines
- **Grid Cells** - Single unit of the grid
- **Grid Areas** - Rectangular areas spanning multiple cells

## Defining Grid Structure

### Explicit Grid

Define specific columns and rows:

```css
.grid {
  display: grid;
  grid-template-columns: 200px 1fr 100px;
  grid-template-rows: auto 1fr auto;
}
```

### Fractional Units (fr)

The `fr` unit represents a fraction of available space:

```css
.grid {
  grid-template-columns: 1fr 2fr 1fr; /* 25% 50% 25% */
}
```

### Repeat Function

Simplify repetitive definitions:

```css
.grid {
  grid-template-columns: repeat(3, 1fr); /* Same as 1fr 1fr 1fr */
  grid-template-rows: repeat(2, minmax(100px, auto));
}
```

## Positioning Grid Items

### Line-Based Placement

```css
.item {
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 2;
  grid-row-end: 4;
}

/* Shorthand */
.item {
  grid-column: 1 / 3;
  grid-row: 2 / 4;
}
```

### Named Grid Lines

```css
.grid {
  grid-template-columns: [sidebar-start] 250px [sidebar-end main-start] 1fr [main-end];
}

.sidebar {
  grid-column: sidebar-start / sidebar-end;
}
```

### Grid Areas

```css
.grid {
  grid-template-areas:
    'header header header'
    'sidebar main main'
    'footer footer footer';
}

.header {
  grid-area: header;
}
.sidebar {
  grid-area: sidebar;
}
.main {
  grid-area: main;
}
.footer {
  grid-area: footer;
}
```

## Responsive Grid Layouts

### Auto-Fit and Auto-Fill

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
```

### Media Queries

```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 2fr;
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: 1fr 2fr 1fr;
  }
}
```

## Advanced Grid Features

### Implicit Grid

Handle content that doesn't fit in the explicit grid:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto);
  grid-auto-flow: row dense;
}
```

### Alignment and Justification

```css
.grid {
  /* Align items within their cells */
  align-items: center; /* start | end | center | stretch */
  justify-items: center; /* start | end | center | stretch */

  /* Align the grid within the container */
  align-content: center; /* start | end | center | stretch | space-around | space-between | space-evenly */
  justify-content: center; /* start | end | center | stretch | space-around | space-between | space-evenly */
}
```

### Subgrid (Future)

```css
.grid-item {
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}
```

## Common Layout Patterns

### Holy Grail Layout

```css
.holy-grail {
  display: grid;
  grid-template:
    'header header header' auto
    'nav main aside' 1fr
    'footer footer footer' auto
    / 150px 1fr 150px;
  min-height: 100vh;
}
```

### Card Grid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}
```

### Masonry-Style Layout

```css
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: 10px;
}

.masonry-item {
  grid-row-end: span var(--row-span);
}
```

## Browser Support and Fallbacks

### Feature Detection

```css
@supports (display: grid) {
  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@supports not (display: grid) {
  .grid-container {
    display: flex;
    flex-wrap: wrap;
  }

  .grid-item {
    flex: 1 1 300px;
  }
}
```

## Performance Considerations

### Best Practices

1. **Minimize reflows** - Avoid changing grid definitions frequently
2. **Use transform** for animations instead of changing grid properties
3. **Consider paint cost** - Complex grids can be expensive to render
4. **Test on devices** - Ensure performance on lower-end hardware

## Tools and Resources

### Development Tools

- **Firefox Grid Inspector** - Visual grid debugging
- **Chrome DevTools** - Grid overlay and inspection
- **CSS Grid Generator** - Online tool for quick layouts
- **Grid by Example** - Comprehensive examples and patterns

### Related Resources

- [[Flexbox Guide]] - When to use Flexbox vs Grid
- [[Responsive Design Patterns]] - Grid-based responsive layouts
- [[CSS Custom Properties]] - Dynamic grid configurations
- [[Web Performance]] - Optimizing grid layouts

## Integration with Projects

CSS Grid is being used in:

- [[Website Redesign Project]] - Main layout system
- [[Mobile App Development]] - Web views and responsive components
- [[Design System Guidelines]] - Layout component library

## Example Implementations

### Dashboard Layout

```css
.dashboard {
  display: grid;
  grid-template:
    'sidebar header header' 60px
    'sidebar main aside' 1fr
    'sidebar footer footer' 40px
    / 200px 1fr 250px;
  height: 100vh;
}
```

### Article Layout

```css
.article {
  display: grid;
  grid-template-columns: 1fr min(65ch, 100%) 1fr;
  grid-column-gap: 2rem;
}

.article > * {
  grid-column: 2;
}

.article > .full-width {
  grid-column: 1 / -1;
}
```

---

_This resource demonstrates technical reference material with practical examples and connections to active projects._
