// ABOUTME: This file implements facet generation for search results
// ABOUTME: providing aggregated counts for categories, tags, and date ranges

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */

import { SearchFacet, FacetType, FacetValue } from './advanced-types.js';
import { IndexedDocument } from './types.js';
import { PARACategory } from '../para/types.js';

/**
 * Generates facets from search results for refinement
 */
export class FacetGenerator {
  /**
   * Generate facets from a set of documents
   */
  generateFacets(documents: IndexedDocument[], requestedFacets: FacetType[]): SearchFacet[] {
    const facets: SearchFacet[] = [];

    for (const facetType of requestedFacets) {
      const facet = this.generateFacet(documents, facetType);
      if (facet) {
        facets.push(facet);
      }
    }

    return facets;
  }

  /**
   * Generate a specific type of facet
   */
  private generateFacet(documents: IndexedDocument[], facetType: FacetType): SearchFacet | null {
    switch (facetType) {
      case FacetType.Category:
        return this.generateCategoryFacet(documents);
      case FacetType.Tags:
        return this.generateTagsFacet(documents);
      case FacetType.DateRange:
        return this.generateDateRangeFacet(documents);
      case FacetType.Year:
        return this.generateYearFacet(documents);
      case FacetType.Month:
        return this.generateMonthFacet(documents);
      default:
        return null;
    }
  }

  /**
   * Generate category facet
   */
  private generateCategoryFacet(documents: IndexedDocument[]): SearchFacet {
    const categoryCounts = new Map<PARACategory, number>();

    // Count documents by category
    for (const doc of documents) {
      const count = categoryCounts.get(doc.category) || 0;
      categoryCounts.set(doc.category, count + 1);
    }

    // Convert to facet values
    const values: FacetValue[] = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({
        value: category,
        count,
        label: this.getCategoryLabel(category),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      field: FacetType.Category,
      values,
      totalCount: documents.length,
    };
  }

  /**
   * Generate tags facet
   */
  private generateTagsFacet(documents: IndexedDocument[]): SearchFacet {
    const tagCounts = new Map<string, number>();

    // Count tag occurrences
    for (const doc of documents) {
      for (const tag of doc.tags) {
        const count = tagCounts.get(tag) || 0;
        tagCounts.set(tag, count + 1);
      }
    }

    // Convert to facet values and sort by count
    const values: FacetValue[] = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        value: tag,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Limit to top 20 tags

    return {
      field: FacetType.Tags,
      values,
      totalCount: values.reduce((sum, v) => sum + v.count, 0),
    };
  }

  /**
   * Generate date range facet
   */
  private generateDateRangeFacet(documents: IndexedDocument[]): SearchFacet | null {
    // Check if any documents have dates
    const docsWithDates = documents.filter((doc) => doc.modified || doc.created);
    if (docsWithDates.length === 0) {
      return null;
    }

    const now = new Date();
    const ranges = [
      { label: 'Today', days: 1 },
      { label: 'Last 7 days', days: 7 },
      { label: 'Last 30 days', days: 30 },
      { label: 'Last 90 days', days: 90 },
      { label: 'Last year', days: 365 },
      { label: 'Older', days: Infinity },
    ];

    const values: FacetValue[] = [];

    for (const range of ranges) {
      const count = documents.filter((doc) => {
        const docDate = doc.modified || doc.created;
        if (!docDate) return false;

        const daysSince = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);

        if (range.days === Infinity) {
          return daysSince > 365;
        }

        const prevRangeIndex = ranges.findIndex((r) => r === range) - 1;
        const prevDays = prevRangeIndex >= 0 ? ranges[prevRangeIndex]!.days : 0;

        return daysSince <= range.days && daysSince > prevDays;
      }).length;

      if (count > 0) {
        values.push({
          value: range.label.toLowerCase().replace(/\s+/g, '-'),
          count,
          label: range.label,
        });
      }
    }

    return {
      field: FacetType.DateRange,
      values,
      totalCount: documents.length,
    };
  }

  /**
   * Generate year facet
   */
  private generateYearFacet(documents: IndexedDocument[]): SearchFacet {
    const yearCounts = new Map<number, number>();

    // Count documents by year
    for (const doc of documents) {
      const date = doc.modified || doc.created;
      if (date) {
        const year = date.getFullYear();
        const count = yearCounts.get(year) || 0;
        yearCounts.set(year, count + 1);
      }
    }

    // Convert to facet values and sort by year (descending)
    const values: FacetValue[] = Array.from(yearCounts.entries())
      .map(([year, count]) => ({
        value: year.toString(),
        count,
      }))
      .sort((a, b) => parseInt(b.value) - parseInt(a.value));

    return {
      field: FacetType.Year,
      values,
      totalCount: documents.length,
    };
  }

  /**
   * Generate month facet (last 12 months)
   */
  private generateMonthFacet(documents: IndexedDocument[]): SearchFacet {
    const monthCounts = new Map<string, number>();
    const now = new Date();

    // Generate last 12 months
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthKey);
      monthCounts.set(monthKey, 0);
    }

    // Count documents by month
    for (const doc of documents) {
      const date = doc.modified || doc.created;
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthCounts.has(monthKey)) {
          monthCounts.set(monthKey, monthCounts.get(monthKey)! + 1);
        }
      }
    }

    // Convert to facet values
    const values: FacetValue[] = months
      .map((monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year!), parseInt(month!) - 1);
        const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        return {
          value: monthKey,
          count: monthCounts.get(monthKey) || 0,
          label,
        };
      })
      .filter((v) => v.count > 0);

    return {
      field: FacetType.Month,
      values,
      totalCount: documents.length,
    };
  }

  /**
   * Get human-readable label for category
   */
  private getCategoryLabel(category: PARACategory): string {
    const labels: Record<PARACategory, string> = {
      [PARACategory.Projects]: 'Projects',
      [PARACategory.Areas]: 'Areas',
      [PARACategory.Resources]: 'Resources',
      [PARACategory.Archives]: 'Archives',
    };

    return labels[category] || category;
  }

  /**
   * Apply facet filter to documents
   */
  static applyFacetFilter(
    documents: IndexedDocument[],
    facetType: FacetType,
    facetValue: string,
  ): IndexedDocument[] {
    switch (facetType) {
      case FacetType.Category:
        return documents.filter((doc) => doc.category === facetValue);

      case FacetType.Tags:
        return documents.filter((doc) =>
          doc.tags.some((tag) => tag.toLowerCase() === facetValue.toLowerCase()),
        );

      case FacetType.Year:
        return documents.filter((doc) => {
          const date = doc.modified || doc.created;
          return date && date.getFullYear().toString() === facetValue;
        });

      case FacetType.Month:
        return documents.filter((doc) => {
          const date = doc.modified || doc.created;
          if (!date) return false;
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === facetValue;
        });

      case FacetType.DateRange:
        return this.applyDateRangeFilter(documents, facetValue);

      default:
        return documents;
    }
  }

  /**
   * Apply date range filter
   */
  private static applyDateRangeFilter(
    documents: IndexedDocument[],
    rangeValue: string,
  ): IndexedDocument[] {
    const now = new Date();
    const ranges: Record<string, number> = {
      today: 1,
      'last-7-days': 7,
      'last-30-days': 30,
      'last-90-days': 90,
      'last-year': 365,
    };

    const days = ranges[rangeValue];
    if (!days) {
      // Handle "older" case
      if (rangeValue === 'older') {
        return documents.filter((doc) => {
          const date = doc.modified || doc.created;
          if (!date) return false;
          const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 365;
        });
      }
      return documents;
    }

    return documents.filter((doc) => {
      const date = doc.modified || doc.created;
      if (!date) return false;
      const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= days;
    });
  }
}
