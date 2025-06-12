# para-ssg Examples

This directory contains example configurations and document sets to help you get started with para-ssg.

## Directory Structure

```
examples/
├── README.md                    # This file
├── sample-context/              # Complete sample PARA directory
├── deployment/                  # Deployment configuration examples
├── frontmatter-examples/        # Different frontmatter configurations
└── wiki-link-patterns/          # Wiki link usage examples
```

## Getting Started

### Basic Example

Run para-ssg with the sample context:

```bash
# From the para-ssg root directory
cargo run -- examples/sample-context output/

# Or if para-ssg is installed
para-ssg examples/sample-context output/
```

This will generate a complete website in the `output/` directory demonstrating all features.

### What You'll See

The sample context includes:

- PARA-organized directories (Projects, Areas, Resources, Archives)
- Documents with various frontmatter configurations
- Wiki links between documents
- Backlinks demonstration
- Search functionality
- 70s earthy theme applied to all content

### Exploring the Output

After generation, open `output/index.html` in your browser to see:

- Home page with site navigation
- Category pages for each PARA section
- Individual document pages with backlinks
- Working search functionality
- Mobile-responsive design

## Example Files

Each subdirectory contains specific examples:

- **sample-context/** - Complete PARA directory ready to build
- **deployment/** - Platform-specific deployment configurations
- **frontmatter-examples/** - Various YAML frontmatter patterns
- **wiki-link-patterns/** - Different ways to use wiki links

## Next Steps

1. Explore the sample context structure
2. Modify the example documents to see how changes affect the generated site
3. Try different frontmatter configurations
4. Experiment with wiki link patterns
5. Deploy the generated site to your preferred hosting platform

For more detailed information, see the main README.md in the project root.
