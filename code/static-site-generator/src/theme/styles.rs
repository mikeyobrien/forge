//! ABOUTME: CSS generation and 70s earthy theme implementation
//! ABOUTME: Creates stylesheets with retro color palette and responsive design

#[cfg(not(debug_assertions))]
use crate::utils::minify_css;

/// Get default CSS styles with complete 70s earthy theme
pub fn get_default_styles() -> String {
    let css =
    r#"
    /* Reset and base styles */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    /* 70s Earthy Color Palette */
    :root {
        --saddle-brown: #8B4513;
        --peru: #CD853F;
        --sienna: #A0522D;
        --goldenrod: #DAA520;
        --dark-goldenrod: #B8860B;
        --burlywood: #DEB887;
        --tan: #D2B48C;
        --sandy-brown: #F4A460;
        --beige: #F5F5DC;
        --cornsilk: #FFF8DC;
        --papaya-whip: #FFEFD5;
        --olive: #808000;
        --dark-olive: #556B2F;
        --text-primary: #3E2723;
        --text-secondary: #5D4037;
        --text-light: #6D4C41;
        --background-light: #FFF8DC;
        --background-dark: #F5F5DC;
        --border-color: #D2B48C;
        --shadow-color: rgba(139, 69, 19, 0.1);
    }
    
    body {
        font-family: Georgia, Palatino, "Palatino Linotype", "Times New Roman", serif;
        line-height: 1.7;
        color: var(--text-primary);
        background-color: var(--background-light);
        background-image: 
            radial-gradient(circle at 20% 50%, rgba(218, 165, 32, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(160, 82, 45, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(205, 133, 63, 0.03) 0%, transparent 50%);
        min-height: 100vh;
    }
    
    /* Container */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }
    
    /* Header and Navigation */
    header {
        background-color: var(--saddle-brown);
        background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, transparent 100%);
        border-bottom: 3px solid var(--peru);
        padding: 1.5rem 0;
        box-shadow: 0 2px 8px var(--shadow-color);
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
        font-size: 1.8rem;
        margin: 0;
        font-weight: 700;
        letter-spacing: 1px;
    }
    
    header h1 a {
        color: var(--cornsilk);
        text-decoration: none;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        transition: color 0.3s ease;
    }
    
    header h1 a:hover {
        color: var(--papaya-whip);
    }
    
    .nav-menu {
        list-style: none;
        display: flex;
        gap: 2rem;
    }
    
    .nav-menu a {
        color: var(--burlywood);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 500;
        transition: all 0.3s ease;
        position: relative;
    }
    
    .nav-menu a:hover {
        color: var(--cornsilk);
        background-color: rgba(222, 184, 135, 0.2);
    }
    
    .nav-menu a.active {
        color: var(--cornsilk);
        background-color: var(--peru);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    /* Main content */
    main {
        min-height: calc(100vh - 200px);
        padding: 3rem 0;
        background-color: rgba(255, 255, 255, 0.8);
        margin: 0 auto;
        max-width: 1240px;
        box-shadow: 0 0 20px rgba(139, 69, 19, 0.05);
    }
    
    /* Document styles */
    .document h1 {
        font-size: 2.8rem;
        margin-bottom: 1rem;
        line-height: 1.2;
        color: var(--sienna);
        font-weight: 700;
        letter-spacing: -0.5px;
    }
    
    .document-header {
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 3px solid var(--peru);
        background: linear-gradient(to right, transparent, rgba(205, 133, 63, 0.1), transparent);
        padding: 1.5rem;
        border-radius: 8px;
    }
    
    .document-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        margin-top: 1rem;
        font-size: 0.95rem;
        color: var(--text-secondary);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
        background-color: var(--burlywood);
        color: var(--text-primary);
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 500;
        border: 1px solid var(--peru);
        transition: all 0.3s ease;
    }
    
    .tag:hover {
        background-color: var(--peru);
        color: var(--cornsilk);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px var(--shadow-color);
    }
    
    .document-content {
        font-size: 1.15rem;
        line-height: 1.8;
        color: var(--text-primary);
        text-align: justify;
        hyphens: auto;
    }
    
    .document-content h1,
    .document-content h2,
    .document-content h3,
    .document-content h4,
    .document-content h5,
    .document-content h6 {
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        color: var(--sienna);
        font-weight: 600;
        position: relative;
        padding-left: 1rem;
    }
    
    .document-content h2::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 80%;
        background-color: var(--goldenrod);
        border-radius: 2px;
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
        background-color: var(--beige);
        border: 1px solid var(--tan);
        padding: 1.5rem;
        border-radius: 8px;
        overflow-x: auto;
        margin-bottom: 1.5rem;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .document-content code {
        background-color: var(--beige);
        color: var(--text-primary);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-family: "Courier New", Courier, monospace;
        font-size: 0.95em;
        font-weight: 600;
    }
    
    .document-content pre code {
        background-color: transparent;
        padding: 0;
    }
    
    .document-content blockquote {
        border-left: 5px solid var(--goldenrod);
        padding-left: 1.5rem;
        margin: 2rem 0;
        color: var(--text-secondary);
        font-style: italic;
        background-color: rgba(222, 184, 135, 0.1);
        padding: 1.5rem;
        border-radius: 0 8px 8px 0;
        position: relative;
    }
    
    .document-content blockquote::before {
        content: "\201C";
        font-size: 3rem;
        color: var(--goldenrod);
        position: absolute;
        left: 0.5rem;
        top: -0.5rem;
        font-family: Georgia, serif;
    }
    
    .document-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2rem;
        box-shadow: 0 2px 8px var(--shadow-color);
        border-radius: 8px;
        overflow: hidden;
    }
    
    .document-content th,
    .document-content td {
        border: 1px solid var(--tan);
        padding: 0.75rem 1rem;
        text-align: left;
    }
    
    .document-content th {
        background-color: var(--sienna);
        color: var(--cornsilk);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.9rem;
        letter-spacing: 0.5px;
    }
    
    .document-content tr:nth-child(even) {
        background-color: rgba(222, 184, 135, 0.1);
    }
    
    /* Breadcrumbs */
    .breadcrumbs {
        margin-bottom: 2rem;
        background-color: rgba(222, 184, 135, 0.15);
        padding: 1rem 1.5rem;
        border-radius: 25px;
        border: 1px solid var(--tan);
    }
    
    .breadcrumbs ol {
        list-style: none;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        font-size: 0.95rem;
    }
    
    .breadcrumbs li {
        display: inline;
    }
    
    .breadcrumbs a {
        color: var(--sienna);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s ease;
    }
    
    .breadcrumbs a:hover {
        color: var(--peru);
        text-decoration: underline;
    }
    
    .breadcrumbs .separator {
        margin: 0 0.75rem;
        color: var(--goldenrod);
        font-weight: bold;
    }
    
    .breadcrumbs .current {
        color: var(--text-primary);
        font-weight: 600;
    }
    
    /* Category pages */
    .category-index h1 {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        color: var(--sienna);
        text-align: center;
        font-weight: 700;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .category-description {
        font-size: 1.3rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
        text-align: center;
        font-style: italic;
    }
    
    .document-count {
        font-size: 1rem;
        color: var(--text-light);
        margin-bottom: 3rem;
        font-style: italic;
        text-align: center;
        padding: 0.5rem 1.5rem;
        background-color: rgba(222, 184, 135, 0.2);
        border-radius: 20px;
        display: inline-block;
        margin-left: 50%;
        transform: translateX(-50%);
    }
    
    .document-list {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .document-entry {
        padding: 2rem;
        margin-bottom: 2rem;
        border: 2px solid var(--tan);
        border-radius: 12px;
        background-color: rgba(255, 255, 255, 0.7);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .document-entry::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        background-color: var(--goldenrod);
        transform: scaleY(0);
        transform-origin: top;
        transition: transform 0.3s ease;
    }
    
    .document-entry:hover {
        border-color: var(--peru);
        box-shadow: 0 4px 12px var(--shadow-color);
        transform: translateY(-2px);
    }
    
    .document-entry:hover::before {
        transform: scaleY(1);
    }
    
    .document-entry h2 {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
        color: var(--sienna);
    }
    
    .document-entry h2 a {
        color: var(--sienna);
        text-decoration: none;
        transition: color 0.3s ease;
    }
    
    .document-entry h2 a:hover {
        color: var(--peru);
    }
    
    .entry-meta {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        font-size: 0.95rem;
        color: var(--text-light);
        margin-bottom: 0.75rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    
    .summary {
        color: var(--text-secondary);
        line-height: 1.7;
        font-size: 1.05rem;
    }
    
    /* Home page */
    .home-page h1 {
        font-size: 4rem;
        margin-bottom: 1rem;
        text-align: center;
        color: var(--sienna);
        font-weight: 700;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2);
        letter-spacing: -1px;
        position: relative;
        padding-bottom: 1.5rem;
    }
    
    .home-page h1::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 4px;
        background: linear-gradient(to right, var(--goldenrod), var(--peru), var(--goldenrod));
        border-radius: 2px;
    }
    
    .home-page > p {
        font-size: 1.4rem;
        text-align: center;
        color: var(--text-secondary);
        margin-bottom: 3rem;
        font-style: italic;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .search-box-container {
        text-align: center;
        margin-bottom: 3rem;
    }
    
    .search-box {
        width: 100%;
        max-width: 500px;
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border: 2px solid var(--tan);
        border-radius: 30px;
        background-color: var(--beige);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        font-family: Georgia, serif;
    }
    
    .search-box:hover {
        border-color: var(--peru);
        background-color: var(--cornsilk);
        box-shadow: 0 2px 8px var(--shadow-color);
        transform: translateY(-1px);
    }
    
    .nav-search {
        margin-left: auto;
        padding: 0 1rem;
    }
    
    .nav-search-box {
        width: 200px;
        padding: 0.6rem 1.2rem;
        font-size: 0.9rem;
        border: 1px solid var(--burlywood);
        border-radius: 20px;
        background-color: rgba(255, 248, 220, 0.9);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: -apple-system, sans-serif;
    }
    
    .nav-search-box:hover {
        border-color: var(--cornsilk);
        background-color: var(--cornsilk);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
        .nav-search {
            width: 100%;
            padding: 0.5rem 1rem;
            margin-left: 0;
        }
        
        .nav-search-box {
            width: 100%;
        }
    }
    
    .category-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }
    
    .category-card {
        background: linear-gradient(135deg, var(--beige) 0%, var(--papaya-whip) 100%);
        border: 2px solid var(--tan);
        padding: 2.5rem;
        border-radius: 16px;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .category-card::before {
        content: "";
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(218, 165, 32, 0.1) 0%, transparent 70%);
        transform: rotate(45deg);
        transition: all 0.5s ease;
    }
    
    .category-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px var(--shadow-color);
        border-color: var(--peru);
    }
    
    .category-card:hover::before {
        transform: rotate(90deg);
    }
    
    .category-card h2 {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
        position: relative;
        z-index: 1;
    }
    
    .category-card h2 a {
        color: var(--sienna);
        text-decoration: none;
        font-weight: 700;
        transition: color 0.3s ease;
    }
    
    .category-card h2 a:hover {
        color: var(--peru);
    }
    
    .category-card p {
        color: var(--text-secondary);
        margin-bottom: 1rem;
        font-size: 1.05rem;
        position: relative;
        z-index: 1;
    }
    
    .category-card .document-count {
        font-size: 0.95rem;
        color: var(--text-light);
        font-weight: 600;
        position: relative;
        z-index: 1;
    }
    
    /* Footer */
    footer {
        background-color: var(--saddle-brown);
        background-image: 
            repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px),
            linear-gradient(to top, rgba(0, 0, 0, 0.1) 0%, transparent 100%);
        border-top: 3px solid var(--peru);
        padding: 3rem 0;
        margin-top: 5rem;
        text-align: center;
        color: var(--burlywood);
        font-size: 0.95rem;
    }
    
    footer a {
        color: var(--burlywood);
        text-decoration: none;
        border-bottom: 1px dashed var(--burlywood);
    }
    
    footer a:hover {
        color: var(--cornsilk);
        border-bottom-style: solid;
    }
    
    /* Hamburger menu button */
    .nav-toggle {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
    }
    
    .nav-toggle span {
        display: block;
        width: 28px;
        height: 3px;
        background-color: var(--cornsilk);
        margin: 6px 0;
        transition: 0.3s;
        border-radius: 2px;
    }
    
    .nav-toggle:hover span {
        background-color: var(--papaya-whip);
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .nav-container {
            flex-wrap: wrap;
            position: relative;
        }
        
        .nav-toggle {
            display: block;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .nav-menu {
            display: none;
            width: 100%;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 2px solid var(--peru);
            background-color: rgba(139, 69, 19, 0.95);
            margin-left: -20px;
            margin-right: -20px;
            padding-left: 20px;
            padding-right: 20px;
        }
        
        .nav-menu.active {
            display: flex;
        }
        
        .nav-menu a {
            padding: 0.75rem 1rem;
            border-radius: 0;
            border-left: 4px solid transparent;
        }
        
        .nav-menu a:hover,
        .nav-menu a.active {
            border-left-color: var(--goldenrod);
            background-color: rgba(222, 184, 135, 0.2);
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
        
        .breadcrumbs {
            font-size: 0.85rem;
        }
        
        .container {
            padding: 0 15px;
        }
    }
    
    /* Links */
    a {
        color: var(--sienna);
        text-decoration: underline;
        text-decoration-color: rgba(160, 82, 45, 0.3);
        transition: all 0.3s ease;
    }
    
    a:hover {
        color: var(--peru);
        text-decoration-color: var(--peru);
    }
    
    /* Status indicators */
    .status-draft {
        color: var(--dark-goldenrod);
        font-weight: 600;
    }
    
    .status-published {
        color: var(--dark-olive);
        font-weight: 600;
    }
    
    /* Wiki links */
    .wiki-link {
        color: var(--sienna);
        text-decoration: none;
        border-bottom: 2px dotted var(--peru);
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .wiki-link:hover {
        color: var(--peru);
        border-bottom-style: solid;
        background-color: rgba(205, 133, 63, 0.1);
        padding: 0 0.2rem;
        border-radius: 3px;
    }
    
    .wiki-link.broken {
        color: var(--dark-goldenrod);
        border-bottom-color: var(--dark-goldenrod);
        cursor: help;
        opacity: 0.7;
    }
    
    .wiki-link.broken:hover {
        color: var(--goldenrod);
        background-color: rgba(218, 165, 32, 0.1);
    }
    
    /* Backlinks section */
    .backlinks {
        margin-top: 4rem;
        padding: 2rem;
        border: 2px solid var(--tan);
        border-radius: 12px;
        background-color: rgba(222, 184, 135, 0.1);
    }
    
    .backlinks h2 {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
        color: var(--sienna);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .backlinks h2::before {
        content: "\2190";
        font-size: 1.5rem;
        color: var(--goldenrod);
    }
    
    .backlinks ul {
        list-style: none;
        padding-left: 0;
    }
    
    .backlinks li {
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(205, 133, 63, 0.2);
    }
    
    .backlinks li:last-child {
        border-bottom: none;
    }
    
    .backlinks a {
        color: var(--sienna);
        text-decoration: none;
        font-weight: 500;
    }
    
    .backlinks a:hover {
        color: var(--peru);
        text-decoration: underline;
    }
    
    .backlinks .context {
        display: block;
        font-size: 0.9rem;
        color: var(--text-light);
        margin-top: 0.25rem;
        font-style: italic;
    }
    
    /* Search overlay styles */
    #search-overlay {
        background-color: rgba(62, 39, 35, 0.95);
        backdrop-filter: blur(10px);
    }
    
    #search-modal {
        background: linear-gradient(135deg, var(--cornsilk) 0%, var(--papaya-whip) 100%);
        border: 3px solid var(--peru);
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(139, 69, 19, 0.3);
    }
    
    #search-input {
        padding: 1rem 1.5rem;
        font-size: 1.1rem;
        border: 2px solid var(--tan);
        border-radius: 8px;
        background-color: var(--background-light);
        color: var(--text-primary);
        font-family: Georgia, serif;
    }
    
    #search-input:focus {
        outline: none;
        border-color: var(--peru);
        box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.2);
    }
    
    #search-results {
        max-height: 400px;
        overflow-y: auto;
        margin-top: 1rem;
        padding-right: 0.5rem;
    }
    
    /* Custom scrollbar for search results */
    #search-results::-webkit-scrollbar {
        width: 8px;
    }
    
    #search-results::-webkit-scrollbar-track {
        background: var(--beige);
        border-radius: 4px;
    }
    
    #search-results::-webkit-scrollbar-thumb {
        background: var(--peru);
        border-radius: 4px;
    }
    
    #search-results::-webkit-scrollbar-thumb:hover {
        background: var(--sienna);
    }
    
    .search-result {
        padding: 1rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }
    
    .search-result:hover {
        background-color: rgba(222, 184, 135, 0.3);
    }
    
    .search-result.selected {
        background-color: rgba(205, 133, 63, 0.2);
        border-left: 4px solid var(--goldenrod);
        padding-left: calc(1rem - 4px);
    }
    
    .search-result h3 {
        margin: 0 0 0.5rem 0;
        color: var(--sienna);
        font-size: 1.2rem;
    }
    
    .search-result h3 a {
        color: inherit;
        text-decoration: none;
    }
    
    .search-result h3 a:hover {
        color: var(--peru);
    }
    
    .search-result .excerpt {
        font-size: 0.95rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }
    
    .search-result .excerpt mark {
        background-color: var(--goldenrod);
        color: var(--text-primary);
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        font-weight: 600;
    }
    
    .search-result .search-meta {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: var(--text-light);
    }
    
    .search-result .category {
        text-transform: capitalize;
        font-weight: 500;
    }
    
    #search-close {
        background-color: var(--sienna);
        color: var(--cornsilk);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    #search-close:hover {
        background-color: var(--peru);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    /* Additional 70s design elements */
    ::selection {
        background-color: var(--goldenrod);
        color: var(--cornsilk);
    }
    
    ::-moz-selection {
        background-color: var(--goldenrod);
        color: var(--cornsilk);
    }
    
    /* Subtle texture overlay for body */
    body::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
            repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(205, 133, 63, 0.01) 35px,
                rgba(205, 133, 63, 0.01) 70px
            );
        pointer-events: none;
        z-index: 1;
    }
    
    .container,
    header,
    main,
    footer {
        position: relative;
        z-index: 2;
    }
    
    /* Retro form elements */
    input[type="text"],
    input[type="search"],
    textarea,
    select {
        font-family: Georgia, serif;
        background-color: var(--beige);
        border: 2px solid var(--tan);
        color: var(--text-primary);
        transition: all 0.3s ease;
    }
    
    input[type="text"]:focus,
    input[type="search"]:focus,
    textarea:focus,
    select:focus {
        outline: none;
        border-color: var(--peru);
        box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.2);
        background-color: var(--cornsilk);
    }
    
    /* Print styles with 70s theme */
    @media print {
        body {
            background: white;
            color: black;
        }
        
        header,
        footer,
        .nav-menu,
        .nav-search,
        .search-box-container,
        .nav-toggle,
        .backlinks {
            display: none;
        }
        
        .container {
            max-width: 100%;
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
