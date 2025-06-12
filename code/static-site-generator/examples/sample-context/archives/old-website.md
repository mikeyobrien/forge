---
title: 'Legacy Website Documentation'
tags: ['archived', 'web-development', 'legacy', 'documentation']
author: 'Development Team'
date: '2024-12-15'
status: 'archived'
description: 'Documentation for the previous website before redesign'
---

# Legacy Website Documentation

This document contains historical information about our previous website implementation, archived as part of the [[Website Redesign Project]].

## Overview

The legacy website served the company from 2020 to 2024, built with older technologies that are now being replaced with modern alternatives.

### Technology Stack

#### Frontend

- **HTML/CSS** - Traditional semantic markup
- **jQuery 2.1** - JavaScript library for DOM manipulation
- **Bootstrap 3** - CSS framework for responsive design
- **Custom JavaScript** - Various utility functions

#### Backend

- **PHP 7.2** - Server-side scripting
- **MySQL 5.7** - Database management
- **Apache 2.4** - Web server
- **WordPress 4.9** - Content management system

#### Build Process

- **Manual deployment** - FTP-based file uploads
- **No build tools** - Direct file editing
- **Basic minification** - Manual CSS/JS compression

## Architecture

### File Structure

```
legacy-website/
├── public_html/
│   ├── index.php
│   ├── about.php
│   ├── contact.php
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   └── custom.css
│   ├── js/
│   │   ├── jquery.min.js
│   │   ├── bootstrap.min.js
│   │   └── custom.js
│   └── images/
├── includes/
│   ├── header.php
│   ├── footer.php
│   └── config.php
└── database/
    └── schema.sql
```

### Database Schema

#### Core Tables

- `users` - User account information
- `posts` - Blog posts and content
- `pages` - Static page content
- `settings` - Site configuration

## Known Issues

### Performance Problems

1. **Large image files** - No optimization or compression
2. **Blocking JavaScript** - Scripts loaded synchronously
3. **No caching** - Every request generated dynamically
4. **Database queries** - N+1 query problems
5. **No CDN** - All assets served from origin

### Security Concerns

1. **Outdated software** - Multiple components needed updates
2. **SQL injection** - Some queries not properly sanitized
3. **XSS vulnerabilities** - User input not always escaped
4. **Weak passwords** - No complexity requirements
5. **No HTTPS** - Plain HTTP for all traffic

### User Experience Issues

1. **Mobile unfriendly** - Not responsive on small screens
2. **Slow loading** - Pages took 5-8 seconds to load
3. **Poor navigation** - Confusing menu structure
4. **Outdated design** - 2020 aesthetic looked dated
5. **No search** - Users couldn't find content easily

## Lessons Learned

### What Worked Well

- **Simple architecture** - Easy to understand and modify
- **Content management** - WordPress admin was familiar
- **Basic functionality** - Core features worked reliably
- **SEO structure** - Good URL patterns and meta tags

### What Could Be Improved

- **Performance optimization** - Needed modern optimization techniques
- **Security practices** - Required updated security measures
- **Development workflow** - Manual processes were error-prone
- **Code organization** - Needed better structure and documentation
- **Testing procedures** - No automated testing in place

## Migration Considerations

### Data Migration

The following data was preserved during migration to the new website:

1. **Content** - All pages and blog posts
2. **User accounts** - Customer and admin accounts
3. **Media files** - Images and documents
4. **SEO data** - URL redirects and meta information

### Redirect Mapping

```
/old-about.php → /about/
/old-contact.php → /contact/
/blog/post-title.php → /blog/post-title/
/products/category.php → /products/category/
```

## Backup and Recovery

### Final Backup

A complete backup was created on December 15, 2024:

- **Database dump** - Full MySQL export
- **File system** - Complete directory backup
- **Configuration** - Server and application settings
- **Documentation** - This and other relevant documents

### Recovery Procedures

If needed, the legacy site can be restored:

1. Restore database from backup
2. Upload files to web server
3. Configure DNS and server settings
4. Test all functionality

## Historical Context

### Development Timeline

- **2020 Q1** - Initial development and launch
- **2020 Q3** - First major update and blog addition
- **2021 Q2** - Mobile responsiveness improvements
- **2022 Q1** - Security updates and patches
- **2023 Q4** - Final maintenance before redesign
- **2024 Q4** - Decommissioned and archived

### Business Impact

The legacy website served approximately:

- **50,000 monthly visitors** at peak
- **5,000 registered users**
- **500 blog posts** published
- **3 years** of reliable service

## Related Documentation

- [[Website Redesign Project]] - Current replacement project
- [[Server Migration Guide]] - Infrastructure changes
- [[SEO Transition Plan]] - Search ranking preservation
- [[User Data Migration]] - Account transfer procedures

## Code Examples

### Typical PHP Structure

```php
<?php include 'includes/header.php'; ?>

<div class="container">
    <div class="row">
        <div class="col-md-8">
            <h1><?php echo $page_title; ?></h1>
            <div class="content">
                <?php echo $page_content; ?>
            </div>
        </div>
        <div class="col-md-4">
            <?php include 'includes/sidebar.php'; ?>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
```

### JavaScript Patterns

```javascript
$(document).ready(function () {
  // Menu toggle for mobile
  $('.menu-toggle').click(function () {
    $('.nav-menu').slideToggle();
  });

  // Contact form submission
  $('#contact-form').submit(function (e) {
    e.preventDefault();
    // Basic form validation and AJAX submission
  });
});
```

## Archive Status

- **Status**: Permanently archived
- **Access**: Read-only documentation
- **Maintenance**: No further updates
- **Retention**: Kept for historical reference

This document serves as a historical record and reference for understanding the evolution of our web presence.

---

_This archived document demonstrates how completed projects move to archives while maintaining valuable institutional knowledge._
