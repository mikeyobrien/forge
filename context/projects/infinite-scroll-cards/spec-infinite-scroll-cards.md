---
title: Infinite Scroll Cards Specification
category: projects
status: active
created: 2025-06-14T14:47:48.677Z
modified: 2025-06-14T14:47:48.677Z
tags:
  - ui
  - performance
  - static-site
  - javascript
  - cards
---

# Infinite Scroll Cards Specification

## Executive Summary

### Problem Statement

The current home page and category pages load all document cards at once, creating potential performance issues as the content scales. With ~73 documents currently and anticipated growth to several hundred, the initial page load includes unnecessary DOM elements and content that users may never scroll to see.

### Proposed Solution

Implement a client-side infinite scroll system that initially renders 20 cards and progressively loads 15 more as users scroll, with all card data embedded in the HTML for SEO preservation and zero infrastructure requirements.

### Key Benefits

- **Improved Initial Load**: Faster time-to-interactive by rendering only visible content
- **Better Performance**: Reduced initial DOM size and memory usage
- **Scalability**: Supports growth up to ~500-1000 documents comfortably
- **SEO Friendly**: All content remains in HTML for search engines
- **Zero Infrastructure**: Works with existing static hosting

## Requirements

### Functional Requirements

#### Initial Load Behavior

1. Display first 20 cards on page load
2. Hide remaining cards using CSS (not removal from DOM)
3. Show cards in current sort order (newest first by modification date)
4. Maintain existing card design and hover effects

#### Scroll Trigger Mechanism

1. Load 15 additional cards when user scrolls within 250px of bottom
2. Implement smooth reveal animation (fade-in with stagger effect)
3. Continue loading until all cards are visible
4. Show "End of content" message when complete

#### Load More Button Fallback

1. Display "Load More" button below visible cards
2. Button loads next 15 cards on click
3. Hide button when all cards are shown
4. Style consistently with existing design

#### Page Scope

1. Apply to home page (all documents)
2. Apply to category pages (Projects, Areas, Resources, Archives)
3. Apply to subdirectory index pages with 20+ items
4. Show all cards immediately on pages with <20 items

### Non-Functional Requirements

#### Performance

1. Initial render must complete in <100ms after HTML parse
2. Subsequent card reveals must complete in <50ms
3. No layout shift during card loading
4. Smooth scrolling performance (60fps)

#### Compatibility

1. Work without JavaScript (show all cards as fallback)
2. Support modern browsers (Chrome, Firefox, Safari, Edge latest 2 versions)
3. Maintain mobile responsiveness
4. Preserve accessibility (keyboard navigation, screen readers)

#### SEO & Accessibility

1. All card content must remain in HTML source
2. Use semantic HTML structure
3. Maintain proper heading hierarchy
4. Include ARIA labels for load state

### Acceptance Criteria

1. **Initial Load**: Only 20 cards visible on page load
2. **Scroll Loading**: New cards load before user reaches bottom
3. **Smooth Animation**: Cards fade in without jarring appearance
4. **Fallback Works**: "Load More" button functions when clicked
5. **Performance**: No noticeable lag during scroll or load
6. **Graceful Degradation**: All cards visible when JavaScript disabled
7. **End State**: Clear indication when all content is loaded

## Technical Considerations

### Architecture Overview

```
HTML Structure:
- All cards rendered in HTML (SEO preserved)
- Cards marked with data attributes for JS management
- Hidden cards use CSS class for invisibility

JavaScript Controller:
- IntersectionObserver for scroll detection
- Card visibility manager
- Animation coordinator
- Load more button handler

CSS:
- .hidden-card class for initial hiding
- Fade-in animation classes
- Loading spinner styles
```

### Implementation Approach

1. **HTML Generation** (Rust side):

   - Add data-card-index attribute to each card
   - Add .hidden-card class to cards beyond position 20
   - Include total count in data attribute

2. **JavaScript Module**:

   ```javascript
   - Initialize on DOMContentLoaded
   - Set up IntersectionObserver on sentinel element
   - Track current visible count
   - Reveal cards in batches
   - Handle "Load More" clicks
   - Show end message when complete
   ```

3. **CSS Enhancements**:
   ```css
   .hidden-card {
     display: none;
   }
   .card-revealing {
     animation: fadeIn 0.3s ease-out;
   }
   .loading-spinner {
     /* spinner styles */
   }
   ```

### Technology Choices

- **Vanilla JavaScript**: No framework needed, keeps it simple
- **IntersectionObserver API**: Modern, performant scroll detection
- **CSS Animations**: Hardware accelerated transitions
- **Progressive Enhancement**: Works without JS

### Integration Points

1. Modify Rust HTML generation in `theme/templates.rs`
2. Add JavaScript to existing script tag in template
3. Extend existing CSS with new classes
4. No changes needed to build process

## Constraints & Risks

### Known Limitations

1. **Scale Limit**: Optimal for up to ~1000 documents
2. **Initial HTML Size**: All content still in initial download
3. **Memory Usage**: Hidden cards still consume some memory
4. **Search**: Ctrl+K search should still find hidden cards

### Potential Challenges

1. **Browser Differences**: Safari may handle large hidden DOM differently
2. **Animation Performance**: Too many simultaneous animations could stutter
3. **Scroll Position**: Browser back button should restore position

### Mitigation Strategies

1. **Test across browsers** during implementation
2. **Stagger animations** to prevent overwhelming GPU
3. **Use requestAnimationFrame** for smooth reveals
4. **Save scroll position** in sessionStorage

## Success Metrics

### Performance Targets

- Initial page load: <2s on 3G connection
- Time to interactive: <1s on broadband
- Scroll trigger response: <100ms
- Animation smoothness: 60fps

### Quality Indicators

- Zero JavaScript errors in console
- No layout shift (CLS score = 0)
- Accessibility score remains >95
- SEO evaluation shows all content indexed

### User Experience Metrics

- Reduced bounce rate on home page
- Increased scroll depth
- Positive feedback on performance
- No user reports of missing content

## Implementation Notes

### File Modifications Required

1. **`src/theme/templates.rs`**:

   - Add data attributes to card HTML
   - Add hidden class conditionally
   - Include card count metadata

2. **`src/theme/styles.rs`**:

   - Add CSS for hidden cards
   - Add animation classes
   - Style loading spinner and end message

3. **JavaScript Addition**:
   - Create infinite scroll controller
   - Add to existing script section
   - Approximately 100-150 lines of code

### Testing Approach

1. Test with current ~73 documents
2. Generate test set with 200+ documents
3. Verify performance metrics
4. Test JavaScript disabled scenario
5. Cross-browser testing
6. Mobile device testing

### Rollback Plan

If issues arise, simply remove:

- JavaScript infinite scroll code
- CSS hidden classes from cards
- Data attributes from HTML

This returns to current "show all" behavior immediately.
