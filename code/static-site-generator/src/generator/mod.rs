//! ABOUTME: Site generation module for HTML output and asset creation
//! ABOUTME: Orchestrates the creation of static website files

pub mod assets;
pub mod backlinks;
pub mod html;
pub mod search;

pub use assets::*;
pub use backlinks::*;
pub use html::*;
pub use search::*;
