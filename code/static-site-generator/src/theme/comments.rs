// ABOUTME: This module provides GitHub Issues-based commenting functionality for blog posts
// ABOUTME: It generates a JavaScript widget that loads and displays comments from GitHub

/// Comments widget template with GitHub API integration
pub const COMMENTS_SCRIPT: &str = r##"
<div id="blog-comments" class="comments-section">
    <h2>Comments</h2>
    <div id="comments-list">
        <div class="loading">Loading comments...</div>
    </div>
    <a id="add-comment-btn" href="#" class="btn-primary">Add Comment on GitHub</a>
</div>
<script>
(function() {
    const owner = '{repo_owner}';
    const repo = '{repo_name}';
    const issueNumber = '{issue_number}';
    
    if (!issueNumber) {
        document.getElementById('blog-comments').innerHTML = 
            '<p>Comments are not yet enabled for this post.</p>';
        return;
    }
    
    async function loadComments() {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.status === 403) {
                // Rate limit hit
                const resetTime = response.headers.get('X-RateLimit-Reset');
                const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
                const message = resetDate 
                    ? `GitHub API rate limit exceeded. Please try again after ${resetDate.toLocaleTimeString()}.`
                    : 'GitHub API rate limit exceeded. Please try again later.';
                throw new Error(message);
            }
            
            if (response.status === 404) {
                throw new Error('Issue not found. Comments may not be configured correctly.');
            }
            
            if (!response.ok) {
                throw new Error(`Failed to load comments (${response.status})`);
            }
            
            const comments = await response.json();
            displayComments(comments);
        } catch (error) {
            console.error('Error loading comments:', error);
            const errorMessage = error.message || 'Unable to load comments. Please try again later.';
            document.getElementById('comments-list').innerHTML = 
                `<p class="error-message">${errorMessage}</p>`;
        }
    }
    
    function displayComments(comments) {
        const container = document.getElementById('comments-list');
        if (comments.length === 0) {
            container.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <img src="${comment.user.avatar_url}" alt="${comment.user.login}" class="avatar">
                    <a href="${comment.user.html_url}" class="author">${comment.user.login}</a>
                    <time class="date">${new Date(comment.created_at).toLocaleDateString()}</time>
                </div>
                <div class="comment-body">${marked.parse(comment.body)}</div>
            </div>
        `).join('');
    }
    
    // Update Add Comment button
    document.getElementById('add-comment-btn').href = 
        `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
    
    // Load comments when page loads
    loadComments();
})();
</script>
"##;

/// Renders the comments widget with the provided GitHub repository information
pub fn render_comments_widget(
    repo_owner: &str,
    repo_name: &str,
    issue_number: Option<&str>,
) -> String {
    COMMENTS_SCRIPT
        .replace("{repo_owner}", repo_owner)
        .replace("{repo_name}", repo_name)
        .replace("{issue_number}", issue_number.unwrap_or(""))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_comments_widget_with_issue() {
        let result = render_comments_widget("mikeyobrien", "forge", Some("123"));
        assert!(result.contains("const owner = 'mikeyobrien'"));
        assert!(result.contains("const repo = 'forge'"));
        assert!(result.contains("const issueNumber = '123'"));
        assert!(result.contains("blog-comments"));
        assert!(result.contains("Add Comment on GitHub"));
    }

    #[test]
    fn test_render_comments_widget_without_issue() {
        let result = render_comments_widget("mikeyobrien", "forge", None);
        assert!(result.contains("const issueNumber = ''"));
        assert!(result.contains("Comments are not yet enabled for this post"));
    }

    #[test]
    fn test_comments_script_contains_required_elements() {
        assert!(COMMENTS_SCRIPT.contains("loadComments"));
        assert!(COMMENTS_SCRIPT.contains("displayComments"));
        assert!(COMMENTS_SCRIPT.contains("api.github.com"));
        assert!(COMMENTS_SCRIPT.contains("marked.parse"));
    }
}
