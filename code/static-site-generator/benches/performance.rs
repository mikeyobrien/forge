//! Performance benchmarks for para-ssg
//! 
//! Run with: cargo bench

use std::fs;
use std::path::Path;
use tempfile::TempDir;
use para_ssg::{Config, generate_site};

/// Create a test document set with specified number of documents
fn create_test_documents(dir: &Path, count: usize) {
    // Create PARA directories
    fs::create_dir_all(dir.join("projects")).unwrap();
    fs::create_dir_all(dir.join("areas")).unwrap();
    fs::create_dir_all(dir.join("resources")).unwrap();
    fs::create_dir_all(dir.join("archives")).unwrap();
    
    let categories = ["projects", "areas", "resources", "archives"];
    
    for i in 0..count {
        let category = categories[i % 4];
        let file_path = dir.join(category).join(format!("doc{}.md", i));
        
        let content = format!(
            r#"---
title: Test Document {}
tags: [test, benchmark, category-{}]
status: published
---

# Test Document {}

This is a test document for benchmarking purposes.

## Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. [[Related Document {}]]

* Item 1
* Item 2
* Item 3

More content here with [[Another Link]] and [[Yet Another Link]].

### Section {}

Final content section with more text.
"#,
            i, category, i, (i + 1) % count, i
        );
        
        fs::write(file_path, content).unwrap();
    }
}

fn main() {
    println!("Performance Benchmarks for para-ssg");
    println!("===================================\n");
    
    let document_counts = vec![10, 50, 100, 200];
    
    for count in document_counts {
        let input_dir = TempDir::new().unwrap();
        let output_dir = TempDir::new().unwrap();
        
        create_test_documents(input_dir.path(), count);
        
        let config = Config::new(
            input_dir.path().to_string_lossy().to_string(),
            output_dir.path().to_string_lossy().to_string(),
        );
        
        println!("Benchmarking with {} documents...", count);
        
        let start = std::time::Instant::now();
        match generate_site(&config) {
            Ok(_) => {
                let elapsed = start.elapsed();
                println!("✅ {} documents: {:.2}s ({:.1} docs/sec)\n", 
                    count, 
                    elapsed.as_secs_f32(),
                    count as f32 / elapsed.as_secs_f32()
                );
            }
            Err(e) => {
                println!("❌ Error: {}\n", e);
            }
        }
    }
    
    println!("\nMemory Usage Test");
    println!("=================\n");
    
    // Test with larger document set for memory usage
    let large_count = 500;
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();
    
    create_test_documents(input_dir.path(), large_count);
    
    let config = Config::new(
        input_dir.path().to_string_lossy().to_string(),
        output_dir.path().to_string_lossy().to_string(),
    );
    
    println!("Testing with {} documents (memory stress test)...", large_count);
    
    let start = std::time::Instant::now();
    match generate_site(&config) {
        Ok(_) => {
            let elapsed = start.elapsed();
            println!("✅ Completed in {:.2}s", elapsed.as_secs_f32());
            
            // Check output size
            let search_index = output_dir.path().join("search-index.json");
            if let Ok(metadata) = fs::metadata(&search_index) {
                println!("📊 Search index size: {} KB", metadata.len() / 1024);
            }
        }
        Err(e) => {
            println!("❌ Error: {}", e);
        }
    }
}