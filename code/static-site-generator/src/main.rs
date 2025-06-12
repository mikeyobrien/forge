//! ABOUTME: CLI entry point for para-ssg static site generator
//! ABOUTME: Handles command-line arguments and orchestrates the build process

use para_ssg::{generate_site, Config, ParaSsgError};
use std::env;
use std::process;
use std::sync::mpsc;
use std::time::Duration;

fn main() {
    if let Err(e) = run() {
        eprintln!("Error: {}", e);
        process::exit(1);
    }
}

fn run() -> Result<(), ParaSsgError> {
    let args: Vec<String> = env::args().collect();

    // Check for help flag
    if args.len() > 1 && (args[1] == "--help" || args[1] == "-h") {
        print_usage(&args[0]);
        return Ok(());
    }

    // Parse verbose flag
    let (verbose, remaining_args) =
        if args.contains(&"--verbose".to_string()) || args.contains(&"-v".to_string()) {
            (
                true,
                args.iter()
                    .filter(|a| *a != "--verbose" && *a != "-v")
                    .cloned()
                    .collect::<Vec<_>>(),
            )
        } else {
            (false, args)
        };

    // Parse watch flag
    let (watch, remaining_args) = if remaining_args.contains(&"--watch".to_string())
        || remaining_args.contains(&"-w".to_string())
    {
        (
            true,
            remaining_args
                .iter()
                .filter(|a| *a != "--watch" && *a != "-w")
                .cloned()
                .collect::<Vec<_>>(),
        )
    } else {
        (false, remaining_args)
    };

    if remaining_args.len() != 3 {
        print_usage(&remaining_args[0]);
        return Err(ParaSsgError::InvalidPath(
            "Incorrect number of arguments".to_string(),
        ));
    }

    let input_dir = remaining_args[1].clone();
    let output_dir = remaining_args[2].clone();

    // Validate arguments
    if input_dir.is_empty() || output_dir.is_empty() {
        return Err(ParaSsgError::InvalidPath(
            "Input and output directories cannot be empty".to_string(),
        ));
    }

    // Create configuration
    let mut config = Config::new(input_dir, output_dir);
    config.verbose = verbose;
    config.watch = watch;

    // Generate the site
    println!(
        "Building site from '{}' to '{}'",
        config.input_dir, config.output_dir
    );
    generate_site(&config)?;
    println!("✅ Site generation completed successfully!");

    // If watch mode is enabled, start file watcher
    if watch {
        println!("\n👁️  Watch mode enabled. Monitoring for changes...");
        println!("Press Ctrl+C to stop.\n");
        watch_and_rebuild(&config)?;
    }

    Ok(())
}

fn print_usage(program_name: &str) {
    eprintln!("para-ssg - A static site generator for PARA-organized markdown documents");
    eprintln!();
    eprintln!("USAGE:");
    eprintln!("    {} [OPTIONS] <input_dir> <output_dir>", program_name);
    eprintln!();
    eprintln!("ARGS:");
    eprintln!("    <input_dir>     Directory containing PARA-organized markdown files");
    eprintln!("    <output_dir>    Directory where the static site will be generated");
    eprintln!();
    eprintln!("OPTIONS:");
    eprintln!("    -h, --help      Print help information");
    eprintln!("    -v, --verbose   Enable verbose output with detailed progress");
    eprintln!("    -w, --watch     Watch for file changes and rebuild automatically");
    eprintln!();
    eprintln!("EXAMPLES:");
    eprintln!("    {} ../context ./dist", program_name);
    eprintln!(
        "    {} --verbose /path/to/notes /var/www/html",
        program_name
    );
    eprintln!("    {} --watch ../context ./dist", program_name);
}

fn watch_and_rebuild(config: &Config) -> Result<(), ParaSsgError> {
    use notify::{Config as NotifyConfig, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
    use std::path::Path;

    let (tx, rx) = mpsc::channel();

    // Create a watcher
    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                // Only react to file modifications, creations, and deletions
                match event.kind {
                    EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                        // Filter for markdown files
                        for path in &event.paths {
                            if path.extension().and_then(|s| s.to_str()) == Some("md") {
                                let _ = tx.send(());
                                break;
                            }
                        }
                    }
                    _ => {}
                }
            }
        },
        NotifyConfig::default().with_poll_interval(Duration::from_secs(1)),
    )
    .map_err(|e| ParaSsgError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    // Watch the input directory
    watcher
        .watch(Path::new(&config.input_dir), RecursiveMode::Recursive)
        .map_err(|e| ParaSsgError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    // Keep track of last rebuild time to debounce rapid changes
    let mut last_rebuild = std::time::Instant::now();
    let debounce_duration = Duration::from_millis(500);

    loop {
        // Wait for file change events
        match rx.recv_timeout(Duration::from_secs(1)) {
            Ok(_) => {
                // Debounce rapid changes
                let now = std::time::Instant::now();
                if now.duration_since(last_rebuild) < debounce_duration {
                    continue;
                }
                last_rebuild = now;

                println!("\n🔄 Change detected, rebuilding...");
                match generate_site(config) {
                    Ok(_) => println!("✅ Rebuild completed successfully!"),
                    Err(e) => eprintln!("❌ Rebuild failed: {}", e),
                }
                println!("\n👁️  Watching for changes...");
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                // No events, continue watching
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                return Err(ParaSsgError::Io(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "File watcher disconnected",
                )));
            }
        }
    }
}
