//! ABOUTME: CSS generation with minimal dark theme
//! ABOUTME: Creates clean dark mode stylesheet for pleasant reading

#[cfg(not(debug_assertions))]
use crate::utils::minify_css;

/// Get default CSS styles with minimal dark theme
pub fn get_default_styles() -> String {
    let css = r#"
    /* Reset and base styles */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    /* Modern Dark Theme with Enhanced Color System */
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
    }
    
    /* Container */
    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 20px;
    }
    
    /* Header - minimal navigation */
    header {
        background-color: var(--surface-raised);
        border-bottom: 1px solid var(--border-primary);
        padding: 1rem 0;
    }
    
    .nav-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
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
    
    /* Main content */
    main {
        min-height: calc(100vh - 120px);
        padding: 2rem 0;
    }
    
    /* PARA Hero Section */
    .para-hero {
        text-align: center;
        margin-bottom: 3rem;
        padding: 2rem 0;
    }
    
    .para-letters {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 1rem;
    }
    
    .para-letter {
        font-size: clamp(2.5rem, 8vw, 4rem);
        font-weight: 700;
        background: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: #0EA5E9; /* fallback for unsupported browsers */
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        display: inline-block;
        letter-spacing: -0.02em;
        filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3));
    }
    
    .para-letter:hover {
        background: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transform: translateY(-2px) scale(1.05);
        text-decoration: none;
        filter: drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4));
    }
    
    .para-subtitle {
        font-size: clamp(1rem, 2.5vw, 1.2rem);
        color: var(--text-secondary);
        margin: 0;
        font-weight: 400;
        letter-spacing: 0.025em;
        line-height: 1.5;
    }
    
    /* File list table for landing page */
    .file-list {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2rem;
    }
    
    .file-list th {
        background-color: var(--surface-raised);
        color: var(--text-primary);
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-primary);
        font-weight: 500;
        font-size: 0.9rem;
    }
    
    .file-list td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-primary);
        vertical-align: top;
    }
    
    .file-list tr:hover {
        background-color: var(--interactive-hover);
    }
    
    .file-list .date {
        color: var(--text-muted);
        white-space: nowrap;
        width: 120px;
    }
    
    .file-list .title a {
        color: var(--link-primary);
        text-decoration: none;
    }
    
    .file-list .title a:hover {
        color: var(--link-hover);
        text-decoration: underline;
    }
    
    .file-list .category {
        color: var(--text-muted);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        width: 100px;
    }
    
    .file-list .tags {
        font-size: 0.85rem;
    }
    
    .file-list .tag {
        color: var(--text-secondary);
        margin-right: 0.5rem;
    }
    
    .file-list .tag:before {
        content: "\\#";
        color: var(--text-muted);
    }
    
    .no-tags {
        color: var(--text-muted);
        font-style: italic;
    }
    
    /* Document pages */
    .document h1 {
        font-size: clamp(1.75rem, 4vw, 2rem);
        margin-bottom: 1rem;
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 1.2;
    }
    
    .document-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-primary);
    }
    
    .document-meta {
        display: flex;
        gap: 1rem;
        margin-top: 0.75rem;
        font-size: 0.9rem;
        color: var(--text-muted);
    }
    
    .document-content {
        color: var(--text-primary);
        line-height: 1.7;
    }
    
    .document-content h2 {
        font-size: clamp(1.5rem, 3.5vw, 1.75rem);
        margin-top: 2rem;
        margin-bottom: 0.75rem;
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 1.3;
    }
    
    .document-content h3 {
        font-size: clamp(1.25rem, 3vw, 1.5rem);
        margin-top: 1.75rem;
        margin-bottom: 0.75rem;
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.3;
    }
    
    .document-content h4 {
        font-size: clamp(1.125rem, 2.5vw, 1.25rem);
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        color: var(--text-primary);
        font-weight: 600;
        letter-spacing: -0.015em;
        line-height: 1.4;
    }
    
    .document-content p {
        margin-bottom: 1rem;
    }
    
    .document-content ul,
    .document-content ol {
        margin-bottom: 1rem;
        margin-left: 1.5rem;
    }
    
    .document-content blockquote {
        border-left: 3px solid var(--accent-primary);
        padding-left: 1rem;
        margin: 1.5rem 0;
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
        padding: 1rem;
        border-radius: 5px;
        overflow-x: auto;
        margin: 1.5rem 0;
    }
    
    .document-content pre code {
        background: none;
        padding: 0;
    }
    
    /* Category pages - minimal list */
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
        margin-bottom: 2rem;
        font-style: italic;
    }
    
    .document-count {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 2rem;
    }
    
    .document-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .document-entry {
        padding: 1rem;
        border: 1px solid var(--border-primary);
        border-radius: 5px;
        background-color: var(--surface-raised);
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
        gap: 1rem;
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
    }
    
    .summary {
        color: var(--text-secondary);
        line-height: 1.5;
    }
    
    /* Links */
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
    
    .tag:before {
        content: "\\#";
    }
    
    /* Breadcrumbs - minimal */
    .breadcrumbs {
        margin-bottom: 1.5rem;
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
    
    /* Footer - minimal */
    footer {
        background-color: var(--surface-raised);
        border-top: 1px solid var(--border-primary);
        padding: 1.5rem 0;
        margin-top: 3rem;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85rem;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .nav-container {
            flex-direction: column;
            gap: 1rem;
        }
        
        .nav-menu {
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .file-list {
            font-size: 0.9rem;
        }
        
        .file-list th,
        .file-list td {
            padding: 0.5rem;
        }
        
        .file-list .category,
        .file-list .tags {
            display: none;
        }
        
        .container {
            padding: 0 15px;
        }
    }
    
    /* Search overlay will be created dynamically by JavaScript */
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