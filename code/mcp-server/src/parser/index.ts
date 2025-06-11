// ABOUTME: Parser module exports for wiki-link parsing functionality
// ABOUTME: Re-exports all public APIs from the wiki-link parser

export {
  type WikiLink,
  type WikiLinkParserOptions,
  parseWikiLinks,
  extractLinkComponents,
  replaceWikiLink,
  normalizeTarget,
  createWikiLink,
  isValidTarget,
  extractUniqueTargets,
  findLinkPositions,
} from './wiki-link';
