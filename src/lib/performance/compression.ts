import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

export class CompressionService {
  private compressionStats = new Map<string, CompressionStats>();

  // API Response Compression
  async compressAPIResponse(_data: any,
    encoding: CompressionEncoding = 'gzip',
    threshold = 1024
  ): Promise<CompressionResult> {
    const startTime = Date.now()

    try {
      const jsonString = JSON.stringify(data);
      const originalSize = Buffer.byteLength(jsonString, 'utf8');

      // Skip compression for small responses
      if (originalSize < threshold) {
        return {
          compressed: false,
          data: jsonString,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 0,
          encoding: 'none',
          duration: Date.now() - startTime,
        }
      }

      let compressed: Buffer;

      switch (encoding) {
        case 'gzip':
          compressed = await gzip(jsonString, { level: 6 });
          break;
        case 'br':
          compressed = await brotliCompress(jsonString, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
            },
          });
          break;
        case 'deflate':
          compressed = await promisify(zlib.deflate)(jsonString);
          break;
        default:
          throw new Error(`Unsupported encoding: ${encoding}`);
      }

      const compressedSize = compressed.byteLength;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      this.recordStats(encoding, originalSize, compressedSize, Date.now() - startTime);

      return {
        compressed: true,
        data: compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        encoding,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      // console.error('Compression error:', error)
      return {
        compressed: false,
        data: data,
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        encoding: 'none',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Decompress Data
  async decompressData(_data: Buffer, encoding: CompressionEncoding): Promise<string> {
    try {
      let decompressed: Buffer

      switch (encoding) {
        case 'gzip':
          decompressed = await gunzip(data);
          break;
        case 'br':
          decompressed = await brotliDecompress(data);
          break;
        case 'deflate':
          decompressed = await promisify(zlib.inflate)(data);
          break;
        default:
          throw new Error(`Unsupported encoding: ${encoding}`);
      }

      return decompressed.toString('utf8');
    } catch (error) {
      throw new Error(
        `Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Static Asset Compression
  async compressStaticAsset(
    filePath: string,
    outputPath: string,
    encoding: CompressionEncoding = 'gzip'
  ): Promise<CompressionResult> {
    const fs = await import('fs/promises')
    const startTime = Date.now();

    try {
      const fileData = await fs.readFile(filePath);
      const originalSize = fileData.byteLength;

      let compressed: Buffer;

      switch (encoding) {
        case 'gzip':
          compressed = await gzip(fileData, { level: 9 }); // Max compression for static assets
          break;
        case 'br':
          compressed = await brotliCompress(fileData, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Max quality for static assets
            },
          });
          break;
        default:
          throw new Error(`Unsupported encoding for static assets: ${encoding}`);
      }

      await fs.writeFile(outputPath, compressed);

      const compressedSize = compressed.byteLength;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      return {
        compressed: true,
        data: compressed,
        originalSize,
        compressedSize,
        compressionRatio,
        encoding,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      return {
        compressed: false,
        data: Buffer.alloc(0),
        originalSize: 0,
        compressedSize: 0,
        compressionRatio: 0,
        encoding: 'none',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Batch Compression
  async compressBatch(
    items: Array<{ id: string; data: any }>,
    encoding: CompressionEncoding = 'gzip'
  ): Promise<Array<{ id: string; result: CompressionResult }>> {
    const results = await Promise.all(
      items.map(async ({ id, data }) => ({
        id,
        result: await this.compressAPIResponse(data, encoding),
      }))
    );

    return results;
  }

  // Stream Compression
  createCompressionStream(encoding: CompressionEncoding = 'gzip'): NodeJS.ReadWriteStream {
    switch (encoding) {
      case 'gzip':
        return zlib.createGzip({ level: 6 })
      case 'br':
        return zlib.createBrotliCompress({
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
          },
        });
      case 'deflate':
        return zlib.createDeflate();
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
  }

  createDecompressionStream(encoding: CompressionEncoding): NodeJS.ReadWriteStream {
    switch (encoding) {
      case 'gzip':
        return zlib.createGunzip();
      case 'br':
        return zlib.createBrotliDecompress();
      case 'deflate':
        return zlib.createInflate();
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
  }

  // Compression Statistics
  private recordStats(
    encoding: string,
    originalSize: number,
    compressedSize: number,
    duration: number
  ): void {
    const existing = this.compressionStats.get(encoding) || {
      totalOperations: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalDuration: 0,
      averageCompressionRatio: 0,
    }

    existing.totalOperations++;
    existing.totalOriginalSize += originalSize;
    existing.totalCompressedSize += compressedSize;
    existing.totalDuration += duration;
    existing.averageCompressionRatio =
      ((existing.totalOriginalSize - existing.totalCompressedSize) / existing.totalOriginalSize) *
      100;

    this.compressionStats.set(encoding, existing);
  }

  getStats(): Record<string, CompressionStats> {
    const stats: Record<string, CompressionStats> = {}

    for (const [encoding, stat] of this.compressionStats) {
      stats[encoding] = { ...stat }
    }

    return stats;
  }

  // Optimal Encoding Selection
  async selectOptimalEncoding(_data: any,
    acceptedEncodings: CompressionEncoding[]
  ): Promise<CompressionEncoding> {
    if (acceptedEncodings.length === 0) {
      return 'gzip'; // Default fallback
    }

    if (acceptedEncodings.length === 1) {
      return acceptedEncodings[0];
    }

    // Test each encoding and select the best
    const results = await Promise.all(
      acceptedEncodings.map(async (encoding) => ({
        encoding,
        result: await this.compressAPIResponse(data, encoding),
      }))
    )

    // Select encoding with best compression ratio
    const best = results.reduce((prev, current) =>
      current.result.compressionRatio > prev.result.compressionRatio ? current : prev
    )

    return best.encoding;
  }

  // Content-Type specific compression
  shouldCompress(contentType: string, size: number): boolean {
    // Don't compress already compressed formats
    const incompressibleTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip',
      'application/pdf',
    ]

    if (incompressibleTypes.some((type) => contentType.includes(type))) {
      return false;
    }

    // Don't compress tiny responses
    if (size < 1024) {
      return false
    }

    // Compress text-based content
    const compressibleTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/x-javascript',
      'application/svg+xml',
    ]

    return compressibleTypes.some((type) => contentType.includes(type));
  }

  // Health check
  async healthCheck(): Promise<CompressionHealthCheck> {
    try {
      const testData = { test: 'health check data'.repeat(100) }
      const _result = await this.compressAPIResponse(testData, 'gzip');

      return {
        healthy: result.compressed && result.compressionRatio > 0,
        latency: result.duration,
        message: 'Compression service operational',
        stats: this.getStats(),
      }
    } catch (error) {
      return {
        healthy: false,
        latency: -1,
        message: error instanceof Error ? error.message : 'Compression error',
      }
    }
  }
}

// Types
export type CompressionEncoding = 'gzip' | 'br' | 'deflate' | 'none'

export interface CompressionResult {
  compressed: boolean;
  data: Buffer | string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  encoding: CompressionEncoding;
  duration: number;
  error?: string;
}

export interface CompressionStats {
  totalOperations: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalDuration: number;
  averageCompressionRatio: number;
}

export interface CompressionHealthCheck {
  healthy: boolean;
  latency: number;
  message: string;
  stats?: Record<string, CompressionStats>;
}

// Middleware for Express/Next.js
export function compressionMiddleware(_options: CompressionOptions = {}) {
  const service = new CompressionService()

  return async (req: any, res: any, next: any) => {
    // Check if compression is acceptable
    const acceptedEncodings = parseAcceptEncoding(req.headers['accept-encoding'] || '')
    if (acceptedEncodings.length === 0) {
      return next();
    }

    // Store original send method
    const originalSend = res.send

    // Override send method
    res.send = async function (_data: any) {
      // Check if should compress
      const contentType = res.get('Content-Type') || 'text/html'
      const shouldCompress = service.shouldCompress(contentType, Buffer.byteLength(data));

      if (!shouldCompress) {
        return originalSend.call(res, data);
      }

      try {
        // Select optimal encoding
        const encoding = await service.selectOptimalEncoding(data, acceptedEncodings)

        // Compress data
        const _result = await service.compressAPIResponse(data, encoding, options.threshold)

        if (result.compressed) {
          res.set('Content-Encoding', encoding);
          res.set('Vary', 'Accept-Encoding');
          return originalSend.call(res, result.data);
        }
      } catch (error) {
        // console.error('Compression middleware error:', error)
      }

      // Fallback to uncompressed
      return originalSend.call(res, data)
    }

    next();
  }
}

// Utility functions
const parseAcceptEncoding = (acceptEncoding: string): CompressionEncoding[] {
  const encodings: CompressionEncoding[] = []

  if (acceptEncoding.includes('br')) encodings.push('br');
  if (acceptEncoding.includes('gzip')) encodings.push('gzip');
  if (acceptEncoding.includes('deflate')) encodings.push('deflate');

  return encodings;
}

export interface CompressionOptions {
  threshold?: number;
  level?: number;
  memLevel?: number;
  strategy?: number;
}

// Global compression service instance
export const compressionService = new CompressionService()
