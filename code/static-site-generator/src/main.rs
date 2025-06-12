//! ABOUTME: CLI entry point for para-ssg static site generator
//! ABOUTME: Handles command-line arguments and orchestrates the build process

use para_ssg::{generate_site, Config, ParaSsgError};
use std::env;
use std::process;

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
    let (verbose, remaining_args) = if args.contains(&"--verbose".to_string()) || args.contains(&"-v".to_string()) {
        (true, args.iter().filter(|a| *a != "--verbose" && *a != "-v").cloned().collect::<Vec<_>>())
    } else {
        (false, args)
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

    // Generate the site
    println!(
        "Building site from '{}' to '{}'",
        config.input_dir, config.output_dir
    );
    generate_site(&config)?;
    println!("✅ Site generation completed successfully!");

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
    eprintln!();
    eprintln!("EXAMPLES:");
    eprintln!("    {} ../context ./dist", program_name);
    eprintln!("    {} --verbose /path/to/notes /var/www/html", program_name);
}
