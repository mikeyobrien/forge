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
    
    header {
        grid-area: header;
        background-color: var(--surface-raised);
        border-bottom: 1px solid var(--border-primary);
        padding: var(--space-2) 0;
        position: sticky;
        top: 0;
        z-index: 100;
    }
    
    .nav-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 var(--space-4);
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: var(--space-4);
    }
    
    header h1 {
        font-size: clamp(1.25rem, 2.5vw, 1.5rem);
        font-weight: 600;
        margin: 0;
        letter-spacing: -0.025em;
    }
    
    header h1 a {
        color: var(--text-primary);
        text-decoration: none;
    }
    
    header h1 a:hover {
        color: var(--accent-hover);
    }
    
    /* Navigation - simple P | A | R | A style */
    .nav-menu {
        list-style: none;
        display: flex;
        gap: 0;
        margin: 0;
    }
    
    .nav-menu li:not(:last-child)::after {
        content: " | ";
        color: var(--text-muted);
        margin: 0 0.75rem;
    }
    
    .nav-menu a {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.2s ease;
    }
    
    .nav-menu a:hover,
    .nav-menu a.active {
        color: var(--accent);
    }
    
    /* Hide nav toggle and search in minimal theme */
    .nav-toggle,
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
       PARA Hero Section
       ========================================================================== */
    
    .para-hero {
        text-align: center;
        margin-bottom: var(--space-6);
        padding: var(--space-4) 0;
        position: relative;
        overflow: hidden;
    }
    
    /* Animated background glow effect - GPU accelerated */
    .para-hero::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150%;
        height: 150%;
        background: radial-gradient(circle, rgba(14, 165, 233, 0.03) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        animation: gentle-pulse 4s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
    }
    
    @keyframes gentle-pulse {
        0%, 100% { 
            transform: translate(-50%, -50%) scale(1) translateZ(0);
            opacity: 0.3;
            will-change: transform, opacity;
        }
        50% { 
            transform: translate(-50%, -50%) scale(1.1) translateZ(0);
            opacity: 0.6;
        }
    }
    
    .para-letters {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        justify-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-2);
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
        position: relative;
        z-index: 1;
    }
    
    /* Staggered entrance animations and subtle variations for PARA letters */
    .para-letter:nth-child(1) { 
        animation: letter-entrance 0.8s ease-out 0.1s both, subtle-float 6s ease-in-out infinite;
        animation-delay: 0.1s, 1s;
    }
    .para-letter:nth-child(2) { 
        animation: letter-entrance 0.8s ease-out 0.2s both, subtle-float 6s ease-in-out 1.5s infinite reverse;
        animation-delay: 0.2s, 1.5s;
    }
    .para-letter:nth-child(3) { 
        animation: letter-entrance 0.8s ease-out 0.3s both, subtle-float 6s ease-in-out 2s infinite;
        animation-delay: 0.3s, 2s;
    }
    .para-letter:nth-child(4) { 
        animation: letter-entrance 0.8s ease-out 0.4s both, subtle-float 6s ease-in-out 2.5s infinite reverse;
        animation-delay: 0.4s, 2.5s;
    }
    
    @keyframes letter-entrance {
        0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            filter: blur(4px) drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3));
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3));
        }
    }
    
    .para-letter {
        font-size: clamp(2.5rem, 8vw, 4rem);
        font-weight: 700;
        background: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 50%, #6366F1 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: #0EA5E9; /* fallback for unsupported browsers */
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    background-position 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        display: inline-block;
        letter-spacing: -0.02em;
        filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3));
        position: relative;
        cursor: pointer;
    }
    
    @keyframes subtle-float {
        0%, 100% { 
            transform: translateY(0px);
        }
        50% { 
            transform: translateY(-2px);
        }
    }
    
    .para-letter:hover {
        background: linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #7C3AED 100%);
        background-size: 300% 300%;
        background-position: 100% 0;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transform: translateY(-4px) scale(1.08) translateZ(0);
        text-decoration: none;
        filter: drop-shadow(0 8px 16px rgba(14, 165, 233, 0.5));
        animation: gradient-shift 2s ease-in-out infinite, subtle-float 6s ease-in-out infinite;
    }
    
    @keyframes gradient-shift {
        0%, 100% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
    }
    
    /* Enhanced focus states for accessibility */
    .para-letter:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4);
        border-radius: 4px;
        transform: translateY(-2px) scale(1.05) translateZ(0);
        filter: drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4));
    }
    
    /* Active state for better feedback */
    .para-letter:active {
        transform: translateY(0) scale(1.02) translateZ(0);
        filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.6));
        transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .para-subtitle {
        font-size: clamp(1rem, 2.5vw, 1.2rem);
        color: var(--text-secondary);
        margin: 0;
        font-weight: 400;
        letter-spacing: 0.025em;
        line-height: 1.5;
        position: relative;
        z-index: 1;
        animation: subtitle-entrance 1s ease-out 0.6s both;
    }
    
    @keyframes subtitle-entrance {
        0% {
            opacity: 0;
            transform: translateY(10px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Accessibility: Respect prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
        .para-hero::before,
        .para-letter,
        .para-subtitle {
            animation: none !important;
        }
        
        .para-letter:hover {
            animation: none !important;
            background-position: 0% 50% !important;
        }
        
        .para-letter {
            animation: none !important;
        }
        
        /* Maintain functionality but reduce motion */
        .para-letter:hover {
            transform: scale(1.05);
            transition: all 0.2s ease;
        }
        
        .para-letter:focus {
            transform: scale(1.05);
            transition: all 0.2s ease;
        }
        
        .para-letter:active {
            transform: scale(1.02);
            transition: all 0.1s ease;
        }
    }
    
    /* ==========================================================================
       File Cards Component
       ========================================================================== */
    
    .file-cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
        max-width: 800px;
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
        font-size: clamp(1.75rem, 4vw, 2rem);
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 1.2;
    }
    
    .category-description {
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
        font-style: italic;
    }
    
    .document-count {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: var(--space-4);
    }
    
    .document-list {
        display: grid;
        gap: var(--space-2);
        grid-template-columns: 1fr;
    }
    
    .document-entry {
        padding: var(--space-2);
        border: 1px solid var(--border-primary);
        border-radius: 5px;
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
        
        .nav-container {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: var(--space-2);
            text-align: center;
        }
        
        .nav-menu {
            justify-content: center;
        }
        
        .para-letters {
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
        .para-hero {
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
        
        .para-letters {
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
    .para-letter,
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
        header, footer, .para-hero, .search-box {
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