// ABOUTME: This file contains unit tests for the FacetGenerator class
// ABOUTME: testing facet generation for categories, tags, and date ranges

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */

import { FacetGenerator } from '../facet-generator';
import { FacetType } from '../advanced-types';
import { IndexedDocument } from '../types';
import { PARACategory } from '../../para/types';

describe('FacetGenerator', () => {
  let generator: FacetGenerator;
  let testDocuments: IndexedDocument[];

  beforeEach(() => {
    generator = new FacetGenerator();

    // Create test documents
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastYear = new Date(now);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    testDocuments = [
      {
        path: '/test/projects/project1.md',
        relativePath: 'projects/project1.md',
        title: 'Project 1',
        content: 'Project content',
        tags: ['javascript', 'testing', 'frontend'],
        category: PARACategory.Projects,
        created: yesterday,
        modified: now,
      },
      {
        path: '/test/projects/project2.md',
        relativePath: 'projects/project2.md',
        title: 'Project 2',
        content: 'Another project',
        tags: ['python', 'testing', 'backend'],
        category: PARACategory.Projects,
        created: lastWeek,
        modified: lastWeek,
      },
      {
        path: '/test/areas/area1.md',
        relativePath: 'areas/area1.md',
        title: 'Area 1',
        content: 'Area content',
        tags: ['javascript', 'maintenance'],
        category: PARACategory.Areas,
        created: lastMonth,
        modified: lastMonth,
      },
      {
        path: '/test/resources/resource1.md',
        relativePath: 'resources/resource1.md',
        title: 'Resource 1',
        content: 'Resource content',
        tags: ['documentation', 'reference'],
        category: PARACategory.Resources,
        created: lastYear,
        modified: lastYear,
      },
      {
        path: '/test/archives/archive1.md',
        relativePath: 'archives/archive1.md',
        title: 'Archive 1',
        content: 'Archived content',
        tags: ['old', 'deprecated'],
        category: PARACategory.Archives,
        created: lastYear,
        modified: lastYear,
      },
    ];
  });

  describe('generateFacets', () => {
    it('should generate multiple facet types', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Category, FacetType.Tags]);

      expect(facets).toHaveLength(2);
      expect(facets[0]?.field).toBe(FacetType.Category);
      expect(facets[1]?.field).toBe(FacetType.Tags);
    });

    it('should handle empty document list', () => {
      const facets = generator.generateFacets([], [FacetType.Category]);
      expect(facets).toHaveLength(1);
      expect(facets[0]?.values).toHaveLength(0);
    });

    it('should filter out empty facets', () => {
      const docsWithoutTags = testDocuments.map((doc) => ({ ...doc, tags: [] }));
      const facets = generator.generateFacets(docsWithoutTags, [FacetType.Tags]);
      expect(facets).toHaveLength(0);
    });
  });

  describe('category facets', () => {
    it('should count documents by category', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Category]);
      const categoryFacet = facets[0]!;

      expect(categoryFacet.values).toHaveLength(4); // All 4 categories

      const projectsFacet = categoryFacet.values.find((v) => v.value === PARACategory.Projects);
      expect(projectsFacet?.count).toBe(2);

      const areasFacet = categoryFacet.values.find((v) => v.value === PARACategory.Areas);
      expect(areasFacet?.count).toBe(1);
    });

    it('should sort categories by count', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Category]);
      const counts = facets[0]!.values.map((v) => v.count);

      expect(counts).toEqual([...counts].sort((a, b) => b - a));
    });

    it('should include human-readable labels', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Category]);
      const projectsFacet = facets[0]!.values.find((v) => v.value === PARACategory.Projects);

      expect(projectsFacet?.label).toBe('Projects');
    });
  });

  describe('tag facets', () => {
    it('should count tag occurrences', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Tags]);
      const tagFacet = facets[0]!;

      const testingTag = tagFacet.values.find((v) => v.value === 'testing');
      expect(testingTag?.count).toBe(2);

      const javascriptTag = tagFacet.values.find((v) => v.value === 'javascript');
      expect(javascriptTag?.count).toBe(2);
    });

    it('should limit to top 20 tags', () => {
      // Create documents with many tags
      const manyTagDocs = Array.from({ length: 30 }, (_, i) => ({
        ...testDocuments[0]!,
        tags: [`tag${i}`],
      }));

      const facets = generator.generateFacets(manyTagDocs, [FacetType.Tags]);
      expect(facets[0]!.values.length).toBeLessThanOrEqual(20);
    });

    it('should sort tags by frequency', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Tags]);
      const counts = facets[0]!.values.map((v) => v.count);

      expect(counts).toEqual([...counts].sort((a, b) => b - a));
    });
  });

  describe('date range facets', () => {
    it('should categorize documents by date ranges', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.DateRange]);
      const dateRangeFacet = facets[0]!;

      const todayRange = dateRangeFacet.values.find((v) => v.value === 'today');
      expect(todayRange?.count).toBe(1);

      const last7Days = dateRangeFacet.values.find((v) => v.value === 'last-7-days');
      expect(last7Days?.count).toBeGreaterThanOrEqual(1);
    });

    it('should handle documents without dates', () => {
      const docsWithoutDates = testDocuments.map((doc) => {
        const { created: _created, modified: _modified, ...rest } = doc;
        return rest as IndexedDocument;
      });

      const facets = generator.generateFacets(docsWithoutDates, [FacetType.DateRange]);
      expect(facets).toHaveLength(0);
    });

    it('should use modified date over created date', () => {
      const doc: IndexedDocument = {
        ...testDocuments[0]!,
        created: new Date('2020-01-01'),
        modified: new Date(),
      };

      const facets = generator.generateFacets([doc], [FacetType.DateRange]);
      const todayRange = facets[0]!.values.find((v) => v.value === 'today');
      expect(todayRange?.count).toBe(1);
    });
  });

  describe('year facets', () => {
    it('should group documents by year', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Year]);
      const yearFacet = facets[0]!;

      const currentYear = new Date().getFullYear().toString();
      const currentYearFacet = yearFacet.values.find((v) => v.value === currentYear);
      expect(currentYearFacet?.count).toBeGreaterThanOrEqual(3);
    });

    it('should sort years in descending order', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Year]);
      const years = facets[0]!.values.map((v) => parseInt(v.value));

      expect(years).toEqual([...years].sort((a, b) => b - a));
    });
  });

  describe('month facets', () => {
    it('should show last 12 months', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Month]);
      const monthFacet = facets[0]!;

      // Should only include months with documents
      expect(monthFacet.values.length).toBeGreaterThan(0);
      expect(monthFacet.values.length).toBeLessThanOrEqual(12);
    });

    it('should format month labels nicely', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Month]);
      const monthFacet = facets[0]!;

      if (monthFacet.values.length > 0) {
        const firstMonth = monthFacet.values[0]!;
        expect(firstMonth.label).toMatch(/^\w{3} \d{4}$/); // e.g., "Jan 2024"
      }
    });

    it('should use YYYY-MM format for values', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Month]);
      const monthFacet = facets[0]!;

      if (monthFacet.values.length > 0) {
        const firstMonth = monthFacet.values[0]!;
        expect(firstMonth.value).toMatch(/^\d{4}-\d{2}$/);
      }
    });
  });

  describe('applyFacetFilter', () => {
    it('should filter by category', () => {
      const filtered = FacetGenerator.applyFacetFilter(
        testDocuments,
        FacetType.Category,
        PARACategory.Projects,
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.every((doc) => doc.category === PARACategory.Projects)).toBe(true);
    });

    it('should filter by tag case-insensitively', () => {
      const filtered = FacetGenerator.applyFacetFilter(testDocuments, FacetType.Tags, 'JAVASCRIPT');

      expect(filtered).toHaveLength(2);
    });

    it('should filter by year', () => {
      const currentYear = new Date().getFullYear().toString();
      const filtered = FacetGenerator.applyFacetFilter(testDocuments, FacetType.Year, currentYear);

      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should filter by date range', () => {
      const filtered = FacetGenerator.applyFacetFilter(
        testDocuments,
        FacetType.DateRange,
        'last-7-days',
      );

      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle "older" date range', () => {
      const filtered = FacetGenerator.applyFacetFilter(testDocuments, FacetType.DateRange, 'older');

      expect(filtered).toHaveLength(2); // Two documents from last year
    });

    it('should return all documents for unknown facet type', () => {
      const filtered = FacetGenerator.applyFacetFilter(
        testDocuments,
        'unknown' as FacetType,
        'value',
      );

      expect(filtered).toEqual(testDocuments);
    });
  });

  describe('edge cases', () => {
    it('should handle documents with empty tag arrays', () => {
      const docsWithEmptyTags = [{ ...testDocuments[0]!, tags: [] }];
      const facets = generator.generateFacets(docsWithEmptyTags, [FacetType.Tags]);

      expect(facets).toHaveLength(0);
    });

    it('should calculate total count correctly', () => {
      const facets = generator.generateFacets(testDocuments, [FacetType.Category]);
      expect(facets[0]!.totalCount).toBe(testDocuments.length);
    });

    it('should handle future dates gracefully', () => {
      const futureDoc: IndexedDocument = {
        ...testDocuments[0]!,
        modified: new Date(Date.now() + 86400000), // Tomorrow
      };

      const facets = generator.generateFacets([futureDoc], [FacetType.DateRange]);
      // Should still categorize properly
      expect(facets[0]!.values.length).toBeGreaterThan(0);
    });
  });
});
