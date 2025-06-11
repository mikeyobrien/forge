// ABOUTME: Tests for TypeScript type definitions
// ABOUTME: Ensures types are properly structured and can be used correctly

import {
  Document,
  PARADocument,
  DocumentFrontmatter,
  FrontmatterBase,
  PARAFrontmatter,
  LinkFrontmatter,
  PARACategory,
  ProjectStatus,
  CreateDocumentParams,
  CreatePARADocumentParams,
  SearchQuery,
  LinkQuery,
  UpdateDocumentParams,
} from '../types';

describe('Type Definitions', () => {
  describe('Enums', () => {
    it('should have correct PARA categories', () => {
      expect(PARACategory.Projects).toBe('projects');
      expect(PARACategory.Areas).toBe('areas');
      expect(PARACategory.Resources).toBe('resources');
      expect(PARACategory.Archives).toBe('archives');
    });

    it('should have correct project statuses', () => {
      expect(ProjectStatus.Active).toBe('active');
      expect(ProjectStatus.Completed).toBe('completed');
      expect(ProjectStatus.OnHold).toBe('on-hold');
      expect(ProjectStatus.Cancelled).toBe('cancelled');
    });
  });

  describe('Interface Usage', () => {
    it('should create valid FrontmatterBase', () => {
      const frontmatter: FrontmatterBase = {
        title: 'Test Document',
        tags: ['test', 'example'],
        created: '2024-01-01T00:00:00Z',
        modified: '2024-01-01T00:00:00Z',
        aliases: ['test-doc', 'example-doc'],
      };

      expect(frontmatter.title).toBe('Test Document');
      expect(frontmatter.tags).toHaveLength(2);
    });

    it('should create valid PARAFrontmatter', () => {
      const paraFrontmatter: PARAFrontmatter = {
        title: 'Test Project',
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        due_date: '2024-12-31T00:00:00Z',
        parent: 'parent-project.md',
      };

      expect(paraFrontmatter.category).toBe(PARACategory.Projects);
      expect(paraFrontmatter.status).toBe(ProjectStatus.Active);
    });

    it('should create valid LinkFrontmatter', () => {
      const linkFrontmatter: LinkFrontmatter = {
        title: 'Linked Document',
        links_to: ['doc1.md', 'doc2.md'],
        backlinks: ['doc3.md'],
      };

      expect(linkFrontmatter.links_to).toHaveLength(2);
      expect(linkFrontmatter.backlinks).toHaveLength(1);
    });

    it('should create valid DocumentFrontmatter with custom fields', () => {
      const docFrontmatter: DocumentFrontmatter = {
        title: 'Complete Document',
        category: PARACategory.Resources,
        tags: ['resource'],
        links_to: ['related.md'],
        customField: 'custom value',
        nestedCustom: {
          key: 'value',
        },
      };

      expect(docFrontmatter['customField']).toBe('custom value');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((docFrontmatter['nestedCustom'] as any).key).toBe('value');
    });

    it('should create valid Document', () => {
      const doc: Document = {
        id: 'test-doc.md',
        path: '/context/test-doc.md',
        frontmatter: {
          title: 'Test Document',
          category: PARACategory.Resources,
        },
        content: 'Document content',
        raw: '---\ntitle: Test Document\n---\nDocument content',
        stats: {
          size: 100,
          created: new Date('2024-01-01'),
          modified: new Date('2024-01-01'),
        },
      };

      expect(doc.id).toBe('test-doc.md');
      expect(doc.frontmatter.title).toBe('Test Document');
    });

    it('should create valid PARADocument', () => {
      const paraDoc: PARADocument = {
        id: 'project.md',
        path: '/context/projects/project.md',
        frontmatter: {
          title: 'Test Project',
          category: PARACategory.Projects,
          status: ProjectStatus.Active,
          due_date: '2024-12-31T00:00:00Z',
        },
        content: 'Project description',
      };

      expect(paraDoc.frontmatter.category).toBe(PARACategory.Projects);
      expect(paraDoc.frontmatter.status).toBe(ProjectStatus.Active);
    });

    it('should create valid CreateDocumentParams', () => {
      const params: CreateDocumentParams = {
        path: 'new-doc.md',
        title: 'New Document',
        content: 'Initial content',
        tags: ['new', 'test'],
        category: PARACategory.Resources,
        frontmatter: {
          aliases: ['new-doc'],
        },
      };

      expect(params.path).toBe('new-doc.md');
      expect(params.tags).toHaveLength(2);
    });

    it('should create valid CreatePARADocumentParams', () => {
      const params: CreatePARADocumentParams = {
        path: 'projects/new-project.md',
        title: 'New Project',
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        due_date: '2024-12-31T00:00:00Z',
        parent: 'parent-project.md',
        content: 'Project description',
      };

      expect(params.category).toBe(PARACategory.Projects);
      expect(params.status).toBe(ProjectStatus.Active);
    });

    it('should create valid SearchQuery', () => {
      const query: SearchQuery = {
        title: 'search term',
        content: 'content search',
        tags: ['tag1', 'tag2'],
        category: PARACategory.Projects,
        status: ProjectStatus.Active,
        limit: 10,
        offset: 0,
      };

      expect(query.tags).toHaveLength(2);
      expect(query.limit).toBe(10);
    });

    it('should create valid LinkQuery', () => {
      const query: LinkQuery = {
        documentId: 'doc.md',
        includeForward: true,
        includeBacklinks: true,
        depth: 2,
      };

      expect(query.documentId).toBe('doc.md');
      expect(query.depth).toBe(2);
    });

    it('should create valid UpdateDocumentParams', () => {
      const params: UpdateDocumentParams = {
        id: 'doc.md',
        title: 'Updated Title',
        content: 'Updated content',
        addTags: ['new-tag'],
        removeTags: ['old-tag'],
        frontmatter: {
          status: ProjectStatus.Completed,
        },
      };

      expect(params.id).toBe('doc.md');
      expect(params.addTags).toHaveLength(1);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow PARADocument to be assigned to Document', () => {
      const paraDoc: PARADocument = {
        id: 'test.md',
        path: '/test.md',
        frontmatter: {
          title: 'Test',
          category: PARACategory.Projects,
          status: ProjectStatus.Active,
        },
        content: 'Content',
      };

      const doc: Document = paraDoc;
      expect(doc.id).toBe('test.md');
    });

    it('should allow frontmatter extension', () => {
      const extended: DocumentFrontmatter = {
        title: 'Extended',
        category: PARACategory.Resources,
        customString: 'value',
        customNumber: 42,
        customObject: { nested: true },
        customArray: [1, 2, 3],
      };

      expect(extended['customString']).toBe('value');
      expect(extended['customNumber']).toBe(42);
    });
  });
});
