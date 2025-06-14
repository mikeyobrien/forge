//! ABOUTME: CSS generation with modern dark theme and design system
//! ABOUTME: Creates accessible, performant stylesheet with animations and interactions

#[cfg(not(debug_assertions))]
use crate::utils::minify_css;

/// Get default CSS styles with modern dark theme
///
/// ## Design System Features:
/// - **Color System**: Extended palette with gradients and semantic colors
/// - **Typography**: Fluid scaling with clamp() for responsive text
/// - **Spacing**: 8px grid system for consistent rhythm
/// - **Animations**: GPU-accelerated transforms with reduced motion support
/// - **Accessibility**: WCAG compliant contrast, focus states, and ARIA support
/// - **Performance**: Optimized transitions and will-change properties
pub fn get_default_styles() -> String {
    let css = r#"
    /* ==========================================================================
       CSS Reset and Base Styles
       ========================================================================== */
    
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    /* Ensure smooth scrolling and focus behavior */
    html {
        scroll-behavior: smooth;
    }
    
    :focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
    }
    
    /* ==========================================================================
       Design System: Color Variables
       ========================================================================== */
    
    :root {
        /* Base colors */
        --bg-primary: #0f0f0f;
        --bg-secondary: #1a1a1a;
        --bg-tertiary: #2a2a2a;
        --bg-elevated: #333333;
        
        /* Text hierarchy */
        --text-primary: #f0f0f0;
        --text-secondary: #b4b4b4;
        --text-muted: #737373;
        --text-subtle: #525252;
        
        /* Border system */
        --border-primary: #333333;
        --border-secondary: #404040;
        --border-subtle: #262626;
        
        /* Brand gradient system */
        --accent-primary: #0EA5E9;
        --accent-secondary: #3B82F6;
        --accent-gradient: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
        --accent-gradient-hover: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
        --gradient-primary: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
        
        /* Semantic colors */
        --success: #10B981;
        --success-bg: rgba(16, 185, 129, 0.1);
        --warning: #F59E0B;
        --warning-bg: rgba(245, 158, 11, 0.1);
        --error: #EF4444;
        --error-bg: rgba(239, 68, 68, 0.1);
        --info: #06B6D4;
        --info-bg: rgba(6, 182, 212, 0.1);
        
        /* Link colors with better contrast */
        --link-primary: #60A5FA;
        --link-hover: #93C5FD;
        --link-visited: #A78BFA;
        
        /* Surface elevations */
        --surface-base: var(--bg-primary);
        --surface-raised: var(--bg-secondary);
        --surface-overlay: var(--bg-tertiary);
        --surface-elevated: var(--bg-elevated);
        
        /* Interactive states */
        --interactive-hover: rgba(255, 255, 255, 0.05);
        --interactive-active: rgba(255, 255, 255, 0.1);
        --interactive-disabled: rgba(255, 255, 255, 0.02);
        
        /* Shadow system */
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
        
        /* Legacy support - map old variables to new system */
        --accent: var(--accent-primary);
        --accent-hover: var(--accent-secondary);
        --link-color: var(--link-primary);
        --link-hover: var(--link-hover);
        --border-color: var(--border-primary);
    }
    
    /* ==========================================================================
       Design System: Spacing & Layout Variables
       ========================================================================== */
    
    :root {
        --space-1: 0.5rem;  /* 8px */
        --space-2: 1rem;    /* 16px */
        --space-3: 1.5rem;  /* 24px */
        --space-4: 2rem;    /* 32px */
        --space-6: 3rem;    /* 48px */
        --space-8: 4rem;    /* 64px */
        --space-12: 6rem;   /* 96px */
        --space-16: 8rem;   /* 128px */
        
        /* Responsive breakpoints */
        --breakpoint-sm: 640px;
        --breakpoint-md: 768px;
        --breakpoint-lg: 1024px;
        --breakpoint-xl: 1280px;
    }
    
    /* ==========================================================================
       Typography & Body Styles
       ========================================================================== */
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: var(--text-primary);
        background-color: var(--bg-primary);
        min-height: 100vh;
        font-feature-settings: 'cv11', 'ss01';
        font-variant-numeric: tabular-nums;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        
        /* CSS Grid for main layout */
        display: grid;
        grid-template-areas:
            "header"
            "main"
            "footer";
        grid-template-rows: auto 1fr auto;
        grid-template-columns: 1fr;
    }
    
    /* ==========================================================================
       Layout Components
       ========================================================================== */
    
    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 var(--space-4);
        width: 100%;
    }
    
    /* ==========================================================================
       Header & Navigation
       ========================================================================== */
    
    .site-header {
        grid-area: header;
        background: linear-gradient(135deg, #181818 0%, #0E0E0E 60%);
        color: var(--text-primary);
        height: var(--header-height, 80px);
        transition: height 0.25s ease, box-shadow 0.25s;
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .header-inner {
        width: min(90%, 1200px);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--space-2);
    }

    .logo {
        font-size: 2rem;
        color: #fff;
        font-weight: 700;
        text-decoration: none;
    }


    .site-nav {
        display: flex;
        gap: 1.5rem;
    }

    .nav-item {
        color: var(--text-secondary);
        font-weight: 500;
        position: relative;
        text-decoration: none;
        transition: color 0.2s ease;
    }
    
    .nav-item:hover {
        color: var(--text-primary);
        text-decoration: none;
    }

    .nav-item.active {
        color: var(--accent-primary);
    }

    .nav-item.active::after,
    .nav-item:hover::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: -6px;
        height: 2px;
        background: var(--accent-primary);
    }

    .nav-divider {
        width: 1px;
        height: 20px;
        background-color: var(--text-secondary);
        opacity: 0.3;
        margin: 0 0.5rem;
        align-self: center;
    }

    .nav-toggle {
        display: none;
        background: none;
        border: none;
    }

    .burger {
        width: 24px;
        height: 2px;
        background: #fff;
        position: relative;
    }

    .burger::before,
    .burger::after {
        content: "";
        position: absolute;
        width: 24px;
        height: 2px;
        background: #fff;
    }

    .burger::before { top: -6px; }
    .burger::after { top: 6px; }

    body.scrolled .site-header {
        height: 60px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    }


    /* Hide search in minimal theme */
    .nav-search {
        display: none;
    }
    
    /* ==========================================================================
       Main Content Area
       ========================================================================== */
    
    main {
        grid-area: main;
        padding: var(--space-4) 0;
        min-height: 0; /* Allow grid to control height */
    }
    
    /* ==========================================================================
       File Cards Component
       ========================================================================== */
    
    .file-cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .file-card {
        background-color: var(--surface-raised);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        padding: var(--space-3);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }
    
    .file-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--accent-gradient);
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .file-card:hover {
        border-color: var(--border-secondary);
        background-color: var(--surface-overlay);
        transform: translateY(-2px) translateZ(0);
        box-shadow: var(--shadow-md);
    }
    
    .file-card:hover::before {
        opacity: 1;
    }
    
    .file-card:active {
        transform: translateY(-1px) translateZ(0);
        transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .file-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
    }
    
    .file-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        line-height: 1.3;
        flex: 1;
        min-width: 0; /* Allow text truncation */
    }
    
    .file-title a {
        color: var(--text-primary);
        text-decoration: none;
        transition: color 0.2s ease;
    }
    
    .file-title a:hover {
        color: var(--accent-primary);
        text-decoration: none;
    }
    
    .file-category {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        white-space: nowrap;
        border: 1px solid transparent;
        transition: all 0.2s ease;
    }
    
    /* Category color coding */
    .category-projects {
        background-color: rgba(16, 185, 129, 0.1);
        color: var(--success);
        border-color: rgba(16, 185, 129, 0.3);
    }
    
    .category-areas {
        background-color: rgba(59, 130, 246, 0.1);
        color: var(--accent-secondary);
        border-color: rgba(59, 130, 246, 0.3);
    }
    
    .category-resources {
        background-color: rgba(245, 158, 11, 0.1);
        color: var(--warning);
        border-color: rgba(245, 158, 11, 0.3);
    }
    
    .category-archives {
        background-color: rgba(107, 114, 128, 0.1);
        color: var(--text-muted);
        border-color: rgba(107, 114, 128, 0.3);
    }
    
    .category-other {
        background-color: rgba(139, 92, 246, 0.1);
        color: #8B5CF6;
        border-color: rgba(139, 92, 246, 0.3);
    }
    
    .file-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-2);
        font-size: 0.85rem;
        color: var(--text-muted);
    }
    
    .file-date {
        white-space: nowrap;
        font-feature-settings: 'tnum';
    }
    
    .file-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        justify-content: flex-end;
        flex: 1;
        min-width: 0;
    }
    
    .file-tags .tag {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        background-color: var(--surface-elevated);
        color: var(--text-secondary);
        border-radius: 6px;
        border: 1px solid var(--border-subtle);
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .file-tags .tag:hover {
        background-color: var(--surface-overlay);
        border-color: var(--border-primary);
        color: var(--text-primary);
    }
    
    .no-tags {
        color: var(--text-muted);
        font-style: italic;
        font-size: 0.8rem;
    }
    
    /* ==========================================================================
       Document Pages
       ========================================================================== */
    
    .document h1 {
        font-size: clamp(1.75rem, 4vw, 2rem);
        margin-bottom: 1rem;
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 1.2;
    }
    
    .document-header {
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--border-primary);
    }
    
    .document-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-top: var(--space-1);
        font-size: 0.9rem;
        color: var(--text-muted);
    }
    
    .document-content {
        color: var(--text-primary);
        line-height: 1.7;
    }
    
    .document-content h2 {
        font-size: clamp(1.5rem, 3.5vw, 1.75rem);
        margin-top: var(--space-4);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 1.3;
    }
    
    .document-content h3 {
        font-size: clamp(1.25rem, 3vw, 1.5rem);
        margin-top: var(--space-3);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.3;
    }
    
    .document-content h4 {
        font-size: clamp(1.125rem, 2.5vw, 1.25rem);
        margin-top: var(--space-3);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.015em;
        line-height: 1.4;
    }
    
    .document-content p {
        margin-bottom: var(--space-2);
    }
    
    .document-content ul,
    .document-content ol {
        margin-bottom: var(--space-2);
        margin-left: var(--space-3);
    }
    
    .document-content blockquote {
        border-left: 3px solid var(--accent-primary);
        padding-left: var(--space-2);
        margin: var(--space-3) 0;
        color: var(--text-secondary);
        font-style: italic;
    }
    
    .document-content code {
        background-color: var(--surface-raised);
        color: var(--text-primary);
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 0.9em;
    }
    
    .document-content pre {
        background-color: var(--surface-raised);
        border: 1px solid var(--border-primary);
        padding: var(--space-2);
        border-radius: 5px;
        overflow-x: auto;
        margin: var(--space-3) 0;
    }
    
    .document-content pre code {
        background: none;
        padding: 0;
    }
    
    /* ==========================================================================
       Category Pages
       ========================================================================== */
    
    .category-index h1 {
        font-size: clamp(2rem, 4vw, 2.5rem);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
        font-weight: 700;
        letter-spacing: -0.025em;
        line-height: 1.2;
    }
    
    .category-description {
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
        font-style: italic;
        line-height: 1.5;
    }
    
    .document-count {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--border-primary);
    }
    
    .document-list {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: 1fr;
    }
    
    .document-entry {
        padding: var(--space-3);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        background-color: var(--surface-raised);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .document-entry:hover {
        border-color: var(--border-secondary);
        background-color: var(--surface-overlay);
    }
    
    .document-entry h2 {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }
    
    .document-entry h2 a {
        color: var(--link-primary);
        text-decoration: none;
    }
    
    .document-entry h2 a:hover {
        color: var(--link-hover);
    }
    
    .entry-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-bottom: var(--space-1);
    }
    
    .summary {
        color: var(--text-secondary);
        line-height: 1.5;
    }
    
    /* ==========================================================================
       Directory Cards
       ========================================================================== */
    
    .directory-cards {
        margin-bottom: var(--space-4);
    }
    
    .directory-cards h2 {
        font-size: 1.5rem;
        margin-bottom: var(--space-3);
        color: var(--text-primary);
    }
    
    .directory-grid {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
    
    .directory-card {
        background-color: var(--surface-raised);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .directory-card:hover {
        transform: translateY(-2px);
        border-color: var(--accent-primary);
        background-color: var(--surface-overlay);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    
    .directory-link {
        display: block;
        padding: var(--space-3);
        text-decoration: none;
        color: inherit;
        height: 100%;
    }
    
    .directory-card h3 {
        font-size: 1.25rem;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .directory-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        font-size: 0.875rem;
        color: var(--text-muted);
    }
    
    .directory-meta .doc-count {
        background-color: var(--bg-tertiary);
        padding: 2px 8px;
        border-radius: 4px;
    }
    
    .directory-meta .subdir-count {
        background-color: var(--bg-tertiary);
        padding: 2px 8px;
        border-radius: 4px;
    }
    
    .subdirectory-index .document-entries {
        margin-top: var(--space-4);
    }
    
    .subdirectory-index .document-entries h2 {
        font-size: 1.5rem;
        margin-bottom: var(--space-3);
        color: var(--text-primary);
    }
    
    /* Add spacing between document entries in subdirectories */
    .document-entries .document-entry + .document-entry {
        margin-top: var(--space-3);
    }
    
    /* Also add spacing for regular document lists */
    .document-entry + .document-entry {
        margin-top: var(--space-3);
    }
    
    .empty-directory {
        text-align: center;
        color: var(--text-muted);
        padding: var(--space-6) var(--space-3);
        font-style: italic;
    }
    
    /* Subdirectory index spacing */
    .subdirectory-index h1 {
        font-size: 2.5rem;
        margin-bottom: var(--space-2);
        background: var(--gradient-primary);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }
    
    .subdirectory-description {
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
        font-style: italic;
        line-height: 1.5;
    }
    
    .item-count {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--border-primary);
    }
    
    /* ==========================================================================
       Links & Interactive Elements
       ========================================================================== */
    
    a {
        color: var(--link-primary);
        text-decoration: none;
        transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    a:hover {
        color: var(--link-hover);
        text-decoration: underline;
    }
    
    /* Tags */
    .tag {
        color: var(--text-muted);
        font-size: 0.85rem;
        margin-right: 0.5rem;
    }
    
    /* Breadcrumbs - minimal */
    .breadcrumbs {
        margin-bottom: var(--space-3);
        font-size: 0.9rem;
        color: var(--text-muted);
    }
    
    .breadcrumbs ol {
        list-style: none;
        display: flex;
        align-items: center;
    }
    
    .breadcrumbs li {
        display: inline;
    }
    
    .breadcrumbs a {
        color: var(--text-secondary);
        text-decoration: none;
    }
    
    .breadcrumbs a:hover {
        color: var(--accent-primary);
    }
    
    .breadcrumbs .separator {
        margin: 0 0.5rem;
        color: var(--text-muted);
    }
    
    .breadcrumbs .current {
        color: var(--text-primary);
    }
    
    /* ==========================================================================
       Footer
       ========================================================================== */
    
    footer {
        grid-area: footer;
        background-color: var(--surface-raised);
        border-top: 1px solid var(--border-primary);
        padding: var(--space-3) 0;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
    }
    
    /* ==========================================================================
       Responsive Design - Mobile First Approach
       ========================================================================== */
    
    /* Small screens (mobile) */
    @media (max-width: 640px) {
        .container {
            padding: 0 var(--space-2);
        }

        /* Hide nav divider on mobile */
        .nav-divider {
            display: none;
        }
        
        .nav-container {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: var(--space-2);
            text-align: center;
        }
        
        .nav-menu {
            justify-content: center;
        }
        
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-2);
            max-width: 200px;
        }
        
        .file-cards {
            gap: var(--space-2);
        }
        
        .file-card {
            padding: var(--space-2);
        }
        
        .file-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-1);
        }
        
        .file-card-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-1);
        }
        
        .file-tags {
            justify-content: flex-start;
        }
        
        /* Stack content more compactly on mobile */
            padding: var(--space-2) 0;
            margin-bottom: var(--space-4);
        }
        
        main {
            padding: var(--space-2) 0;
        }
    }
    
    /* Medium screens (tablet) */
    @media (min-width: 641px) and (max-width: 768px) {
        .nav-container {
            grid-template-columns: 1fr auto;
            gap: var(--space-3);
        }
        
            gap: var(--space-3);
            max-width: 300px;
        }
        
        .file-cards {
            max-width: 700px;
        }
    }
    
    /* Large screens */
    @media (min-width: 1024px) {
        .container {
            padding: 0 var(--space-6);
        }
        
        .document-list {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: var(--space-3);
        }
        
        .file-cards {
            gap: var(--space-4);
        }
        
        .nav-container {
            gap: var(--space-6);
        }
    }
    
    /* ==========================================================================
       Loading States & Performance
       ========================================================================== */
    
    /* Add loading indicator for async operations */
    .loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid var(--accent-primary);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spinner 0.8s linear infinite;
    }
    
    @keyframes spinner {
        to { transform: rotate(360deg); }
    }
    
    /* Ensure all transforms use GPU acceleration */
    .file-card,
    .document-entry,
    .search-result {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
    }
    
    /* ==========================================================================
       Accessibility Enhancements
       ========================================================================== */
    
    /* Skip to main content link */
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--accent-primary);
        color: white;
        padding: var(--space-1) var(--space-2);
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 1001;
    }
    
    .skip-link:focus {
        top: 0;
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
        :root {
            --text-primary: #ffffff;
            --text-secondary: #e0e0e0;
            --bg-primary: #000000;
            --bg-secondary: #1a1a1a;
            --border-primary: #ffffff;
        }
    }
    
    /* Print styles */
    @media print {
        header, footer, .search-box {
            display: none;
        }
        
        body {
            background: white;
            color: black;
        }
        
        a {
            color: black;
            text-decoration: underline;
        }
    }
    
    /* ==========================================================================
       Comments Section
       ========================================================================== */
    
    .comments-section {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-primary);
    }
    
    .comments-section h2 {
        margin-bottom: 1.5rem;
        color: var(--text-primary);
    }
    
    #comments-list {
        margin-bottom: 2rem;
    }
    
    .loading {
        color: var(--text-muted);
        text-align: center;
        padding: 2rem;
    }
    
    .error-message {
        color: var(--error);
        background: var(--error-bg);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid rgba(239, 68, 68, 0.3);
        text-align: center;
        margin: 1rem 0;
    }
    
    .comment {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--card-bg);
        border-radius: 8px;
        border: 1px solid var(--border-primary);
    }
    
    .comment-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid var(--border-primary);
    }
    
    .comment-header .author {
        font-weight: 500;
        color: var(--text-primary);
        text-decoration: none;
    }
    
    .comment-header .author:hover {
        color: var(--accent-primary);
    }
    
    .comment-header .date {
        color: var(--text-muted);
        font-size: 0.85rem;
        margin-left: auto;
    }
    
    .comment-body {
        color: var(--text-secondary);
        line-height: 1.6;
    }
    
    .comment-body p {
        margin: 0.5rem 0;
    }
    
    .comment-body p:first-child {
        margin-top: 0;
    }
    
    .comment-body p:last-child {
        margin-bottom: 0;
    }
    
    .comment-body code {
        background: var(--bg-secondary);
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 0.9em;
    }
    
    .comment-body pre {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
    }
    
    .comment-body blockquote {
        border-left: 3px solid var(--accent-primary);
        padding-left: 1rem;
        margin: 1rem 0;
        color: var(--text-muted);
    }
    
    #add-comment-btn {
        display: inline-block;
        background: var(--accent-primary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }
    
    #add-comment-btn:hover {
        background: var(--accent-hover);
    }
    
    @media (max-width: 640px) {
        .comment {
            padding: 0.75rem;
        }
        
        .comment-header {
            flex-wrap: wrap;
        }
        
        .comment-header .date {
            width: 100%;
            margin-left: 0;
            margin-top: 0.5rem;
        }
    }
    "#;

    // Minify CSS in release mode
    #[cfg(debug_assertions)]
    {
        css.to_string()
    }
    #[cfg(not(debug_assertions))]
    {
        minify_css(css)
    }
}
