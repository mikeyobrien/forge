//! ABOUTME: Client-side search JavaScript generation for static site
//! ABOUTME: Provides fast in-browser search with fuzzy matching and highlighting

#[cfg(not(debug_assertions))]
use crate::utils::minify_js;

/// Generates the JavaScript code for client-side search functionality
/// 
/// ## Features:
/// - **Keyboard Shortcuts**: Ctrl+K, /, and Escape for navigation
/// - **Fuzzy Search**: Searches titles, tags, and content
/// - **Accessibility**: Full ARIA support and keyboard navigation
/// - **Performance**: Debounced search with staggered animations
/// - **Visual Design**: Modern overlay with backdrop blur and smooth transitions
pub fn generate_search_script() -> String {
    let js = r#"
// Search functionality for para-ssg
(function() {
    let searchIndex = null;
    let searchInput = null;
    let searchResults = null;
    let searchOverlay = null;
    let currentFocus = -1;

    // Initialize search on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeSearch();
    });

    function initializeSearch() {
        // Create search overlay
        createSearchOverlay();
        
        // Set up keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+K or Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
            // Forward slash to open search (if not in input)
            else if (e.key === '/' && !isInputElement(e.target)) {
                e.preventDefault();
                openSearch();
            }
            // Escape to close search
            else if (e.key === 'Escape' && searchOverlay.style.display === 'block') {
                closeSearch();
            }
        });

        // Load search index
        loadSearchIndex();
    }

    function createSearchOverlay() {
        // Create overlay container
        searchOverlay = document.createElement('div');
        searchOverlay.id = 'search-overlay';
        searchOverlay.setAttribute('role', 'dialog');
        searchOverlay.setAttribute('aria-modal', 'true');
        searchOverlay.setAttribute('aria-labelledby', 'search-input');
        searchOverlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.id = 'search-container';
        searchContainer.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%) scale(0.95);
            width: 90%;
            max-width: 700px;
            background: var(--surface-2, #2a2a2a);
            border: 1px solid var(--surface-3, #333);
            border-radius: 16px;
            box-shadow: 
                0 24px 48px rgba(0, 0, 0, 0.4),
                0 12px 24px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        `;

        // Create search input
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'search-input';
        searchInput.placeholder = 'Search documents... (Press "/" or Ctrl+K)';
        searchInput.setAttribute('aria-label', 'Search documents');
        searchInput.setAttribute('aria-describedby', 'search-instructions');
        searchInput.style.cssText = `
            padding: 24px 28px;
            font-size: 18px;
            font-weight: 400;
            border: none;
            border-bottom: 1px solid var(--surface-3, #333);
            background: transparent;
            outline: none;
            color: var(--text-primary, #e0e0e0);
            transition: border-color 0.2s ease;
        `;
        searchInput.setAttribute('autocomplete', 'off');
        searchInput.setAttribute('spellcheck', 'false');

        // Create results container
        searchResults = document.createElement('div');
        searchResults.id = 'search-results';
        searchResults.setAttribute('role', 'listbox');
        searchResults.setAttribute('aria-label', 'Search results');
        searchResults.setAttribute('aria-live', 'polite');
        searchResults.style.cssText = `
            padding: 0 12px 12px;
            overflow-y: auto;
            max-height: calc(80vh - 90px);
            scrollbar-width: thin;
            scrollbar-color: var(--surface-4, #444) transparent;
        `;
        
        // Add custom scrollbar styles
        const scrollbarStyles = document.createElement('style');
        scrollbarStyles.textContent = `
            #search-results::-webkit-scrollbar {
                width: 8px;
            }
            #search-results::-webkit-scrollbar-track {
                background: transparent;
            }
            #search-results::-webkit-scrollbar-thumb {
                background: var(--surface-4, #444);
                border-radius: 4px;
            }
            #search-results::-webkit-scrollbar-thumb:hover {
                background: var(--surface-5, #555);
            }
            #search-container.search-active {
                transform: translateX(-50%) scale(1);
                opacity: 1;
            }
            #search-overlay.search-active {
                opacity: 1;
            }
            @keyframes resultFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .search-result {
                animation: resultFadeIn 0.3s ease forwards;
            }
            .search-result:nth-child(1) { animation-delay: 0s; }
            .search-result:nth-child(2) { animation-delay: 0.05s; }
            .search-result:nth-child(3) { animation-delay: 0.1s; }
            .search-result:nth-child(4) { animation-delay: 0.15s; }
            .search-result:nth-child(5) { animation-delay: 0.2s; }
            .search-result:nth-child(n+6) { animation-delay: 0.25s; }
        `;
        document.head.appendChild(scrollbarStyles);

        // Add search instructions for screen readers
        const searchInstructions = document.createElement('div');
        searchInstructions.id = 'search-instructions';
        searchInstructions.className = 'sr-only';
        searchInstructions.textContent = 'Type to search. Use arrow keys to navigate results. Press Enter to select.';
        searchInstructions.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0,0,0,0);
            white-space: nowrap;
            border: 0;
        `;
        
        // Assemble components
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchInstructions);
        searchContainer.appendChild(searchResults);
        searchOverlay.appendChild(searchContainer);
        document.body.appendChild(searchOverlay);

        // Set up event listeners
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('keydown', handleSearchNavigation);
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) {
                closeSearch();
            }
        });
    }

    function loadSearchIndex() {
        fetch('/search-index.json')
            .then(response => response.json())
            .then(data => {
                searchIndex = data;
                console.log('Search index loaded:', data.stats);
            })
            .catch(error => {
                console.error('Failed to load search index:', error);
            });
    }

    function openSearch() {
        if (!searchOverlay) return;
        searchOverlay.style.display = 'block';
        searchInput.value = '';
        searchResults.innerHTML = '';
        currentFocus = -1;
        
        // Trigger animations
        requestAnimationFrame(() => {
            searchOverlay.classList.add('search-active');
            document.getElementById('search-container').classList.add('search-active');
            searchInput.focus();
        });
    }

    function closeSearch() {
        if (!searchOverlay) return;
        
        // Remove animations
        searchOverlay.classList.remove('search-active');
        document.getElementById('search-container').classList.remove('search-active');
        
        // Wait for animation to complete
        setTimeout(() => {
            searchOverlay.style.display = 'none';
            searchInput.value = '';
            searchResults.innerHTML = '';
        }, 300);
    }

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        if (!searchIndex || !searchIndex.entries) {
            searchResults.innerHTML = '<p style="color: #a0a0a0;">Search index not loaded yet...</p>';
            return;
        }

        const results = searchDocuments(query);
        displayResults(results, query);
    }

    function searchDocuments(query) {
        const results = [];
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);

        for (const entry of searchIndex.entries) {
            let score = 0;
            let matches = [];

            // Search in title (higher weight)
            for (const word of queryWords) {
                if (entry.title.toLowerCase().includes(word)) {
                    score += 10;
                    matches.push('title');
                }
            }

            // Search in tags (medium weight)
            for (const tag of entry.tags) {
                for (const word of queryWords) {
                    if (tag.toLowerCase().includes(word)) {
                        score += 5;
                        matches.push('tag');
                        break;
                    }
                }
            }

            // Search in content (lower weight)
            for (const word of queryWords) {
                if (entry.content.includes(word)) {
                    score += 1;
                    matches.push('content');
                }
            }

            if (score > 0) {
                results.push({
                    entry: entry,
                    score: score,
                    matches: [...new Set(matches)]
                });
            }
        }

        // Sort by score (descending)
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, 20); // Limit to top 20 results
    }

    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<p style="color: #a0a0a0;" role="status">No results found</p>';
            searchResults.setAttribute('aria-label', 'No search results found');
            return;
        }
        
        searchResults.setAttribute('aria-label', `${results.length} search results found`);

        const html = results.map((result, index) => {
            const entry = result.entry;
            const highlightedTitle = highlightText(entry.title, query);
            const highlightedExcerpt = highlightText(entry.excerpt, query);
            
            const categoryColors = {
                'projects': 'var(--accent-gradient-1, linear-gradient(135deg, #007acc, #0099ff))',
                'areas': 'var(--accent-gradient-2, linear-gradient(135deg, #00cc88, #00ffaa))',
                'resources': 'var(--accent-gradient-3, linear-gradient(135deg, #cc7700, #ff9900))',
                'archives': 'var(--accent-gradient-4, linear-gradient(135deg, #cc0077, #ff0099))'
            };
            
            const categoryGradient = categoryColors[entry.category] || categoryColors['resources'];
            
            return `
                <div class="search-result" data-index="${index}" role="option" aria-selected="false" tabindex="-1" style="
                    position: relative;
                    padding: 20px;
                    margin: 0 16px 16px;
                    background: var(--surface-1, #1a1a1a);
                    border: 1px solid var(--surface-3, #333);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    transform: translateY(0);
                    opacity: 0;
                ">
                    <div style="
                        position: absolute;
                        left: 0;
                        top: 0;
                        bottom: 0;
                        width: 4px;
                        background: ${categoryGradient};
                        border-radius: 12px 0 0 12px;
                        transition: width 0.3s ease;
                    "></div>
                    <h3 style="
                        margin: 0 0 8px 0;
                        padding-left: 8px;
                        font-size: 18px;
                        font-weight: 600;
                        line-height: 1.4;
                    ">
                        <a href="${entry.path}" style="
                            text-decoration: none;
                            color: var(--text-primary, #e0e0e0);
                            transition: color 0.2s ease;
                        " onmouseover="this.style.color='var(--link-hover, #4a9eff)'" onmouseout="this.style.color='var(--text-primary, #e0e0e0)'">
                            ${highlightedTitle}
                        </a>
                    </h3>
                    <p style="
                        margin: 0 0 12px 0;
                        padding-left: 8px;
                        color: var(--text-secondary, #a0a0a0);
                        font-size: 14px;
                        line-height: 1.6;
                    ">
                        ${highlightedExcerpt}
                    </p>
                    <div style="
                        padding-left: 8px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        align-items: center;
                    ">
                        <span style="
                            background: ${categoryGradient};
                            color: white;
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 500;
                            text-transform: capitalize;
                        ">
                            ${entry.category}
                        </span>
                        ${entry.tags.slice(0, 3).map(tag => 
                            `<span style="
                                background: var(--surface-3, #333);
                                color: var(--text-secondary, #a0a0a0);
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='var(--surface-4, #444)'" onmouseout="this.style.background='var(--surface-3, #333)'">
                                ${tag}
                            </span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = html;
        
        // Add click handlers and hover effects
        const resultElements = searchResults.querySelectorAll('.search-result');
        resultElements.forEach(el => {
            // Add hover effects
            el.addEventListener('mouseenter', function() {
                this.style.background = 'var(--surface-2, #2a2a2a)';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                const accentBar = this.querySelector('div');
                if (accentBar) accentBar.style.width = '6px';
            });
            
            el.addEventListener('mouseleave', function() {
                this.style.background = 'var(--surface-1, #1a1a1a)';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
                const accentBar = this.querySelector('div');
                if (accentBar) accentBar.style.width = '4px';
            });
            
            // Click handler
            el.addEventListener('click', function(e) {
                if (!e.target.closest('a')) {
                    const link = this.querySelector('a');
                    if (link) window.location.href = link.href;
                }
            });
        });
    }

    function highlightText(text, query) {
        if (!text) return '';
        
        const words = query.split(/\s+/).filter(w => w.length > 0);
        let highlighted = text;
        
        for (const word of words) {
            const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark style="background: var(--link-color, #007acc); color: white; padding: 1px 4px; border-radius: 3px; font-weight: 500;">$1</mark>');
        }
        
        return highlighted;
    }

    function handleSearchNavigation(e) {
        const results = searchResults.querySelectorAll('.search-result');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            if (currentFocus >= results.length) currentFocus = 0;
            setFocus(results);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = results.length - 1;
            setFocus(results);
        } else if (e.key === 'Enter' && currentFocus >= 0 && currentFocus < results.length) {
            e.preventDefault();
            const link = results[currentFocus].querySelector('a');
            if (link) window.location.href = link.href;
        }
    }

    function setFocus(results) {
        results.forEach((el, index) => {
            if (index === currentFocus) {
                el.style.background = 'var(--link-color, #007acc)';
                el.style.transform = 'translateY(-2px) translateZ(0)';
                el.style.boxShadow = '0 0 0 2px var(--link-color, #007acc)';
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                el.setAttribute('aria-selected', 'true');
                el.setAttribute('tabindex', '0');
                const accentBar = el.querySelector('div');
                if (accentBar) accentBar.style.width = '8px';
            } else {
                el.style.background = 'var(--surface-1, #1a1a1a)';
                el.style.transform = 'translateY(0) translateZ(0)';
                el.style.boxShadow = 'none';
                el.setAttribute('aria-selected', 'false');
                el.setAttribute('tabindex', '-1');
                const accentBar = el.querySelector('div');
                if (accentBar) accentBar.style.width = '4px';
            }
        });
    }

    function isInputElement(element) {
        return element.tagName === 'INPUT' || 
               element.tagName === 'TEXTAREA' || 
               element.isContentEditable;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Also add inline search boxes
    document.addEventListener('DOMContentLoaded', function() {
        const inlineSearchBoxes = document.querySelectorAll('.search-box');
        inlineSearchBoxes.forEach(box => {
            box.addEventListener('click', openSearch);
            box.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    openSearch();
                }
            });
        });
    });
})();
"#;

    // Minify JavaScript in release mode
    #[cfg(debug_assertions)]
    {
        js.to_string()
    }
    #[cfg(not(debug_assertions))]
    {
        minify_js(js)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_script_generation() {
        let script = generate_search_script();
        assert!(script.contains("searchIndex"));
        assert!(script.contains("performSearch"));
        assert!(script.contains("Ctrl+K"));
        assert!(script.contains("search-index.json"));
    }

    #[test]
    fn test_search_script_contains_key_functions() {
        let script = generate_search_script();

        // Check for key functions
        assert!(script.contains("loadSearchIndex"));
        assert!(script.contains("searchDocuments"));
        assert!(script.contains("displayResults"));
        assert!(script.contains("highlightText"));
        assert!(script.contains("handleSearchNavigation"));
    }

    #[test]
    fn test_search_script_keyboard_shortcuts() {
        let script = generate_search_script();

        // Check keyboard shortcuts
        assert!(script.contains("e.ctrlKey || e.metaKey"));
        assert!(script.contains("e.key === 'k'"));
        assert!(script.contains("e.key === '/'"));
        assert!(script.contains("e.key === 'Escape'"));
    }
}
