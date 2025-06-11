//! ABOUTME: CSS generation and 70s earthy theme implementation
//! ABOUTME: Creates stylesheets with retro color palette and responsive design

/// Get default CSS styles (basic styling for now, 70s theme in Phase 3)
pub fn get_default_styles() -> String {
    r#"
    /* Reset and base styles */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #fff;
    }
    
    /* Container */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }
    
    /* Header and Navigation */
    header {
        background-color: #f8f8f8;
        border-bottom: 1px solid #e0e0e0;
        padding: 1rem 0;
    }
    
    .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    header h1 {
        font-size: 1.5rem;
        margin: 0;
    }
    
    header h1 a {
        color: #333;
        text-decoration: none;
    }
    
    .nav-menu {
        list-style: none;
        display: flex;
        gap: 2rem;
    }
    
    .nav-menu a {
        color: #666;
        text-decoration: none;
        padding: 0.5rem 0;
        border-bottom: 2px solid transparent;
        transition: all 0.3s ease;
    }
    
    .nav-menu a:hover,
    .nav-menu a.active {
        color: #333;
        border-bottom-color: #333;
    }
    
    /* Main content */
    main {
        min-height: calc(100vh - 200px);
        padding: 2rem 0;
    }
    
    /* Document styles */
    .document h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        line-height: 1.2;
    }
    
    .document-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .document-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 1rem;
        font-size: 0.9rem;
        color: #666;
    }
    
    .document-meta .author,
    .document-meta time,
    .document-meta .status {
        display: inline-block;
    }
    
    .document-meta .tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .tag {
        background-color: #f0f0f0;
        padding: 0.2rem 0.6rem;
        border-radius: 3px;
        font-size: 0.85rem;
    }
    
    .document-content {
        font-size: 1.1rem;
        line-height: 1.7;
    }
    
    .document-content h1,
    .document-content h2,
    .document-content h3,
    .document-content h4,
    .document-content h5,
    .document-content h6 {
        margin-top: 2rem;
        margin-bottom: 1rem;
    }
    
    .document-content p {
        margin-bottom: 1rem;
    }
    
    .document-content ul,
    .document-content ol {
        margin-bottom: 1rem;
        margin-left: 2rem;
    }
    
    .document-content pre {
        background-color: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        margin-bottom: 1rem;
    }
    
    .document-content code {
        background-color: #f5f5f5;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-family: Consolas, Monaco, "Courier New", monospace;
        font-size: 0.9em;
    }
    
    .document-content pre code {
        background-color: transparent;
        padding: 0;
    }
    
    .document-content blockquote {
        border-left: 4px solid #e0e0e0;
        padding-left: 1rem;
        margin: 1rem 0;
        color: #666;
    }
    
    .document-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
    }
    
    .document-content th,
    .document-content td {
        border: 1px solid #e0e0e0;
        padding: 0.5rem;
        text-align: left;
    }
    
    .document-content th {
        background-color: #f8f8f8;
        font-weight: bold;
    }
    
    /* Breadcrumbs */
    .breadcrumbs {
        margin-bottom: 2rem;
    }
    
    .breadcrumbs ol {
        list-style: none;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        font-size: 0.9rem;
    }
    
    .breadcrumbs li {
        display: inline;
    }
    
    .breadcrumbs a {
        color: #666;
        text-decoration: none;
    }
    
    .breadcrumbs a:hover {
        color: #333;
        text-decoration: underline;
    }
    
    .breadcrumbs .separator {
        margin: 0 0.5rem;
        color: #999;
    }
    
    .breadcrumbs .current {
        color: #333;
        font-weight: 500;
    }
    
    /* Category pages */
    .category-index h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }
    
    .category-description {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 2rem;
    }
    
    .document-list {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .document-entry {
        padding-bottom: 2rem;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .document-entry:last-child {
        border-bottom: none;
    }
    
    .document-entry h2 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }
    
    .document-entry h2 a {
        color: #333;
        text-decoration: none;
    }
    
    .document-entry h2 a:hover {
        color: #666;
    }
    
    .entry-meta {
        display: flex;
        gap: 1rem;
        align-items: center;
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.5rem;
    }
    
    .summary {
        color: #555;
        line-height: 1.6;
    }
    
    /* Home page */
    .home-page h1 {
        font-size: 3rem;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .home-page > p {
        font-size: 1.2rem;
        text-align: center;
        color: #666;
        margin-bottom: 3rem;
    }
    
    .category-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }
    
    .category-card {
        background-color: #f8f8f8;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .category-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .category-card h2 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }
    
    .category-card h2 a {
        color: #333;
        text-decoration: none;
    }
    
    .category-card p {
        color: #666;
        margin-bottom: 1rem;
    }
    
    .document-count {
        font-size: 0.9rem;
        color: #999;
    }
    
    /* Footer */
    footer {
        background-color: #f8f8f8;
        border-top: 1px solid #e0e0e0;
        padding: 2rem 0;
        margin-top: 4rem;
        text-align: center;
        color: #666;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .nav-container {
            flex-direction: column;
            gap: 1rem;
        }
        
        .nav-menu {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
        }
        
        .document h1 {
            font-size: 2rem;
        }
        
        .home-page h1 {
            font-size: 2rem;
        }
        
        .category-overview {
            grid-template-columns: 1fr;
        }
    }
    
    /* Links */
    a {
        color: #0066cc;
    }
    
    a:hover {
        color: #0052a3;
    }
    
    /* Status indicators */
    .status-draft {
        color: #ff6600;
    }
    
    .status-published {
        color: #00aa00;
    }
    
    /* Backlinks section (for Phase 2) */
    .backlinks {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid #e0e0e0;
    }
    
    .backlinks h2 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }
    "#.to_string()
}
