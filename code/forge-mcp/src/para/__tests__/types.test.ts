// ABOUTME: Tests for PARA type definitions and utility functions
// ABOUTME: Validates enum conversions and type guards

import {
  PARACategory,
  PARA_CATEGORIES,
  isValidPARACategory,
  stringToPARACategory,
  paraCategoryToString,
} from '../types';

describe('PARA Types', () => {
  describe('PARACategory enum', () => {
    it('should have all four PARA categories', () => {
      expect(PARACategory.Projects).toBe('projects');
      expect(PARACategory.Areas).toBe('areas');
      expect(PARACategory.Resources).toBe('resources');
      expect(PARACategory.Archives).toBe('archives');
    });

    it('should export all categories in PARA_CATEGORIES', () => {
      expect(PARA_CATEGORIES).toHaveLength(4);
      expect(PARA_CATEGORIES).toContain(PARACategory.Projects);
      expect(PARA_CATEGORIES).toContain(PARACategory.Areas);
      expect(PARA_CATEGORIES).toContain(PARACategory.Resources);
      expect(PARA_CATEGORIES).toContain(PARACategory.Archives);
    });
  });

  describe('isValidPARACategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidPARACategory('projects')).toBe(true);
      expect(isValidPARACategory('areas')).toBe(true);
      expect(isValidPARACategory('resources')).toBe(true);
      expect(isValidPARACategory('archives')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidPARACategory('invalid')).toBe(false);
      expect(isValidPARACategory('PROJECTS')).toBe(false);
      expect(isValidPARACategory('')).toBe(false);
      expect(isValidPARACategory(null)).toBe(false);
      expect(isValidPARACategory(undefined)).toBe(false);
      expect(isValidPARACategory(123)).toBe(false);
      expect(isValidPARACategory({})).toBe(false);
    });
  });

  describe('stringToPARACategory', () => {
    it('should convert valid strings to PARACategory', () => {
      expect(stringToPARACategory('projects')).toBe(PARACategory.Projects);
      expect(stringToPARACategory('areas')).toBe(PARACategory.Areas);
      expect(stringToPARACategory('resources')).toBe(PARACategory.Resources);
      expect(stringToPARACategory('archives')).toBe(PARACategory.Archives);
    });

    it('should handle case-insensitive input', () => {
      expect(stringToPARACategory('PROJECTS')).toBe(PARACategory.Projects);
      expect(stringToPARACategory('Areas')).toBe(PARACategory.Areas);
      expect(stringToPARACategory('ReSOuRcEs')).toBe(PARACategory.Resources);
      expect(stringToPARACategory('ARCHIVES')).toBe(PARACategory.Archives);
    });

    it('should throw error for invalid categories', () => {
      expect(() => stringToPARACategory('invalid')).toThrow('Invalid PARA category');
      expect(() => stringToPARACategory('')).toThrow('Invalid PARA category');
      expect(() => stringToPARACategory('project')).toThrow('Invalid PARA category');
    });
  });

  describe('paraCategoryToString', () => {
    it('should convert PARACategory to string', () => {
      expect(paraCategoryToString(PARACategory.Projects)).toBe('projects');
      expect(paraCategoryToString(PARACategory.Areas)).toBe('areas');
      expect(paraCategoryToString(PARACategory.Resources)).toBe('resources');
      expect(paraCategoryToString(PARACategory.Archives)).toBe('archives');
    });
  });
});
