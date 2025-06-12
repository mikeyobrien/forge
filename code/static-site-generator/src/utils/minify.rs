//! ABOUTME: CSS and JavaScript minification utilities for optimizing output
//! ABOUTME: Reduces file sizes while preserving functionality

/// Minify CSS by removing unnecessary whitespace and comments
pub fn minify_css(css: &str) -> String {
    let mut result = String::with_capacity(css.len());
    let mut in_comment = false;
    let mut chars = css.chars().peekable();
    let mut last_char = ' ';
    
    while let Some(ch) = chars.next() {
        if in_comment {
            if ch == '*' && chars.peek() == Some(&'/') {
                chars.next(); // consume '/'
                in_comment = false;
            }
            continue;
        }
        
        match ch {
            '/' if chars.peek() == Some(&'*') => {
                chars.next(); // consume '*'
                in_comment = true;
            }
            ' ' | '\t' | '\n' | '\r' => {
                // Only add space if it's necessary (between words/values)
                if !last_char.is_whitespace() 
                    && !matches!(last_char, '{' | '}' | ';' | ':' | ',' | '>' | '+' | '~' | '(' | ')')
                    && chars.peek().map_or(false, |&next| 
                        !matches!(next, '{' | '}' | ';' | ':' | ',' | '>' | '+' | '~' | '(' | ')'))
                {
                    result.push(' ');
                    last_char = ' ';
                }
            }
            _ => {
                result.push(ch);
                last_char = ch;
            }
        }
    }
    
    result
}

/// Minify JavaScript by removing unnecessary whitespace and comments
pub fn minify_js(js: &str) -> String {
    let mut result = String::with_capacity(js.len());
    let mut in_string = false;
    let mut in_single_comment = false;
    let mut in_multi_comment = false;
    let mut string_delimiter = '"';
    let mut chars = js.chars().peekable();
    let mut last_char = ' ';
    let mut escape_next = false;
    
    while let Some(ch) = chars.next() {
        if escape_next {
            result.push(ch);
            escape_next = false;
            last_char = ch;
            continue;
        }
        
        if in_string {
            result.push(ch);
            if ch == '\\' {
                escape_next = true;
            } else if ch == string_delimiter {
                in_string = false;
            }
            last_char = ch;
            continue;
        }
        
        if in_single_comment {
            if ch == '\n' {
                in_single_comment = false;
                // Preserve newline after comment to avoid breaking code
                result.push('\n');
                last_char = '\n';
            }
            continue;
        }
        
        if in_multi_comment {
            if ch == '*' && chars.peek() == Some(&'/') {
                chars.next(); // consume '/'
                in_multi_comment = false;
            }
            continue;
        }
        
        match ch {
            '"' | '\'' => {
                in_string = true;
                string_delimiter = ch;
                result.push(ch);
                last_char = ch;
            }
            '/' if chars.peek() == Some(&'/') => {
                chars.next(); // consume second '/'
                in_single_comment = true;
            }
            '/' if chars.peek() == Some(&'*') => {
                chars.next(); // consume '*'
                in_multi_comment = true;
            }
            ' ' | '\t' | '\n' | '\r' => {
                // Only add space if necessary between identifiers/keywords
                if !last_char.is_whitespace() 
                    && is_identifier_char(last_char)
                    && chars.peek().map_or(false, |&next| is_identifier_char(next))
                {
                    result.push(' ');
                    last_char = ' ';
                }
            }
            _ => {
                result.push(ch);
                last_char = ch;
            }
        }
    }
    
    result
}

fn is_identifier_char(ch: char) -> bool {
    ch.is_alphanumeric() || ch == '_' || ch == '$'
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minify_css_basic() {
        let css = r#"
            body {
                margin: 0;
                padding: 0;
            }
        "#;
        let minified = minify_css(css);
        assert_eq!(minified, "body{margin:0;padding:0;}");
    }

    #[test]
    fn test_minify_css_with_comments() {
        let css = r#"
            /* Comment */
            .class {
                color: red; /* inline comment */
            }
        "#;
        let minified = minify_css(css);
        assert_eq!(minified, ".class{color:red;}");
    }

    #[test]
    fn test_minify_css_preserve_necessary_spaces() {
        let css = "div > span + a { margin: 10px 20px }";
        let minified = minify_css(css);
        assert_eq!(minified, "div>span+a{margin:10px 20px}");
    }

    #[test]
    fn test_minify_js_basic() {
        let js = r#"
            function test() {
                return true;
            }
        "#;
        let minified = minify_js(js);
        assert_eq!(minified, "function test(){return true;}");
    }

    #[test]
    fn test_minify_js_with_comments() {
        let js = r#"
            // Single line comment
            function test() {
                /* Multi line
                   comment */
                return true;
            }
        "#;
        let minified = minify_js(js);
        assert_eq!(minified, "\nfunction test(){return true;}");
    }

    #[test]
    fn test_minify_js_preserve_strings() {
        let js = r#"const msg = "Hello /* not a comment */ world";"#;
        let minified = minify_js(js);
        assert_eq!(minified, r#"const msg="Hello /* not a comment */ world";"#);
    }

    #[test]
    fn test_minify_js_preserve_necessary_spaces() {
        let js = "var foo = 123; return foo + bar";
        let minified = minify_js(js);
        assert_eq!(minified, "var foo=123;return foo+bar");
    }
}