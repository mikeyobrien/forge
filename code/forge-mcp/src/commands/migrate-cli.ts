#!/usr/bin/env node
// ABOUTME: CLI tool for migrating existing documents to new organization structure
// ABOUTME: Run with --dry-run to preview changes without modifying files

import { Command } from 'commander';
const program = new Command();
import { FileSystem } from '../filesystem/FileSystem.js';
import { PARAManager } from '../para/PARAManager.js';
import { BacklinkManager } from '../backlinks/BacklinkManager.js';
import { DocumentMigrator } from './DocumentMigrator.js';
import { getConfig } from '../config/index.js';

async function main(): Promise<void> {
  program
    .name('migrate-documents')
    .description('Migrate existing documents to new organization structure')
    .option('-d, --dry-run', 'Preview changes without modifying files')
    .option('-c, --context-root <path>', 'Override context root directory')
    .option('-v, --verbose', 'Show detailed output')
    .parse();

  const options = program.opts<{
    dryRun?: boolean;
    contextRoot?: string;
    verbose?: boolean;
  }>();

  try {
    // Get configuration
    const config = await getConfig();
    const contextRoot = options.contextRoot || config.contextRoot;

    console.log(`🔄 Document Migration Tool`);
    console.log(`📁 Context Root: ${contextRoot}`);
    console.log(`🔍 Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Initialize components
    const fileSystem = new FileSystem(contextRoot);
    const paraManager = new PARAManager(contextRoot, fileSystem);
    const backlinkManager = new BacklinkManager(fileSystem, contextRoot);

    // Create migrator
    const migrator = new DocumentMigrator(fileSystem, paraManager, contextRoot, backlinkManager);

    // Run migration
    const summary = await migrator.migrateAll(options.dryRun ?? false);

    // Display results
    console.log('\n📊 Migration Summary');
    console.log('━'.repeat(50));
    console.log(`Total Documents: ${summary.totalDocuments}`);
    console.log(`✅ Successful: ${summary.successful}`);
    console.log(`❌ Failed: ${summary.failed}`);

    if (summary.projectIndexesCreated.length > 0) {
      console.log(`\n📑 Project Indexes Created: ${summary.projectIndexesCreated.length}`);
      if (options.verbose) {
        summary.projectIndexesCreated.forEach((index) => {
          console.log(`  - ${index}`);
        });
      }
    }

    if (options.verbose && summary.results.length > 0) {
      console.log('\n📋 Detailed Results:');
      console.log('━'.repeat(50));

      summary.results.forEach((result) => {
        const status = result.success ? '✅' : '❌';
        console.log(`\n${status} ${result.originalPath}`);

        if (result.newPath !== result.originalPath) {
          console.log(`   → ${result.newPath}`);
        }

        if (result.metadataUpdated) {
          console.log(`   📝 Metadata updated`);
        }

        if (result.linksUpdated > 0) {
          console.log(`   🔗 ${result.linksUpdated} links updated`);
        }

        if (result.error) {
          console.log(`   ⚠️  Error: ${result.error}`);
        }
      });
    }

    // Show failed documents
    const failed = summary.results.filter((r) => !r.success);
    if (failed.length > 0 && !options.verbose) {
      console.log('\n⚠️  Failed Documents:');
      failed.forEach((result) => {
        console.log(`  - ${result.originalPath}: ${result.error}`);
      });
    }

    if (options.dryRun) {
      console.log('\n💡 This was a dry run. No files were modified.');
      console.log('   Run without --dry-run to apply changes.');
    } else if (summary.successful > 0) {
      console.log('\n✨ Migration completed successfully!');
    }

    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
