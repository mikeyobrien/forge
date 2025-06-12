---
title: 'Brainstorm: Screenshot Tool for Para-SSG Visual Analysis'
category: projects
status: in_progress
created: 2025-06-12T01:28:13.193Z
modified: 2025-06-12T01:28:13.193Z
tags:
  - brainstorm
  - planning
  - para-ssg
  - visual-analysis
  - screenshot
---

# Brainstorm: Screenshot Tool for Para-SSG Visual Analysis

## Created: 2025-06-11

## Problem Statement

[To be filled during brainstorming session]

## Target Audience

[To be filled during brainstorming session]

## Success Criteria

[To be filled during brainstorming session]

## Constraints & Challenges

[To be filled during brainstorming session]

## Existing Solutions & Differentiation

[To be filled during brainstorming session]

## MVP Scope

[To be filled during brainstorming session]

## Resources & Dependencies

[To be filled during brainstorming session]

## Open Questions

[To be filled during brainstorming session]

## Initial Ideas

[To be filled during brainstorming session]

## Next Steps

- [ ] Research screenshot automation tools
- [ ] Define clear project goals
- [ ] Create implementation plan
- [ ] Integrate with existing para-ssg workflow

## References

- para-ssg project (existing static website generator)
- Claude Code visual analysis capabilities

---

_Brainstorming session conducted on 2025-06-11_

# Brainstorm: Screenshot Tool for Para-SSG Visual Analysis

## Created: 2025-06-11

## Problem Statement

Need a way to get Claude's feedback on design and layout decisions for para-ssg generated pages, plus debug layout/styling issues visually. Currently requires manual screenshot process which is tedious and breaks the development flow.

## Target Audience

- Developers using para-ssg who want design feedback
- Content creators who need layout validation
- Anyone debugging CSS/HTML rendering issues in static sites

## Success Criteria

[To be filled during brainstorming session]

## Constraints & Challenges

[To be filled during brainstorming session]

## Existing Solutions & Differentiation

[To be filled during brainstorming session]

## MVP Scope

[To be filled during brainstorming session]

## Resources & Dependencies

[To be filled during brainstorming session]

## Open Questions

[To be filled during brainstorming session]

## Initial Ideas

- Automated screenshot capture integrated into para-ssg build process
- Command-line tool that can screenshot specific pages or entire site
- Integration with Claude Code for immediate visual analysis
- Support for different viewport sizes (mobile, tablet, desktop)

## Next Steps

- [ ] Research screenshot automation tools
- [ ] Define clear project goals
- [ ] Create implementation plan
- [ ] Integrate with existing para-ssg workflow

## References

- para-ssg project (existing static website generator)
- Claude Code visual analysis capabilities

---

_Brainstorming session conducted on 2025-06-11_

# Brainstorm: Screenshot Tool for Para-SSG Visual Analysis

## Created: 2025-06-11

## Problem Statement

Need a way to get Claude's feedback on design and layout decisions for para-ssg generated pages, plus debug layout/styling issues visually. Currently requires manual screenshot process which is tedious and breaks the development flow.

## Target Audience

- Developers using para-ssg who want design feedback
- Content creators who need layout validation
- Anyone debugging CSS/HTML rendering issues in static sites

## Success Criteria

- MCP tool that can be called directly from Claude Code
- Screenshots generated automatically and made available to Claude for analysis
- Seamless integration with existing para-ssg workflow
- Support for different viewport sizes and page types
- Immediate visual feedback without leaving the development environment

## Constraints & Challenges

- Need headless browser capabilities (Puppeteer/Playwright)
- File management for screenshots (temporary vs persistent)
- Integration with MCP protocol
- Performance considerations for large sites
- Cross-platform compatibility

## Existing Solutions & Differentiation

- Generic screenshot tools exist but lack para-ssg integration
- Manual screenshot + Claude analysis is current workflow
- This would be first MCP tool specifically for para-ssg visual analysis
- Automated + contextual (knows about para-ssg structure)

## MVP Scope

- MCP server that can screenshot para-ssg pages
- Support for single page screenshots
- Basic viewport size options (desktop, mobile)
- Returns screenshot path for Claude analysis
- Integration with existing para-ssg output directory

## Resources & Dependencies

- Puppeteer or Playwright for headless browser
- MCP SDK for server implementation
- File system access for screenshot storage
- Local web server capability (for serving static files)

## Open Questions

- Should screenshots be temporary or persistent?
- How to handle pages that require JavaScript?
- What viewport sizes are most important?
- Should it integrate with existing para-ssg CLI or be standalone?
- How to handle authentication/protected pages?

## Initial Ideas

- MCP server with screenshot tool
- Automated screenshot capture integrated into para-ssg build process
- Command-line tool that can screenshot specific pages or entire site
- Integration with Claude Code for immediate visual analysis
- Support for different viewport sizes (mobile, tablet, desktop)

## Next Steps

- [ ] Design MCP tool interface
- [ ] Choose headless browser library
- [ ] Create MCP server implementation
- [ ] Test with existing para-ssg sites
- [ ] Integrate with Claude Code workflow

## References

- para-ssg project (existing static website generator)
- Claude Code visual analysis capabilities
- MCP protocol documentation
- Puppeteer/Playwright documentation

---

_Brainstorming session conducted on 2025-06-11_

# Brainstorm: Screenshot Tool for Para-SSG Visual Analysis

## Created: 2025-06-11

## Problem Statement

Need a way to get Claude's feedback on design and layout decisions for para-ssg generated pages, plus debug layout/styling issues visually. Currently requires manual screenshot process which is tedious and breaks the development flow.

## Target Audience

- Developers using para-ssg who want design feedback
- Content creators who need layout validation
- Anyone debugging CSS/HTML rendering issues in static sites

## Success Criteria

- MCP tool that returns screenshot images directly to Claude Code
- Screenshots are temporary by default, permanent via tool argument
- Seamless integration with existing para-ssg workflow
- Support for different viewport sizes and page types
- Immediate visual feedback without leaving the development environment
- Whatever features make Claude most helpful for website analysis

## Constraints & Challenges

- Need headless browser capabilities (Puppeteer/Playwright)
- MCP image format support (handled by protocol)
- Performance considerations for large sites
- Cross-platform compatibility
- Local server for serving para-ssg output

## Existing Solutions & Differentiation

- Generic screenshot tools exist but lack para-ssg integration
- Manual screenshot + Claude analysis is current workflow
- This would be first MCP tool specifically for para-ssg visual analysis
- Direct image return to Claude (no file management needed)

## MVP Scope

- MCP server that can screenshot URLs
- Returns image directly to Claude Code
- Support for multiple viewport sizes
- Temporary screenshots by default, permanent option
- Basic para-ssg integration (auto-detect output directory)

## Resources & Dependencies

- Puppeteer or Playwright for headless browser
- MCP SDK for server implementation
- Local web server capability (serve para-ssg output)
- Image processing for format optimization

## Open Questions

- What viewport sizes are most useful for Claude analysis?
- Should it auto-start local server for para-ssg output?
- What metadata should accompany screenshots (viewport, URL, timestamp)?
- Should it support element-specific screenshots (CSS selectors)?
- Multiple format support (PNG, JPEG, WebP)?

## Initial Ideas - Features for Claude Website Analysis

- **Multiple viewport captures**: Desktop, tablet, mobile in single call
- **Element highlighting**: Screenshot with specific elements outlined
- **Annotation overlay**: Add labels/callouts to problematic areas
- **Comparison mode**: Before/after screenshots for changes
- **Page metrics**: Include load times, element counts, etc.
- **CSS debugging**: Highlight layout issues (overflow, positioning)
- **Accessibility overlay**: Show ARIA landmarks, heading hierarchy
- **Performance heatmap**: Visual indicators of slow-loading elements

## Next Steps

- [ ] Design MCP tool interface with image return
- [ ] Choose headless browser library
- [ ] Implement basic screenshot capture
- [ ] Add viewport size options
- [ ] Test direct image return to Claude
- [ ] Add para-ssg auto-discovery

## References

- para-ssg project (existing static website generator)
- Claude Code visual analysis capabilities
- MCP protocol documentation (image support)
- Puppeteer/Playwright documentation

---

_Brainstorming session conducted on 2025-06-11_

# Brainstorm: Screenshot Tool for Para-SSG Visual Analysis

## Created: 2025-06-11

## Problem Statement

Need a way to get Claude's feedback on design and layout decisions for para-ssg generated pages, plus debug layout/styling issues visually. Currently requires manual screenshot process which is tedious and breaks the development flow.

## Target Audience

- Developers using para-ssg who want design feedback
- Content creators who need layout validation
- Anyone debugging CSS/HTML rendering issues in static sites

## Success Criteria

- MCP tool that returns screenshot images directly to Claude Code
- Screenshots are temporary by default, permanent via tool argument
- Seamless integration with existing para-ssg workflow
- Support for different viewport sizes and page types
- Immediate visual feedback without leaving the development environment
- Optimized for layout debugging and design feedback

## Constraints & Challenges

- Need headless browser capabilities (Puppeteer/Playwright)
- MCP image format support (handled by protocol)
- Performance considerations for large sites
- Cross-platform compatibility
- Local server for serving para-ssg output

## Existing Solutions & Differentiation

- Generic screenshot tools exist but lack para-ssg integration
- Manual screenshot + Claude analysis is current workflow
- This would be first MCP tool specifically for para-ssg visual analysis
- Direct image return to Claude (no file management needed)
- Focused on layout debugging and design feedback

## MVP Scope - Layout Debugging & Design Feedback Focus

- MCP server that can screenshot URLs with layout debugging features
- Returns image directly to Claude Code
- Desktop and mobile viewport options
- CSS layout debugging overlays (grid lines, flexbox containers)
- Element highlighting via CSS selectors
- Console error capture alongside screenshots

## Resources & Dependencies

- Puppeteer or Playwright for headless browser
- MCP SDK for server implementation
- Local web server capability (serve para-ssg output)
- CSS injection for debugging overlays

## Open Questions

- Should it auto-inject CSS debugging helpers (grid overlays, spacing indicators)?
- How to best capture CSS console errors with screenshots?
- What's the optimal screenshot resolution for Claude analysis?
- Should it support annotating specific problem areas?

## Priority Features for Layout Debugging & Design Feedback

1. **Multi-viewport capture**: Desktop + mobile in single call
2. **CSS debugging overlays**:
   - Grid/flexbox container outlines
   - Spacing/margin visualization
   - Overflow indicators
3. **Element targeting**: Screenshot with specific elements highlighted
4. **Console error capture**: CSS/JS errors alongside visual
5. **Full page vs viewport**: Catch layout issues below fold
6. **Layout metrics**: Element dimensions, spacing values overlaid

## Next Steps

- [ ] Design MCP tool interface focused on debugging/feedback
- [ ] Implement basic screenshot with viewport options
- [ ] Add CSS debugging overlay injection
- [ ] Test element highlighting capabilities
- [ ] Create para-ssg integration for auto-serving pages

## References

- para-ssg project (existing static website generator)
- Claude Code visual analysis capabilities
- MCP protocol documentation (image support)
- Puppeteer/Playwright documentation
- CSS debugging techniques

---

_Brainstorming session conducted on 2025-06-11_

# Brainstorm: Screenshot Tool for Para-SSG Visual Analysis

## Created: 2025-06-11

## Problem Statement

Need a way to get Claude's feedback on design and layout decisions for para-ssg generated pages, plus debug layout/styling issues visually. Currently requires manual screenshot process which is tedious and breaks the development flow.

## Target Audience

- Developers using para-ssg who want design feedback
- Content creators who need layout validation
- Anyone debugging CSS/HTML rendering issues in static sites

## Success Criteria

- MCP tool that returns screenshot images directly to Claude Code
- Screenshots are temporary by default, permanent via tool argument
- Seamless integration with existing para-ssg workflow
- Support for different viewport sizes and page types
- Immediate visual feedback without leaving the development environment
- Optimized for layout debugging and design feedback

## Constraints & Challenges

- Need headless browser capabilities (Puppeteer/Playwright)
- MCP image format support (handled by protocol)
- Performance considerations for large sites
- Cross-platform compatibility
- Local server for serving para-ssg output

## Existing Solutions & Differentiation

- Generic screenshot tools exist but lack para-ssg integration
- Manual screenshot + Claude analysis is current workflow
- This would be first MCP tool specifically for para-ssg visual analysis
- Direct image return to Claude (no file management needed)
- Focused on layout debugging and design feedback

## HIGH VALUE / LOW EFFORT - MVP Priority Order

### Phase 1: Core Screenshot Capability (Minimum Viable)

1. **Basic URL screenshot**: Single viewport, direct image return to Claude
2. **Auto-serve para-ssg**: Automatically start local server for built site
3. **Desktop + mobile combo**: Two screenshots in one tool call

### Phase 2: Essential Debugging (High Value Add-ons)

4. **Full page screenshots**: Catch layout issues below fold
5. **Console error capture**: Text output of CSS/JS errors with screenshot
6. **Element highlighting**: Target specific CSS selectors for focused feedback

### Phase 3: Advanced Features (Nice to Have)

7. **CSS debugging overlays**: Grid/flexbox visualization
8. **Multiple page batch**: Screenshot homepage, blog post, etc. at once
9. **Comparison mode**: Before/after screenshots

## MVP Scope - Phase 1 Focus

- MCP server with single screenshot tool
- Takes URL parameter (defaults to localhost:3000 or para-ssg output)
- Returns desktop (1200px) + mobile (375px) screenshots
- Auto-detects and serves para-ssg output directory
- Temporary screenshots by default, permanent option

## Resources & Dependencies

- Puppeteer (lighter than Playwright for MVP)
- MCP SDK for server implementation
- Express/built-in http server for serving static files
- Minimal dependencies approach

## Implementation Strategy

1. **Start simple**: Hard-coded viewports, basic screenshot
2. **Test early**: Get working with Claude Code ASAP
3. **Iterate based on usage**: Add features after seeing what's most needed

## Next Steps - Phase 1 Only

- [ ] Create basic MCP server structure
- [ ] Implement Puppeteer screenshot capture
- [ ] Add dual viewport (desktop + mobile) capture
- [ ] Test integration with Claude Code
- [ ] Add auto-serve para-ssg output capability

## References

- para-ssg project (existing static website generator)
- Claude Code visual analysis capabilities
- MCP protocol documentation (image support)
- Puppeteer documentation

---

_Brainstorming session conducted on 2025-06-11_
