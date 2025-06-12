// ABOUTME: Screenshot tool for taking screenshots of para-ssg pages for Claude visual analysis
// ABOUTME: Provides desktop and mobile viewport screenshots with auto-serve capability

import puppeteer from 'puppeteer';
import express from 'express';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { createServer, Server } from 'http';

interface ScreenshotOptions {
  url?: string;
  permanent?: boolean;
  outputDir?: string;
  skipServer?: boolean;
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
  ): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2' });

    const filepath = join(this.tempDir, filename);
    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png',
    });

    await browser.close();
    return filepath;
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

      // Take both desktop and mobile screenshots
      const [desktopPath, mobilePath] = await Promise.all([
        this.takeScreenshot(url, { width: 1200, height: 800 }, `${baseFilename}-desktop.png`),
        this.takeScreenshot(url, { width: 375, height: 667 }, `${baseFilename}-mobile.png`),
      ]);

      // Read screenshot files as base64
      const [desktopBuffer, mobileBuffer] = await Promise.all([
        fs.readFile(desktopPath),
        fs.readFile(mobilePath),
      ]);

      const result = {
        content: [
          {
            type: 'text',
            text: `Screenshots taken of ${url}:`,
          },
          {
            type: 'image',
            data: desktopBuffer.toString('base64'),
            mimeType: 'image/png',
          },
          {
            type: 'text',
            text: 'Mobile view:',
          },
          {
            type: 'image',
            data: mobileBuffer.toString('base64'),
            mimeType: 'image/png',
          },
        ],
      };

      // Clean up temp files unless permanent
      if (!args.permanent) {
        await Promise.all([
          fs.unlink(desktopPath).catch(() => {}),
          fs.unlink(mobilePath).catch(() => {}),
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
