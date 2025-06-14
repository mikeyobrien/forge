// ABOUTME: Screenshot tool for taking screenshots of para-ssg pages for Claude visual analysis
// ABOUTME: Provides desktop and mobile viewport screenshots with auto-serve capability

import { chromium } from 'playwright';
import express from 'express';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { createServer, Server } from 'http';

interface ScreenshotOptions {
  url?: string;
  permanent?: boolean;
  outputDir?: string;
  skipServer?: boolean;
  maxSizeKB?: number; // Maximum size in KB for each screenshot
  quality?: number; // JPEG quality (0-100) if compression needed
  maxPixels?: number; // Maximum total pixels (width * height)
}

interface ScreenshotResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  [key: string]: unknown;
}

export const screenshotTool = {
  name: 'screenshot_page',
  description: 'Take desktop and mobile screenshots of a webpage',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to screenshot (defaults to localhost:3000)',
      },
      permanent: {
        type: 'boolean',
        description: 'Keep screenshots permanently (default: false)',
        default: false,
      },
      outputDir: {
        type: 'string',
        description: 'Directory to serve static files from (auto-detects para-ssg output)',
      },
      skipServer: {
        type: 'boolean',
        description: 'Skip starting the static server (use when URL points to existing server)',
        default: false,
      },
      maxSizeKB: {
        type: 'number',
        description: 'Maximum size in KB for each screenshot (default: 4000KB)',
        default: 4000,
      },
      quality: {
        type: 'number',
        description: 'JPEG quality (0-100) if compression needed (default: 85)',
        default: 85,
        minimum: 0,
        maximum: 100,
      },
      maxPixels: {
        type: 'number',
        description: 'Maximum total pixels (width * height) per screenshot (default: 8000)',
        default: 8000,
      },
    },
    required: [],
  },
};

class ScreenshotService {
  private staticServer: Server | null = null;
  private staticPort: number = 3000;
  private tempDir: string = '/tmp/mcp-screenshots';

  constructor() {
    void this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  private async findParaSsgOutput(): Promise<string | null> {
    const possiblePaths = ['dist', 'dist-optimized', 'test-output', 'build', 'public', '_site'];

    // Check current directory and parent directories
    const searchDirs = [process.cwd(), resolve(process.cwd(), '..')];

    for (const searchDir of searchDirs) {
      for (const path of possiblePaths) {
        try {
          const fullPath = resolve(searchDir, path);
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            const files = await fs.readdir(fullPath);
            if (files.includes('index.html')) {
              return fullPath;
            }
          }
        } catch {
          // Path doesn't exist, continue
        }
      }
    }
    return null;
  }

  private async startStaticServer(outputDir?: string): Promise<number> {
    if (this.staticServer) {
      return this.staticPort;
    }

    let dir: string;
    if (outputDir) {
      // Handle both absolute and relative paths
      dir = resolve(outputDir.startsWith('/') ? outputDir : resolve(process.cwd(), outputDir));
    } else {
      const foundDir = await this.findParaSsgOutput();
      if (!foundDir) {
        throw new Error(
          'No para-ssg output directory found. Please specify outputDir or ensure build exists.',
        );
      }
      dir = foundDir;
    }

    // Verify directory exists and has index.html
    try {
      const stats = await fs.stat(dir);
      if (!stats.isDirectory()) {
        throw new Error(`Output directory is not a directory: ${dir}`);
      }
      const files = await fs.readdir(dir);
      if (!files.includes('index.html')) {
        throw new Error(`No index.html found in directory: ${dir}`);
      }
    } catch (error) {
      throw new Error(
        `Invalid output directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    const app = express();
    app.use(express.static(dir));

    return new Promise((resolve, reject) => {
      const server = createServer(app);
      server.listen(this.staticPort, () => {
        this.staticServer = server;
        console.error(`Static server started on port ${this.staticPort}, serving: ${dir}`);
        resolve(this.staticPort);
      });
      server.on('error', reject);
    });
  }

  private async takeScreenshot(
    url: string,
    viewport: { width: number; height: number },
    filename: string,
    maxSizeKB: number,
    quality: number,
    maxPixels: number,
  ): Promise<{ path: string; size: number }> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewportSize(viewport);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Get page dimensions
    const dimensions = await page.evaluate(`
      (() => {
        return {
          width: document.documentElement.scrollWidth || 0,
          height: document.documentElement.scrollHeight || 0
        };
      })()
    `) as { width: number; height: number };

    // Calculate if we need to resize based on pixel constraints
    let screenshotOptions: any = {
      type: 'png',
      fullPage: true,
    };

    // Check if full page exceeds max pixels
    const fullPagePixels = dimensions.width * dimensions.height;
    if (fullPagePixels > maxPixels) {
      // Calculate maximum height that fits within pixel constraint
      const maxHeight = Math.floor(maxPixels / viewport.width);
      screenshotOptions = {
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: viewport.width,
          height: Math.min(maxHeight, dimensions.height),
        },
      };
    }

    // First try PNG with calculated options
    const pngPath = join(this.tempDir, filename);
    screenshotOptions.path = pngPath;
    await page.screenshot(screenshotOptions);

    // Check PNG size
    const pngStats = await fs.stat(pngPath);
    const pngSizeKB = pngStats.size / 1024;

    if (pngSizeKB <= maxSizeKB) {
      await browser.close();
      return { path: pngPath, size: pngSizeKB };
    }

    // If PNG is too large, try JPEG with compression
    const jpegFilename = filename.replace('.png', '.jpg');
    const jpegPath = join(this.tempDir, jpegFilename);
    
    // Try different quality levels to fit within size limit
    let currentQuality = quality;
    let jpegSizeKB = pngSizeKB;
    
    // Update screenshot options for JPEG
    screenshotOptions.type = 'jpeg';
    screenshotOptions.path = jpegPath;
    delete screenshotOptions.fullPage; // Remove if clipping
    
    while (currentQuality > 10 && jpegSizeKB > maxSizeKB) {
      screenshotOptions.quality = currentQuality;
      await page.screenshot(screenshotOptions);
      
      const jpegStats = await fs.stat(jpegPath);
      jpegSizeKB = jpegStats.size / 1024;
      
      if (jpegSizeKB <= maxSizeKB) {
        // Clean up PNG file
        await fs.unlink(pngPath).catch(() => {});
        await browser.close();
        return { path: jpegPath, size: jpegSizeKB };
      }
      
      // Reduce quality for next iteration
      currentQuality -= 10;
    }

    // If still too large, clip the screenshot instead of full page
    // Note: dimensions already calculated above

    // Calculate max height that would fit in size limit
    // Rough estimate: assume linear relationship between pixels and file size
    const pixelRatio = (maxSizeKB * 1024) / (dimensions.width * dimensions.height);
    const maxHeight = Math.floor(Math.sqrt((maxSizeKB * 1024) / pixelRatio / viewport.width) * viewport.width);
    
    await page.screenshot({
      path: jpegPath,
      clip: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: Math.min(maxHeight, dimensions.height),
      },
      type: 'jpeg',
      quality: quality,
    });

    const finalStats = await fs.stat(jpegPath);
    const finalSizeKB = finalStats.size / 1024;

    // Clean up PNG file
    await fs.unlink(pngPath).catch(() => {});
    await browser.close();
    
    return { path: jpegPath, size: finalSizeKB };
  }

  async screenshot(args: ScreenshotOptions): Promise<ScreenshotResult> {
    try {
      let url: string;

      if (args.skipServer && args.url) {
        // Use provided URL directly without starting server
        url = args.url;
      } else {
        // Start static server if needed
        const port = await this.startStaticServer(args.outputDir);
        url = args.url || `http://localhost:${port}`;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = `screenshot-${timestamp}`;
      
      // Use default values if not provided
      const maxSizeKB = args.maxSizeKB || 4000; // 4MB default per image
      const quality = args.quality || 85;
      const maxPixels = args.maxPixels || 8000; // 8000 pixels total default

      // Take both desktop and mobile screenshots
      const [desktopResult, mobileResult] = await Promise.all([
        this.takeScreenshot(url, { width: 1200, height: 800 }, `${baseFilename}-desktop.png`, maxSizeKB, quality, maxPixels),
        this.takeScreenshot(url, { width: 375, height: 667 }, `${baseFilename}-mobile.png`, maxSizeKB, quality, maxPixels),
      ]);

      // Read screenshot files as base64
      const [desktopBuffer, mobileBuffer] = await Promise.all([
        fs.readFile(desktopResult.path),
        fs.readFile(mobileResult.path),
      ]);

      // Calculate total size and ensure it's within limits
      const totalSizeKB = desktopResult.size + mobileResult.size;
      const desktopMimeType = desktopResult.path.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
      const mobileMimeType = mobileResult.path.endsWith('.jpg') ? 'image/jpeg' : 'image/png';

      const result = {
        content: [
          {
            type: 'text',
            text: `Screenshots taken of ${url} (Total size: ${totalSizeKB.toFixed(1)}KB):`,
          },
          {
            type: 'image',
            data: desktopBuffer.toString('base64'),
            mimeType: desktopMimeType,
          },
          {
            type: 'text',
            text: `Mobile view (${mobileResult.size.toFixed(1)}KB):`,
          },
          {
            type: 'image',
            data: mobileBuffer.toString('base64'),
            mimeType: mobileMimeType,
          },
        ],
      };

      // Clean up temp files unless permanent
      if (!args.permanent) {
        await Promise.all([
          fs.unlink(desktopResult.path).catch(() => {}),
          fs.unlink(mobileResult.path).catch(() => {}),
        ]);
      }

      return result;
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
}

const screenshotService = new ScreenshotService();

export async function handleScreenshot(args: ScreenshotOptions): Promise<ScreenshotResult> {
  return await screenshotService.screenshot(args);
}
