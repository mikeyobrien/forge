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
    
    /* Minimal Dark Theme */
    :root {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2a2a2a;
        --text-primary: #e0e0e0;
        --text-secondary: #a0a0a0;
        --text-muted: #666;
        --border-color: #333;
        --accent: #007acc;
        --accent-hover: #0099ff;
        --link-color: #4a9eff;
        --link-hover: #66b3ff;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text-primary);
        background-color: var(--bg-primary);
        min-height: 100vh;
    }
    
    /* Container */
    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 20px;
    }
    
    /* Header - minimal navigation */
    header {
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
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
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
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
        font-size: 4rem;
        font-weight: 700;
        color: var(--accent);
        text-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
    }
    
    .para-letter:hover {
        color: var(--accent-hover);
        transform: translateY(-2px);
        text-decoration: none;
    }
    
    .para-subtitle {
        font-size: 1.2rem;
        color: var(--text-secondary);
        margin: 0;
        font-weight: 300;
    }
    
    /* File list table for landing page */
    .file-list {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2rem;
    }
    
    .file-list th {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
        font-weight: 500;
        font-size: 0.9rem;
    }
    
    .file-list td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-color);
        vertical-align: top;
    }
    
    .file-list tr:hover {
        background-color: var(--bg-secondary);
    }
    
    .file-list .date {
        color: var(--text-muted);
        white-space: nowrap;
        width: 120px;
    }
    
    .file-list .title a {
        color: var(--link-color);
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
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .document-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
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
    
    .document-content h2,
    .document-content h3,
    .document-content h4 {
        margin-top: 2rem;
        margin-bottom: 0.75rem;
        color: var(--text-primary);
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
        border-left: 3px solid var(--accent);
        padding-left: 1rem;
        margin: 1.5rem 0;
        color: var(--text-secondary);
        font-style: italic;
    }
    
    .document-content code {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 0.9em;
    }
    
    .document-content pre {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
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
        font-size: 2rem;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
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
        border: 1px solid var(--border-color);
        border-radius: 5px;
        background-color: var(--bg-secondary);
    }
    
    .document-entry h2 {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }
    
    .document-entry h2 a {
        color: var(--link-color);
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
        color: var(--link-color);
        text-decoration: none;
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
        color: var(--accent);
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
        background-color: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
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