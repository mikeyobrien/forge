// ABOUTME: Test data generator for integration tests
// ABOUTME: Creates realistic document networks with links and metadata

import { DocumentFrontmatter, PARACategory } from '../../../models/types';

export interface GeneratedDocument {
  path: string;
  title: string;
  content: string;
  metadata: DocumentFrontmatter;
}

export interface LinkPattern {
  from: string;
  to: string;
  displayText?: string;
}

export class TestDataGenerator {
  private docCounter = 0;
  private readonly categories: PARACategory[] = [PARACategory.Projects, PARACategory.Areas, PARACategory.Resources, PARACategory.Archives];
  private readonly tags = ['javascript', 'typescript', 'testing', 'documentation', 'api', 'frontend', 'backend'];
  private readonly topics = [
    'software development', 'project management', 'system design', 'code review',
    'performance optimization', 'security best practices', 'debugging techniques',
    'API design', 'database architecture', 'user experience'
  ];

  /**
   * Generate a network of interconnected documents
   */
  generateDocumentNetwork(size: number, linkDensity = 0.3): GeneratedDocument[] {
    const documents: GeneratedDocument[] = [];
    const paths: string[] = [];

    // First, create all documents
    for (let i = 0; i < size; i++) {
      const doc = this.generateDocument();
      documents.push(doc);
      paths.push(doc.path);
    }

    // Then, add links between them based on density
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc) continue;
      
      const linksToAdd = Math.floor(Math.random() * (size * linkDensity));
      const linkedPaths = new Set<string>();

      for (let j = 0; j < linksToAdd; j++) {
        const targetIndex = Math.floor(Math.random() * paths.length);
        if (targetIndex !== i && paths[targetIndex]) {
          linkedPaths.add(paths[targetIndex]);
        }
      }

      // Add links to content
      const links = Array.from(linkedPaths).map(path => {
        const shouldUseDisplayText = Math.random() > 0.5;
        if (shouldUseDisplayText) {
          const displayText = this.generateDisplayText();
          const cleanPath = path.replace('.md', '');
          return `[[${cleanPath}|${displayText}]]`;
        }
        const cleanPath = path.replace('.md', '');
        return `[[${cleanPath}]]`;
      });

      if (links.length > 0) {
        doc.content += '\n\n## Related Documents\n\n' + links.join(', ');
      }
    }

    return documents;
  }

  /**
   * Generate a single document with metadata
   */
  generateDocument(): GeneratedDocument {
    this.docCounter++;
    const category = this.randomChoice(this.categories);
    const topic = this.randomChoice(this.topics);
    const docType = this.randomChoice(['guide', 'reference', 'tutorial', 'overview', 'notes']);
    
    const title = `${topic} ${docType} ${this.docCounter}`.replace(/\s+/g, ' ').trim();
    const path = `${category}/${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    
    const metadata: DocumentFrontmatter = {
      title,
      tags: this.randomSubset(this.tags, 1, 4),
      created: this.randomDate(-90, -30).toISOString(),
      modified: this.randomDate(-29, 0).toISOString(),
      category
    };

    // Add project-specific metadata
    if (category === PARACategory.Projects) {
      const statuses = ['active', 'completed', 'on-hold', 'cancelled'];
      metadata.status = this.randomChoice(statuses) as any;
      if (metadata.status === 'active') {
        metadata.due_date = this.randomDate(1, 90).toISOString();
      }
    }

    const content = this.generateContent(topic, docType);

    return { path, title, content, metadata };
  }

  /**
   * Generate searchable content with varied patterns
   */
  generateSearchableContent(keywords: string[] = []): string {
    const paragraphs: string[] = [];
    const baseKeywords = [...keywords, ...this.randomSubset(this.topics, 2, 4)];

    // Introduction
    paragraphs.push(`This document covers important aspects of ${baseKeywords.join(' and ')}.`);

    // Main content with keyword variations
    for (let i = 0; i < 3; i++) {
      const keyword = this.randomChoice(baseKeywords);
      const variation = this.generateKeywordVariation(keyword);
      paragraphs.push(this.generateParagraph(variation));
    }

    // Code example (sometimes)
    if (Math.random() > 0.5) {
      paragraphs.push('```typescript\n' + this.generateCodeSnippet() + '\n```');
    }

    // Conclusion
    paragraphs.push(`In summary, understanding ${baseKeywords[0]} is crucial for modern development.`);

    return paragraphs.join('\n\n');
  }

  /**
   * Generate specific link patterns for testing
   */
  generateLinkPatterns(): LinkPattern[] {
    const patterns: LinkPattern[] = [];

    // Simple links
    patterns.push({
      from: 'projects/main-project.md',
      to: 'resources/reference-guide.md'
    });

    // Links with display text
    patterns.push({
      from: 'areas/development.md',
      to: 'resources/api-documentation.md',
      displayText: 'API docs'
    });

    // Circular references
    patterns.push(
      { from: 'projects/project-a.md', to: 'projects/project-b.md' },
      { from: 'projects/project-b.md', to: 'projects/project-a.md' }
    );

    // Hub document (many outgoing links)
    const hub = 'resources/index.md';
    for (let i = 0; i < 5; i++) {
      patterns.push({
        from: hub,
        to: `resources/topic-${i}.md`
      });
    }

    // Orphaned document (no incoming links)
    // Just by not including it as a 'to' in any pattern

    return patterns;
  }

  /**
   * Generate content with specific patterns for testing
   */
  private generateContent(topic: string, docType: string): string {
    const sections: string[] = [];

    // Header
    sections.push(`# ${topic} ${docType}`);
    sections.push(this.generateParagraph(topic));

    // Main sections
    const sectionCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < sectionCount; i++) {
      sections.push(`## ${this.generateSectionTitle()}`);
      sections.push(this.generateParagraph(topic));
      
      // Sometimes add a list
      if (Math.random() > 0.6) {
        sections.push(this.generateList());
      }
    }

    return sections.join('\n\n');
  }

  private generateParagraph(topic: string): string {
    const templates = [
      `When working with ${topic}, it's important to consider various factors that affect the overall system.`,
      `The ${topic} approach provides several benefits including improved maintainability and scalability.`,
      `Best practices for ${topic} include following established patterns and maintaining consistency.`,
      `Understanding ${topic} requires knowledge of fundamental concepts and practical experience.`
    ];
    
    return this.randomChoice(templates);
  }

  private generateList(): string {
    const items = [];
    const count = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < count; i++) {
      items.push(`- ${this.generateListItem()}`);
    }
    
    return items.join('\n');
  }

  private generateListItem(): string {
    const items = [
      'Ensure proper error handling',
      'Write comprehensive tests',
      'Document all public APIs',
      'Follow coding standards',
      'Optimize for performance',
      'Consider security implications',
      'Maintain backward compatibility'
    ];
    
    return this.randomChoice(items);
  }

  private generateSectionTitle(): string {
    const titles = [
      'Overview', 'Implementation Details', 'Best Practices',
      'Common Patterns', 'Troubleshooting', 'Performance Considerations',
      'Security Guidelines', 'Examples', 'Advanced Topics'
    ];
    
    return this.randomChoice(titles);
  }

  private generateCodeSnippet(): string {
    return `interface Example {
  id: string;
  name: string;
  process(): Promise<void>;
}

class Implementation implements Example {
  constructor(public id: string, public name: string) {}
  
  async process(): Promise<void> {
    console.log(\`Processing \${this.name}\`);
  }
}`;
  }

  private generateDisplayText(): string {
    const texts = [
      'see here', 'more details', 'related topic', 'reference',
      'documentation', 'example', 'guide', 'tutorial'
    ];
    
    return this.randomChoice(texts);
  }

  private generateKeywordVariation(keyword: string): string {
    const variations = [
      keyword,
      keyword.charAt(0).toUpperCase() + keyword.slice(1),
      keyword.toUpperCase(),
      `${keyword}s`,
      `${keyword}ing`
    ];
    
    return this.randomChoice(variations);
  }

  private randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[Math.floor(Math.random() * array.length)]!;
  }

  private randomSubset<T>(array: T[], min: number, max: number): T[] {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private randomDate(daysAgoMin: number, daysAgoMax: number): Date {
    const now = new Date();
    const daysAgo = daysAgoMin + Math.floor(Math.random() * (daysAgoMax - daysAgoMin + 1));
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }
}