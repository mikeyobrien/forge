// ABOUTME: Integration test harness for setting up and tearing down test environments
// ABOUTME: Provides utilities for executing complex test scenarios

import { join } from 'path';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { FileSystem } from '../../../filesystem/FileSystem';
import { PARAManager } from '../../../para/PARAManager';
import { SearchEngine } from '../../../search/SearchEngine';
import { BacklinkManager } from '../../../backlinks/BacklinkManager';
import { DocumentUpdater } from '../../../updater/DocumentUpdater';
import { GeneratedDocument, TestDataGenerator } from './TestDataGenerator';
import { Document } from '../../../models/types';
import { createDocument } from '../../../models/factories';
import { serializeDocument } from '../../../parsers/serializer';
import { parseWikiLinks } from '../../../parser/wiki-link';
import { BacklinkTestHelper } from './BacklinkTestHelper';

export interface TestScenario {
  name: string;
  setup: () => Promise<GeneratedDocument[]>;
  execute: (context: TestContext) => Promise<void>;
  verify: (context: TestContext) => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestContext {
  fs: FileSystem;
  paraManager: PARAManager;
  searchEngine: SearchEngine;
  backlinkManager: BacklinkManager;
  backlinkHelper: BacklinkTestHelper;
  documentUpdater: DocumentUpdater;
  testRoot: string;
  documents: Map<string, Document>;
  linkIndex: Map<string, any[]>; // For tracking links per document
}

export interface TestResult {
  scenario: string;
  success: boolean;
  duration: number;
  error?: Error | undefined;
  metrics?: Record<string, number>;
}

export class IntegrationTestHarness {
  private testRoot: string;
  private context: TestContext | null = null;
  private testDataGenerator: TestDataGenerator;

  constructor(testId: string) {
    this.testRoot = join(process.cwd(), 'test-data', `integration-${testId}-${Date.now()}`);
    this.testDataGenerator = new TestDataGenerator();
  }

  /**
   * Set up the test environment
   */
  async setup(): Promise<void> {
    // Create test directory
    if (!existsSync(this.testRoot)) {
      mkdirSync(this.testRoot, { recursive: true });
    }

    // Initialize components
    const fs = new FileSystem(this.testRoot);
    const paraManager = new PARAManager(this.testRoot, fs);
    const searchEngine = new SearchEngine(fs, paraManager, this.testRoot);
    const backlinkManager = new BacklinkManager(fs, this.testRoot);
    const documentUpdater = new DocumentUpdater(fs, paraManager);

    // Create PARA structure
    await paraManager.initializeStructure();

    // Initialize search and backlink systems
    await searchEngine.initialize();
    await backlinkManager.initialize();

    // Create backlink helper
    const backlinkHelper = new BacklinkTestHelper(backlinkManager, fs);

    this.context = {
      fs,
      paraManager,
      searchEngine,
      backlinkManager,
      backlinkHelper,
      documentUpdater,
      testRoot: this.testRoot,
      documents: new Map(),
      linkIndex: new Map(),
    };
  }

  /**
   * Tear down the test environment
   */
  async teardown(): Promise<void> {
    if (existsSync(this.testRoot)) {
      rmSync(this.testRoot, { recursive: true, force: true });
    }
    this.context = null;
  }

  /**
   * Execute a test scenario
   */
  async executeScenario(scenario: TestScenario): Promise<TestResult> {
    if (!this.context) {
      throw new Error('Test harness not set up. Call setup() first.');
    }

    const startTime = Date.now();
    let success = true;
    let error: Error | undefined;

    try {
      // Run scenario setup
      const generatedDocs = await scenario.setup();

      // Create documents in the test environment
      await this.createDocuments(generatedDocs);

      // Execute the scenario
      await scenario.execute(this.context);

      // Verify the results
      await scenario.verify(this.context);

      // Run scenario-specific teardown if provided
      if (scenario.teardown) {
        await scenario.teardown();
      }
    } catch (e) {
      success = false;
      error = e as Error;
    }

    const duration = Date.now() - startTime;

    return {
      scenario: scenario.name,
      success,
      duration,
      error,
      metrics: this.collectMetrics(),
    };
  }

  /**
   * Create documents in the test environment
   */
  private async createDocuments(documents: GeneratedDocument[]): Promise<void> {
    if (!this.context) {
      throw new Error('Test context not initialized');
    }

    for (const doc of documents) {
      // Create the document
      const document = createDocument({
        path: doc.path,
        title: doc.metadata.title,
        content: doc.content,
        tags: doc.metadata.tags || [],
        category: doc.metadata.category,
        frontmatter: doc.metadata as any,
      });

      // Write to filesystem
      const serialized = serializeDocument(document);
      await this.context.fs.writeFile(doc.path, serialized);

      // Store in context for reference
      this.context.documents.set(doc.path, document);

      // Parse and store links
      const links = parseWikiLinks(document.content);
      this.context.linkIndex.set(doc.path, links);
    }

    // Update backlinks after all documents are created
    await this.context.backlinkManager.rebuildIndex();
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(): Record<string, number> {
    if (!this.context) {
      return {};
    }

    // Calculate total link count
    let totalLinks = 0;
    for (const links of this.context.linkIndex.values()) {
      totalLinks += links.length;
    }

    return {
      documentCount: this.context.documents.size,
      totalLinks: totalLinks,
      backlinkCount: this.context.backlinkManager.getStats().linkCount,
    };
  }

  /**
   * Helper to generate test documents
   */
  generateDocuments(count: number, linkDensity = 0.3): GeneratedDocument[] {
    return this.testDataGenerator.generateDocumentNetwork(count, linkDensity);
  }

  /**
   * Helper to wait for a condition
   */
  async waitFor(condition: () => boolean, timeout = 5000, interval = 100): Promise<void> {
    const startTime = Date.now();

    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for condition after ${timeout}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  /**
   * Helper to measure operation time
   */
  async measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    return { result, duration };
  }

  /**
   * Get the test context
   */
  getContext(): TestContext {
    if (!this.context) {
      throw new Error('Test context not initialized. Call setup() first.');
    }
    return this.context;
  }
}
