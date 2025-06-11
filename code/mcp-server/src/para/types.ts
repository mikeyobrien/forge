// ABOUTME: Defines the PARA method categories and related type utilities
// ABOUTME: Provides type-safe enums and validation for Projects, Areas, Resources, Archives

export enum PARACategory {
  Projects = 'projects',
  Areas = 'areas',
  Resources = 'resources',
  Archives = 'archives',
}

export const PARA_CATEGORIES = Object.values(PARACategory);

export function isValidPARACategory(value: unknown): value is PARACategory {
  return typeof value === 'string' && PARA_CATEGORIES.includes(value as PARACategory);
}

export function stringToPARACategory(value: string): PARACategory {
  const normalized = value.toLowerCase();
  if (!isValidPARACategory(normalized)) {
    throw new Error(
      `Invalid PARA category: ${value}. Valid categories are: ${PARA_CATEGORIES.join(', ')}`,
    );
  }
  return normalized;
}

export function paraCategoryToString(category: PARACategory): string {
  return category.toString();
}

export interface PARADocument {
  category: PARACategory;
  path: string;
  name: string;
}

export interface PARAStructure {
  [PARACategory.Projects]: string;
  [PARACategory.Areas]: string;
  [PARACategory.Resources]: string;
  [PARACategory.Archives]: string;
}
