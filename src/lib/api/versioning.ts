import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseFormatter } from './response-formatter';

// Supported API versions
export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2', // Future versions
}

// Version configuration
export interface VersionConfig {
  version: ApiVersion;
  isDeprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  migrationGuide?: string;
  breaking?: boolean;
}

// Version registry
export class ApiVersionRegistry {
  private versions = new Map<ApiVersion, VersionConfig>();
  private defaultVersion: ApiVersion = ApiVersion.V1;

  constructor() {
    // Register supported versions
    this.registerVersion({
      version: ApiVersion.V1,
      isDeprecated: false,
    });
  }

  registerVersion(_config: VersionConfig): void {
    this.versions.set(config.version, config);
  }

  getVersion(version: ApiVersion): VersionConfig | undefined {
    return this.versions.get(version);
  }

  getAllVersions(): VersionConfig[] {
    return Array.from(this.versions.values());
  }

  isVersionSupported(version: string): boolean {
    return this.versions.has(version as ApiVersion);
  }

  isVersionDeprecated(version: ApiVersion): boolean {
    const config = this.versions.get(version);
    return config?.isDeprecated || false;
  }

  getDefaultVersion(): ApiVersion {
    return this.defaultVersion;
  }

  setDefaultVersion(version: ApiVersion): void {
    if (!this.isVersionSupported(version)) {
      throw new Error(`Version ${version} is not supported`);
    }
    this.defaultVersion = version;
  }

  getDeprecationInfo(version: ApiVersion): {
    isDeprecated: boolean;
    deprecationDate?: Date;
    sunsetDate?: Date;
    migrationGuide?: string;
  } | null {
    const config = this.versions.get(version);
    if (!config || !config.isDeprecated) {
      return null;
    }

    return {
      isDeprecated: true,
      deprecationDate: config.deprecationDate,
      sunsetDate: config.sunsetDate,
      migrationGuide: config.migrationGuide,
    };
  }
}

// Global version registry
export const versionRegistry = new ApiVersionRegistry();

// Version extraction utilities
export class ApiVersionExtractor {
  /**
   * Extract API version from request URL path
   */
  static fromPath(pathname: string): ApiVersion | null {
    const match = pathname.match(/^\/api\/(v\d+)\//);
    if (match && versionRegistry.isVersionSupported(match[1])) {
      return match[1] as ApiVersion;
    }
    return null;
  }

  /**
   * Extract API version from headers
   */
  static fromHeaders(_request: NextRequest): ApiVersion | null {
    // Check X-API-Version header
    const versionHeader =
      request.headers.get('X-API-Version') || request.headers.get('x-api-version');
    if (versionHeader && versionRegistry.isVersionSupported(versionHeader)) {
      return versionHeader as ApiVersion;
    }

    // Check Accept-Version header
    const acceptVersionHeader =
      request.headers.get('Accept-Version') || request.headers.get('accept-version');
    if (acceptVersionHeader && versionRegistry.isVersionSupported(acceptVersionHeader)) {
      return acceptVersionHeader as ApiVersion;
    }

    // Check Accept header for version (e.g., application/vnd.riscura.v1+json)
    const acceptHeader = request.headers.get('Accept');
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/application\/vnd\.riscura\.(v\d+)\+json/);
      if (versionMatch && versionRegistry.isVersionSupported(versionMatch[1])) {
        return versionMatch[1] as ApiVersion;
      }
    }

    return null;
  }

  /**
   * Extract API version from query parameters
   */
  static fromQueryParams(url: URL): ApiVersion | null {
    const versionParam = url.searchParams.get('version') || url.searchParams.get('api_version');
    if (versionParam && versionRegistry.isVersionSupported(versionParam)) {
      return versionParam as ApiVersion;
    }
    return null;
  }

  /**
   * Extract API version using multiple strategies
   */
  static extract(_request: NextRequest): ApiVersion {
    const url = new URL(request.url);

    // Priority order: URL path > Headers > Query params > Default
    return (
      this.fromPath(url.pathname) ||
      this.fromHeaders(request) ||
      this.fromQueryParams(url) ||
      versionRegistry.getDefaultVersion()
    );
  }
}

// Version validation
export class ApiVersionValidator {
  /**
   * Validate if the requested version is supported
   */
  static validate(version: string): {
    isValid: boolean;
    version?: ApiVersion;
    error?: string;
  } {
    if (!version) {
      return {
        isValid: true,
        version: versionRegistry.getDefaultVersion(),
      };
    }

    if (!versionRegistry.isVersionSupported(version)) {
      return {
        isValid: false,
        error: `API version '${version}' is not supported. Supported versions: ${versionRegistry
          .getAllVersions()
          .map((v) => v.version)
          .join(', ')}`,
      };
    }

    const apiVersion = version as ApiVersion;
    const config = versionRegistry.getVersion(apiVersion);

    // Check if version is past sunset date
    if (config?.sunsetDate && new Date() > config.sunsetDate) {
      return {
        isValid: false,
        error: `API version '${version}' has been sunset and is no longer available`,
      };
    }

    return {
      isValid: true,
      version: apiVersion,
    };
  }

  /**
   * Check for breaking changes between versions
   */
  static hasBreakingChanges(fromVersion: ApiVersion, toVersion: ApiVersion): boolean {
    const fromConfig = versionRegistry.getVersion(fromVersion);
    const toConfig = versionRegistry.getVersion(toVersion);

    // Simple logic: if target version is marked as breaking, there are breaking changes
    return toConfig?.breaking || false;
  }
}

// Version middleware
export class ApiVersionMiddleware {
  /**
   * Add version headers to response
   */
  static addVersionHeaders(
    _response: NextResponse,
    version: ApiVersion,
    options: {
      includeDeprecationWarning?: boolean;
      includeSupportedVersions?: boolean;
    } = {}
  ): NextResponse {
    // Add current version header
    response.headers.set('X-API-Version', version);
    response.headers.set('X-API-Current-Version', versionRegistry.getDefaultVersion());

    // Add supported versions header
    if (options.includeSupportedVersions) {
      const supportedVersions = versionRegistry
        .getAllVersions()
        .filter((v) => !v.sunsetDate || new Date() < v.sunsetDate)
        .map((v) => v.version)
        .join(', ');
      response.headers.set('X-API-Supported-Versions', supportedVersions);
    }

    // Add deprecation warning if applicable
    if (options.includeDeprecationWarning) {
      const deprecationInfo = versionRegistry.getDeprecationInfo(version);
      if (deprecationInfo) {
        response.headers.set('X-API-Deprecated', 'true');

        if (deprecationInfo.deprecationDate) {
          response.headers.set(
            'X-API-Deprecation-Date',
            deprecationInfo.deprecationDate.toISOString()
          );
        }

        if (deprecationInfo.sunsetDate) {
          response.headers.set('X-API-Sunset-Date', deprecationInfo.sunsetDate.toISOString());
        }

        if (deprecationInfo.migrationGuide) {
          response.headers.set('X-API-Migration-Guide', deprecationInfo.migrationGuide);
        }

        // Add Warning header as per RFC 7234
        const warningMessage = `299 - "API version ${version} is deprecated"`;
        response.headers.set('Warning', warningMessage);
      }
    }

    return response;
  }

  /**
   * Handle version negotiation
   */
  static async negotiateVersion(_request: NextRequest): Promise<{
    success: boolean;
    version?: ApiVersion;
    response?: NextResponse;
  }> {
    try {
      const requestedVersion = ApiVersionExtractor.extract(request);
      const validation = ApiVersionValidator.validate(requestedVersion);

      if (!validation.isValid) {
        return {
          success: false,
          response: ApiResponseFormatter.error('UNSUPPORTED_VERSION', validation.error!, {
            status: 400,
            requestId: ApiResponseFormatter.getOrCreateRequestId(request),
          }),
        };
      }

      return {
        success: true,
        version: validation.version!,
      };
    } catch (error) {
      return {
        success: false,
        response: ApiResponseFormatter.serverError('Version negotiation failed', {
          requestId: ApiResponseFormatter.getOrCreateRequestId(request),
        }),
      };
    }
  }
}

// Version-aware response formatter
export class VersionedResponseFormatter {
  /**
   * Create versioned success response
   */
  static success<T>(
    _data: T,
    version: ApiVersion,
    options: Parameters<typeof ApiResponseFormatter.success>[1] = {}
  ) {
    const response = ApiResponseFormatter.success(data, {
      ...options,
      version,
    });

    return ApiVersionMiddleware.addVersionHeaders(response, version, {
      includeDeprecationWarning: true,
      includeSupportedVersions: false,
    });
  }

  /**
   * Create versioned error response
   */
  static error(
    code: string,
    message: string,
    version: ApiVersion,
    options: Parameters<typeof ApiResponseFormatter.error>[2] = {}
  ) {
    const response = ApiResponseFormatter.error(code, message, {
      ...options,
      version,
    });

    return ApiVersionMiddleware.addVersionHeaders(response, version, {
      includeDeprecationWarning: true,
      includeSupportedVersions: true,
    });
  }

  /**
   * Create versioned paginated response
   */
  static paginated<T>(
    _data: T[],
    pagination: Parameters<typeof ApiResponseFormatter.paginated>[1],
    version: ApiVersion,
    options: Parameters<typeof ApiResponseFormatter.paginated>[2] = {}
  ) {
    const response = ApiResponseFormatter.paginated(data, pagination, {
      ...options,
      version,
    });

    return ApiVersionMiddleware.addVersionHeaders(response, version, {
      includeDeprecationWarning: true,
      includeSupportedVersions: false,
    });
  }
}

// Utility functions
export function withVersioning<T extends any[], R>(
  handler: (version: ApiVersion, ...args: T) => Promise<R>
) {
  return async (_request: NextRequest, ...args: T): Promise<R> => {
    const negotiation = await ApiVersionMiddleware.negotiateVersion(request);

    if (!negotiation.success) {
      throw new Error('Version negotiation failed');
    }

    return handler(negotiation.version!, request, ...args);
  };
}

export function getApiVersionFromRequest(_request: NextRequest): ApiVersion {
  return ApiVersionExtractor.extract(request);
}

export function isVersionDeprecated(version: ApiVersion): boolean {
  return versionRegistry.isVersionDeprecated(version);
}

export function getSupportedVersions(): ApiVersion[] {
  return versionRegistry
    .getAllVersions()
    .filter((v) => !v.sunsetDate || new Date() < v.sunsetDate)
    .map((v) => v.version);
}

// Version-specific feature flags
export interface VersionFeatures {
  enhancedValidation?: boolean;
  bulkOperations?: boolean;
  advancedFiltering?: boolean;
  realTimeUpdates?: boolean;
  enhancedSecurity?: boolean;
}

export class VersionFeatureManager {
  private features = new Map<ApiVersion, VersionFeatures>();

  constructor() {
    // Define features for each version
    this.features.set(ApiVersion.V1, {
      enhancedValidation: true,
      bulkOperations: true,
      advancedFiltering: true,
      realTimeUpdates: false,
      enhancedSecurity: true,
    });
  }

  getFeatures(version: ApiVersion): VersionFeatures {
    return this.features.get(version) || {};
  }

  isFeatureEnabled(version: ApiVersion, feature: keyof VersionFeatures): boolean {
    const features = this.getFeatures(version);
    return features[feature] || false;
  }

  setFeatures(version: ApiVersion, features: VersionFeatures): void {
    this.features.set(version, features);
  }
}

export const versionFeatureManager = new VersionFeatureManager();

// Migration utilities
export interface MigrationRule {
  fromVersion: ApiVersion;
  toVersion: ApiVersion;
  transform: (_data: any) => any;
}

export class VersionMigrationManager {
  private migrations = new Map<string, MigrationRule>();

  addMigration(rule: MigrationRule): void {
    const key = `${rule.fromVersion}->${rule.toVersion}`;
    this.migrations.set(key, rule);
  }

  migrate(_data: any, fromVersion: ApiVersion, toVersion: ApiVersion): any {
    const key = `${fromVersion}->${toVersion}`;
    const migration = this.migrations.get(key);

    if (migration) {
      return migration.transform(data);
    }

    // No migration needed or available
    return data;
  }

  hasMigration(fromVersion: ApiVersion, toVersion: ApiVersion): boolean {
    const key = `${fromVersion}->${toVersion}`;
    return this.migrations.has(key);
  }
}

export const versionMigrationManager = new VersionMigrationManager();
