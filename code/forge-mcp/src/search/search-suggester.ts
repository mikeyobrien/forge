// ABOUTME: This file implements search suggestion and auto-complete functionality
// ABOUTME: using prefix trees (tries) and frequency-based ranking

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { SearchSuggestion } from './advanced-types.js';
import { IndexedDocument } from './types.js';
import { FuzzyMatcher } from './fuzzy-matcher.js';

/**
 * Trie node for efficient prefix matching
 */
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord = false;
  frequency = 0;
  documentCount = 0;
  value = '';
}

/**
 * Search suggestion engine using tries and fuzzy matching
 */
export class SearchSuggester {
  private titleTrie = new TrieNode();
  private tagTrie = new TrieNode();
  private phraseTrie = new TrieNode();
  private fuzzyMatcher = new FuzzyMatcher();

  /**
   * Build suggestion index from documents
   */
  buildIndex(documents: IndexedDocument[]): void {
    // Clear existing tries
    this.titleTrie = new TrieNode();
    this.tagTrie = new TrieNode();
    this.phraseTrie = new TrieNode();

    // Index each document
    for (const doc of documents) {
      // Index title words
      this.indexTitle(doc.title);

      // Index tags
      for (const tag of doc.tags) {
        this.insertIntoTrie(this.tagTrie, tag.toLowerCase());
      }

      // Index common phrases from content
      this.indexPhrases(doc.content);
    }
  }

  /**
   * Get suggestions for a query prefix
   */
  getSuggestions(
    prefix: string,
    maxSuggestions: number = 10,
    includeCorrections: boolean = true,
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const normalizedPrefix = prefix.toLowerCase().trim();

    if (normalizedPrefix.length === 0) {
      return suggestions;
    }

    // Get title suggestions
    const titleSuggestions = this.getTrieSuggestions(
      this.titleTrie,
      normalizedPrefix,
      'title',
      Math.ceil(maxSuggestions / 3),
    );
    suggestions.push(...titleSuggestions);

    // Get tag suggestions
    const tagSuggestions = this.getTrieSuggestions(
      this.tagTrie,
      normalizedPrefix,
      'tag',
      Math.ceil(maxSuggestions / 3),
    );
    suggestions.push(...tagSuggestions);

    // Get phrase suggestions
    const phraseSuggestions = this.getTrieSuggestions(
      this.phraseTrie,
      normalizedPrefix,
      'phrase',
      Math.ceil(maxSuggestions / 3),
    );
    suggestions.push(...phraseSuggestions);

    // Add spelling corrections if enabled and we don't have enough suggestions
    if (includeCorrections && suggestions.length < maxSuggestions / 2) {
      const corrections = this.getSpellingCorrections(
        normalizedPrefix,
        maxSuggestions - suggestions.length,
      );
      suggestions.push(...corrections);
    }

    // Sort by score and limit results
    return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
  }

  /**
   * Index title words and phrases
   */
  private indexTitle(title: string): void {
    const words = title.toLowerCase().split(/\s+/);

    // Index individual words
    for (const word of words) {
      if (word.length > 2) {
        this.insertIntoTrie(this.titleTrie, word);
      }
    }

    // Index full title as a phrase
    if (words.length > 1) {
      this.insertIntoTrie(this.titleTrie, title.toLowerCase());
    }
  }

  /**
   * Index common phrases from content
   */
  private indexPhrases(content: string): void {
    // Extract sentences
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      // Extract 2-4 word phrases
      const words = sentence
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      for (let len = 2; len <= 4 && len <= words.length; len++) {
        for (let i = 0; i <= words.length - len; i++) {
          const phrase = words.slice(i, i + len).join(' ');
          if (phrase.length > 5 && phrase.length < 50) {
            this.insertIntoTrie(this.phraseTrie, phrase);
          }
        }
      }
    }
  }

  /**
   * Insert a word into trie
   */
  private insertIntoTrie(root: TrieNode, word: string): void {
    let node = root;

    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.frequency++;
    node.documentCount++;
    node.value = word;
  }

  /**
   * Get suggestions from a trie
   */
  private getTrieSuggestions(
    root: TrieNode,
    prefix: string,
    suggestionType: SearchSuggestion['type'],
    maxResults: number,
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Find prefix node
    let node = root;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return suggestions;
      }
      node = node.children.get(char)!;
    }

    // Collect all words with this prefix
    const words: Array<{ value: string; frequency: number; documentCount: number }> = [];
    this.collectWords(node, prefix, words, maxResults * 2);

    // Convert to suggestions
    for (const word of words) {
      suggestions.push({
        text: word.value,
        type: suggestionType,
        score: this.calculateSuggestionScore(word.value, prefix, word.frequency),
        documentCount: word.documentCount,
      });
    }

    return suggestions.slice(0, maxResults);
  }

  /**
   * Recursively collect words from trie
   */
  private collectWords(
    node: TrieNode,
    prefix: string,
    results: Array<{ value: string; frequency: number; documentCount: number }>,
    maxResults: number,
  ): void {
    if (results.length >= maxResults) return;

    if (node.isEndOfWord) {
      results.push({
        value: node.value || prefix,
        frequency: node.frequency,
        documentCount: node.documentCount,
      });
    }

    // Sort children by frequency for better suggestions
    const sortedChildren = Array.from(node.children.entries()).sort((a, b) => {
      const freqA = this.getMaxFrequency(a[1]);
      const freqB = this.getMaxFrequency(b[1]);
      return freqB - freqA;
    });

    for (const [char, child] of sortedChildren) {
      if (results.length >= maxResults) break;
      this.collectWords(child, prefix + char, results, maxResults);
    }
  }

  /**
   * Get maximum frequency in subtree
   */
  private getMaxFrequency(node: TrieNode): number {
    let maxFreq = node.frequency;

    for (const child of node.children.values()) {
      maxFreq = Math.max(maxFreq, this.getMaxFrequency(child));
    }

    return maxFreq;
  }

  /**
   * Calculate suggestion score
   */
  private calculateSuggestionScore(suggestion: string, prefix: string, frequency: number): number {
    let score = 0;

    // Frequency component (0-40 points)
    score += Math.min(40, frequency * 10);

    // Length similarity (0-30 points)
    const lengthDiff = Math.abs(suggestion.length - prefix.length);
    score += Math.max(0, 30 - lengthDiff * 2);

    // Prefix match quality (0-30 points)
    if (suggestion.startsWith(prefix)) {
      score += 30;
    } else {
      // Fuzzy match
      const similarity = this.fuzzyMatcher.calculateSimilarity(
        suggestion.substring(0, prefix.length),
        prefix,
      );
      score += similarity * 30;
    }

    return Math.round(score);
  }

  /**
   * Get spelling corrections for misspelled queries
   */
  private getSpellingCorrections(query: string, maxCorrections: number): SearchSuggestion[] {
    const corrections: SearchSuggestion[] = [];
    const allWords = new Set<string>();

    // Collect all indexed words
    this.collectAllWords(this.titleTrie, allWords);
    this.collectAllWords(this.tagTrie, allWords);

    // Find best fuzzy matches
    const matches = this.fuzzyMatcher.findBestMatches(
      query,
      Array.from(allWords),
      maxCorrections,
      0.7, // Minimum similarity for corrections
    );

    // Convert to suggestions
    for (const match of matches) {
      corrections.push({
        text: match.value,
        type: 'correction',
        score: Math.round(match.similarity * 100),
      });
    }

    return corrections;
  }

  /**
   * Collect all words from a trie
   */
  private collectAllWords(node: TrieNode, words: Set<string>): void {
    if (node.isEndOfWord && node.value) {
      words.add(node.value);
    }

    for (const child of node.children.values()) {
      this.collectAllWords(child, words);
    }
  }

  /**
   * Get popular searches (high frequency items)
   */
  getPopularSearches(limit: number = 10): SearchSuggestion[] {
    const allSuggestions: SearchSuggestion[] = [];

    // Collect from all tries
    const titleWords: Array<{ value: string; frequency: number; documentCount: number }> = [];
    this.collectWords(this.titleTrie, '', titleWords, limit * 2);

    const tagWords: Array<{ value: string; frequency: number; documentCount: number }> = [];
    this.collectWords(this.tagTrie, '', tagWords, limit);

    // Convert to suggestions
    for (const word of titleWords) {
      allSuggestions.push({
        text: word.value,
        type: 'title',
        score: word.frequency * 10,
        documentCount: word.documentCount,
      });
    }

    for (const word of tagWords) {
      allSuggestions.push({
        text: word.value,
        type: 'tag',
        score: word.frequency * 15, // Tags get higher weight
        documentCount: word.documentCount,
      });
    }

    // Sort by score and return top results
    return allSuggestions.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
