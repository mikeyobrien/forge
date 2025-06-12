//! ABOUTME: Client-side search JavaScript generation for static site
//! ABOUTME: Provides fast in-browser search with fuzzy matching and highlighting

#[cfg(not(debug_assertions))]
use crate::utils::minify_js;

/// Generates the JavaScript code for client-side search functionality
pub fn generate_search_script() -> String {
    let js =
    r#"
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
        searchOverlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        `;

        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 600px;
            background: #f5f2e8;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        `;

        // Create search input
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search documents...';
        searchInput.style.cssText = `
            padding: 20px;
            font-size: 18px;
            border: none;
            border-bottom: 2px solid #8b4513;
            background: transparent;
            outline: none;
            color: #3e2723;
        `;

        // Create results container
        searchResults = document.createElement('div');
        searchResults.style.cssText = `
            padding: 20px;
            overflow-y: auto;
            max-height: calc(80vh - 80px);
        `;

        // Assemble components
        searchContainer.appendChild(searchInput);
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
        searchInput.focus();
        searchResults.innerHTML = '';
        currentFocus = -1;
    }

    function closeSearch() {
        if (!searchOverlay) return;
        searchOverlay.style.display = 'none';
        searchInput.value = '';
        searchResults.innerHTML = '';
    }

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        if (!searchIndex || !searchIndex.entries) {
            searchResults.innerHTML = '<p style="color: #8b4513;">Search index not loaded yet...</p>';
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
            searchResults.innerHTML = '<p style="color: #8b4513;">No results found</p>';
            return;
        }

        const html = results.map((result, index) => {
            const entry = result.entry;
            const highlightedTitle = highlightText(entry.title, query);
            const highlightedExcerpt = highlightText(entry.excerpt, query);
            
            return `
                <div class="search-result" data-index="${index}" style="
                    padding: 15px;
                    margin-bottom: 10px;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#f5deb3'" onmouseout="this.style.background='white'">
                    <h3 style="margin: 0 0 5px 0; color: #8b4513;">
                        <a href="${entry.path}" style="text-decoration: none; color: inherit;">
                            ${highlightedTitle}
                        </a>
                    </h3>
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">
                        ${highlightedExcerpt}
                    </p>
                    <div style="font-size: 12px; color: #999;">
                        <span style="background: #f5deb3; padding: 2px 6px; border-radius: 3px; margin-right: 5px;">
                            ${entry.category}
                        </span>
                        ${entry.tags.slice(0, 3).map(tag => 
                            `<span style="background: #e8dcc8; padding: 2px 6px; border-radius: 3px; margin-right: 5px;">
                                ${tag}
                            </span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }).join('');

        searchResults.innerHTML = html;
        
        // Add click handlers
        const resultElements = searchResults.querySelectorAll('.search-result');
        resultElements.forEach(el => {
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
            highlighted = highlighted.replace(regex, '<mark style="background: #daa520; padding: 0 2px;">$1</mark>');
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
                el.style.background = '#daa520';
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.style.background = 'white';
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
