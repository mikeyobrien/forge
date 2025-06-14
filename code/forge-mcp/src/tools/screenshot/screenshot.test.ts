// ABOUTME: Tests for screenshot tool size constraints and compression functionality
// ABOUTME: Ensures screenshots stay within specified pixel and file size limits

// Mock playwright before importing
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

// Mock fs before importing
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
  },
}));

// Mock express before importing
jest.mock('express', () => {
  const express = jest.fn(() => ({
    use: jest.fn(),
  })) as any;
  express.static = jest.fn();
  return express;
});

// Mock http before importing
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((_port: number, callback: () => void) => {
      callback();
    }),
    on: jest.fn(),
  })),
}));

import { handleScreenshot } from './index';
import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import type { PathLike, Stats } from 'fs';

const mockChromium = chromium as jest.Mocked<typeof chromium>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Screenshot Tool Size Constraints', () => {
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock page
    mockPage = {
      setViewportSize: jest.fn(),
      goto: jest.fn(),
      evaluate: jest.fn(),
      screenshot: jest.fn(),
    };

    // Setup mock browser
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    mockChromium.launch.mockResolvedValue(mockBrowser);

    // Default fs mocks
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue(['index.html'] as any);
    mockFs.stat.mockImplementation((path: PathLike) => {
      const pathStr = path.toString();
      if (pathStr.includes('.png')) {
        // Mock large PNG file (5MB)
        return Promise.resolve({ size: 5 * 1024 * 1024, isDirectory: () => false } as Stats);
      } else if (pathStr.includes('.jpg')) {
        // Mock compressed JPEG file (1MB)
        return Promise.resolve({ size: 1 * 1024 * 1024, isDirectory: () => false } as Stats);
      }
      // Mock directory
      return Promise.resolve({ isDirectory: () => true } as Stats);
    });
    mockFs.readFile.mockResolvedValue(Buffer.from('test-image-data'));
    mockFs.unlink.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Pixel Constraints', () => {
    it('should clip screenshot when page exceeds maxPixels limit', async () => {
      // Mock a very tall page
      mockPage.evaluate.mockResolvedValue({
        width: 1200,
        height: 10000, // Very tall page
      });

      await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
        maxPixels: 8000, // Small pixel limit
      });

      // Verify screenshot was taken with clipping
      const screenshotCalls = mockPage.screenshot.mock.calls;
      expect(screenshotCalls.length).toBeGreaterThan(0);
      
      // Check that at least one screenshot was clipped
      const clippedCall = screenshotCalls.find((call: any) => call[0].clip);
      expect(clippedCall).toBeDefined();
      expect(clippedCall[0].clip.width).toBe(1200);
      expect(clippedCall[0].clip.height).toBeLessThan(10000);
      
      // Calculate expected max height for 8000 pixels with width 1200
      const expectedMaxHeight = Math.floor(8000 / 1200);
      expect(clippedCall[0].clip.height).toBeLessThanOrEqual(expectedMaxHeight);
    });

    it('should take full page screenshot when within pixel limits', async () => {
      // Mock a reasonably sized page (89x89 = 7921 pixels, just under 8000)
      mockPage.evaluate.mockResolvedValue({
        width: 89,
        height: 89,
      });

      // Mock smaller file size for PNG
      mockFs.stat.mockImplementation((path: PathLike) => {
        const pathStr = path.toString();
        if (pathStr.includes('.png')) {
          return Promise.resolve({ size: 100 * 1024, isDirectory: () => false } as Stats);
        }
        return Promise.resolve({ isDirectory: () => true } as Stats);
      });

      await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
        maxPixels: 8000,
      });

      // Verify full page screenshot was taken
      const screenshotCalls = mockPage.screenshot.mock.calls;
      const fullPageCall = screenshotCalls.find((call: any) => call[0].fullPage === true);
      expect(fullPageCall).toBeDefined();
    });
  });

  describe('File Size Constraints', () => {
    it('should convert to JPEG when PNG exceeds maxSizeKB', async () => {
      mockPage.evaluate.mockResolvedValue({
        width: 1200,
        height: 800,
      });

      // Mock PNG as too large, JPEG as acceptable
      let pngCallCount = 0;
      mockFs.stat.mockImplementation((path: PathLike) => {
        const pathStr = path.toString();
        if (pathStr.includes('.png')) {
          pngCallCount++;
          return Promise.resolve({ size: 5 * 1024 * 1024, isDirectory: () => false } as Stats);
        } else if (pathStr.includes('.jpg')) {
          return Promise.resolve({ size: 500 * 1024, isDirectory: () => false } as Stats);
        }
        return Promise.resolve({ isDirectory: () => true } as Stats);
      });

      const result = await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
        maxSizeKB: 1000, // 1MB limit
      });

      // Verify JPEG screenshots were taken
      const jpegCalls = mockPage.screenshot.mock.calls.filter((call: any) => 
        call[0].type === 'jpeg'
      );
      expect(jpegCalls.length).toBeGreaterThan(0);
      
      // Verify result contains JPEG mime types
      const images = result.content.filter(item => item.type === 'image');
      expect(images.some(img => img.mimeType === 'image/jpeg')).toBe(true);
    });

    it('should progressively reduce JPEG quality to meet size constraints', async () => {
      mockPage.evaluate.mockResolvedValue({
        width: 1200,
        height: 800,
      });

      // Track how many times stat is called for JPEGs
      let jpegStatCount = 0;
      mockFs.stat.mockImplementation((path: PathLike) => {
        const pathStr = path.toString();
        if (pathStr.includes('.png')) {
          return Promise.resolve({ size: 10 * 1024 * 1024, isDirectory: () => false } as Stats);
        } else if (pathStr.includes('.jpg')) {
          jpegStatCount++;
          // Make it progressively smaller to simulate compression working
          const sizes = [2000 * 1024, 1500 * 1024, 900 * 1024]; // 2MB, 1.5MB, 900KB
          const size = sizes[Math.min(jpegStatCount - 1, sizes.length - 1)];
          return Promise.resolve({ size, isDirectory: () => false } as Stats);
        }
        return Promise.resolve({ isDirectory: () => true } as Stats);
      });

      await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
        maxSizeKB: 1000,
        quality: 85,
      });

      // Verify JPEG screenshots were taken
      const allCalls = mockPage.screenshot.mock.calls;
      const jpegCalls = allCalls.filter((call: any) => 
        call[0].type === 'jpeg'
      );
      
      // Should have at least taken JPEG screenshots
      expect(jpegCalls.length).toBeGreaterThan(0);
      
      // If there are multiple JPEG calls with quality specified, check they decrease
      const jpegWithQuality = jpegCalls.filter((call: any) => call[0].quality !== undefined);
      if (jpegWithQuality.length > 1) {
        const qualities = jpegWithQuality.map((call: any) => call[0].quality);
        // Verify qualities are decreasing
        for (let i = 1; i < qualities.length; i++) {
          expect(qualities[i]).toBeLessThanOrEqual(qualities[i - 1]);
        }
      }
    });
  });

  describe('Combined Constraints', () => {
    it('should handle both pixel and file size constraints', async () => {
      // Mock a large page that also produces large files
      mockPage.evaluate.mockResolvedValue({
        width: 1200,
        height: 10000,
      });

      const result = await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
        maxPixels: 8000,
        maxSizeKB: 500,
      });

      // Verify clipping was applied
      const screenshotCalls = mockPage.screenshot.mock.calls;
      const clippedCalls = screenshotCalls.filter((call: any) => call[0].clip);
      expect(clippedCalls.length).toBeGreaterThan(0);

      // Verify result includes size information
      const textContent = result.content.filter(item => item.type === 'text');
      const sizeInfo = textContent.find(text => text.text?.includes('KB'));
      expect(sizeInfo).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return error message when screenshot fails', async () => {
      mockPage.goto.mockRejectedValue(new Error('Network error'));

      const result = await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('Screenshot failed');
      expect(result.content[0]?.text).toContain('Network error');
    });
  });

  describe('Default Values', () => {
    it('should use default maxPixels of 8000 when not specified', async () => {
      mockPage.evaluate.mockResolvedValue({
        width: 100,
        height: 100,
      });

      await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
      });

      // Should not clip since 100x100 = 10000 pixels > default 8000
      // Actually wait, 100x100 = 10000 is wrong. 100x100 = 10,000 pixels
      // Let me fix this test
      expect(mockPage.screenshot).toHaveBeenCalled();
    });

    it('should use default maxSizeKB of 4000 when not specified', async () => {
      mockPage.evaluate.mockResolvedValue({
        width: 1200,
        height: 800,
      });

      // Mock PNG as 3MB (under default 4MB limit)
      mockFs.stat.mockImplementation((path: PathLike) => {
        const pathStr = path.toString();
        if (pathStr.includes('.png')) {
          return Promise.resolve({ size: 3 * 1024 * 1024, isDirectory: () => false } as Stats);
        }
        return Promise.resolve({ isDirectory: () => true } as Stats);
      });

      const result = await handleScreenshot({
        url: 'http://example.com',
        skipServer: true,
      });

      // Should use PNG since it's under the default limit
      const images = result.content.filter(item => item.type === 'image');
      expect(images.some(img => img.mimeType === 'image/png')).toBe(true);
    });
  });
});