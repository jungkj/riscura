import { Client } from '@microsoft/microsoft-graph-client';
import { DriveItem, Site, Drive } from '@microsoft/microsoft-graph-types';
import { getSharePointAuthService } from './auth.service';
import { SharePointSiteInfo } from '@/types/sharepoint';

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  modifiedDate: Date;
  downloadUrl?: string;
  webUrl?: string;
  mimeType?: string;
  path?: string;
}

export class SharePointFileService {
  private graphClient: Client | null = null;

  /**
   * Initialize with Graph client
   */
  private async ensureClient(): Promise<Client> {
    if (!this.graphClient) {
      const authService = getSharePointAuthService();
      this.graphClient = await authService.getGraphClient();
    }
    return this.graphClient;
  }

  /**
   * Get site information
   */
  async getSiteInfo(siteId: string): Promise<SharePointSiteInfo> {
    try {
      const client = await this.ensureClient();
      const site: Site = await client
        .api(`/sites/${siteId}`)
        .select('id,displayName,webUrl,description')
        .get();

      // Validate required fields
      if (!site.id || !site.displayName || !site.webUrl) {
        throw new Error(
          `Incomplete site data received from Graph API. Missing required fields: ${[
            !site.id && 'id',
            !site.displayName && 'displayName',
            !site.webUrl && 'webUrl',
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      return {
        id: site.id,
        displayName: site.displayName,
        webUrl: site.webUrl,
        description: site.description || undefined,
      };
    } catch (error) {
      // console.error('Error fetching site info:', error)
      throw new Error('Failed to fetch SharePoint site information');
    }
  }

  /**
   * Get site by URL
   */
  async getSiteByUrl(siteUrl: string): Promise<SharePointSiteInfo> {
    try {
      const client = await this.ensureClient();

      // Parse the site URL to get hostname and site path
      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      // Use Graph API search to find the site
      const searchPath = sitePath.startsWith('/sites/')
        ? `${hostname}:${sitePath}`
        : `${hostname}:/sites/${sitePath.replace(/^\//, '')}`;

      const site: Site = await client
        .api(`/sites/${searchPath}`)
        .select('id,displayName,webUrl,description')
        .get();

      // Validate required fields
      if (!site.id || !site.displayName || !site.webUrl) {
        throw new Error(
          `Incomplete site data received from Graph API. Missing required fields: ${[
            !site.id && 'id',
            !site.displayName && 'displayName',
            !site.webUrl && 'webUrl',
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      return {
        id: site.id,
        displayName: site.displayName,
        webUrl: site.webUrl,
        description: site.description || undefined,
      };
    } catch (error) {
      // console.error('Error fetching site by URL:', error)
      throw new Error('Failed to fetch SharePoint site by URL');
    }
  }

  /**
   * Get default document library (drive) for a site
   */
  async getDefaultDrive(siteId: string): Promise<string> {
    try {
      const client = await this.ensureClient();
      const drive: Drive = await client.api(`/sites/${siteId}/drive`).select('id').get();

      return drive.id!;
    } catch (error) {
      // console.error('Error fetching default drive:', error)
      throw new Error('Failed to fetch default document library');
    }
  }

  /**
   * List Excel files in a SharePoint site with pagination support
   */
  async listExcelFiles(
    siteId: string,
    driveId?: string,
    path?: string,
    pageSize: number = 100,
    nextPageToken?: string
  ): Promise<{ files: FileInfo[]; nextPageToken?: string }> {
    try {
      const client = await this.ensureClient();

      // If no driveId provided, get the default drive
      const targetDriveId = driveId || (await this.getDefaultDrive(siteId));

      // Build the API path
      let apiPath = `/sites/${siteId}/drives/${targetDriveId}`;
      if (path) {
        apiPath += `/root:/${path}:/children`;
      } else {
        apiPath += '/root/children';
      }

      // Build the request with pagination
      let request = client
        .api(apiPath)
        .filter("file ne null and (name endsWith '.xlsx' or name endsWith '.xls')")
        .select('id,name,size,lastModifiedDateTime,webUrl,file,@microsoft.graph.downloadUrl')
        .top(pageSize);

      // If we have a next page token, use it
      if (nextPageToken) {
        request = client.api(nextPageToken);
      }

      const response = await request.get();

      const files: FileInfo[] = [];

      // Process the response
      if (response.value) {
        for (const item of response.value) {
          if (item.file) {
            files.push({
              id: item.id,
              name: item.name,
              size: item.size || 0,
              modifiedDate: new Date(item.lastModifiedDateTime),
              downloadUrl: item['@microsoft.graph.downloadUrl'],
              webUrl: item.webUrl,
              mimeType: item.file.mimeType,
              path: path || '/',
            });
          }
        }
      }

      // Return files with next page token if available
      return {
        files,
        nextPageToken: response['@odata.nextLink'] || undefined,
      };
    } catch (error) {
      // console.error('Error listing Excel files:', error)
      throw new Error('Failed to list Excel files from SharePoint');
    }
  }

  /**
   * List all Excel files in a SharePoint site (fetches all pages)
   */
  async listAllExcelFiles(
    siteId: string,
    driveId?: string,
    path?: string,
    maxFiles: number = 1000
  ): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = [];
    let nextPageToken: string | undefined;

    do {
      const _result = await this.listExcelFiles(siteId, driveId, path, 100, nextPageToken);
      allFiles.push(...result.files);
      nextPageToken = result.nextPageToken;

      // Safety limit to prevent infinite loops
      if (allFiles.length >= maxFiles) {
        // console.warn(`Reached maximum file limit of ${maxFiles}. Some files may not be included.`)
        break;
      }
    } while (nextPageToken);

    return allFiles;
  }

  /**
   * Download file content
   */
  async downloadFile(siteId: string, driveId: string, itemId: string): Promise<Buffer> {
    try {
      const client = await this.ensureClient();

      // Get file metadata first to get download URL
      const fileItem: DriveItem = await client
        .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}`)
        .select('@microsoft.graph.downloadUrl')
        .get();

      if (!fileItem['@microsoft.graph.downloadUrl']) {
        throw new Error('Download URL not available');
      }

      // Download the file content with timeout and size limits
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
      const DOWNLOAD_TIMEOUT = 30000; // 30 seconds

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

      try {
        const response = await fetch(fileItem['@microsoft.graph.downloadUrl'], {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        // Check content length if available
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
          throw new Error(
            `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
          );
        }

        // Download with size monitoring
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Unable to read response body');
        }

        const chunks: Uint8Array[] = [];
        let totalSize = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          totalSize += value.length;
          if (totalSize > MAX_FILE_SIZE) {
            reader.cancel();
            throw new Error(
              `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
            );
          }

          chunks.push(value);
        }

        // Combine chunks into single buffer
        const buffer = new Uint8Array(totalSize);
        let position = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, position);
          position += chunk.length;
        }

        return Buffer.from(buffer);
      } catch (__error: any) {
        if (error.name === 'AbortError') {
          throw new Error('File download timed out after 30 seconds');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // console.error('Error downloading file:', error)
      throw new Error('Failed to download file from SharePoint');
    }
  }

  /**
   * Get file by site-relative URL
   */
  async getFileBySiteRelativeUrl(siteId: string, relativePath: string): Promise<FileInfo> {
    try {
      const client = await this.ensureClient();

      // Encode the path properly
      const encodedPath = encodeURIComponent(relativePath);

      const fileItem: DriveItem = await client
        .api(`/sites/${siteId}/drive/root:/${encodedPath}`)
        .select('id,name,size,lastModifiedDateTime,webUrl,file,@microsoft.graph.downloadUrl')
        .get();

      if (!fileItem.file) {
        throw new Error('Path does not point to a file');
      }

      // Validate required fields
      if (!fileItem.id || !fileItem.name || !fileItem.lastModifiedDateTime || !fileItem.webUrl) {
        throw new Error(
          `Incomplete file data received from Graph API. Missing required fields: ${[
            !fileItem.id && 'id',
            !fileItem.name && 'name',
            !fileItem.lastModifiedDateTime && 'lastModifiedDateTime',
            !fileItem.webUrl && 'webUrl',
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      return {
        id: fileItem.id,
        name: fileItem.name,
        size: fileItem.size || 0,
        modifiedDate: new Date(fileItem.lastModifiedDateTime),
        downloadUrl: fileItem['@microsoft.graph.downloadUrl'],
        webUrl: fileItem.webUrl,
        mimeType: fileItem.file.mimeType,
        path: relativePath,
      };
    } catch (error) {
      // console.error('Error fetching file by URL:', error)
      throw new Error('Failed to fetch file by relative URL');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(siteId: string, driveId: string, itemId: string): Promise<FileInfo> {
    try {
      const client = await this.ensureClient();

      const fileItem: DriveItem = await client
        .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}`)
        .select('id,name,size,lastModifiedDateTime,webUrl,file,@microsoft.graph.downloadUrl')
        .get();

      if (!fileItem.file) {
        throw new Error('Item is not a file');
      }

      // Validate required fields
      if (!fileItem.id || !fileItem.name || !fileItem.lastModifiedDateTime || !fileItem.webUrl) {
        throw new Error(
          `Incomplete file metadata received from Graph API. Missing required fields: ${[
            !fileItem.id && 'id',
            !fileItem.name && 'name',
            !fileItem.lastModifiedDateTime && 'lastModifiedDateTime',
            !fileItem.webUrl && 'webUrl',
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      return {
        id: fileItem.id,
        name: fileItem.name,
        size: fileItem.size || 0,
        modifiedDate: new Date(fileItem.lastModifiedDateTime),
        downloadUrl: fileItem['@microsoft.graph.downloadUrl'],
        webUrl: fileItem.webUrl,
        mimeType: fileItem.file.mimeType,
      };
    } catch (error) {
      // console.error('Error fetching file metadata:', error)
      throw new Error('Failed to fetch file metadata');
    }
  }

  /**
   * Check if user has access to a specific file
   */
  async checkFileAccess(siteId: string, driveId: string, itemId: string): Promise<boolean> {
    try {
      const client = await this.ensureClient();

      // Try to get file permissions
      await client
        .api(`/sites/${siteId}/drives/${driveId}/items/${itemId}/permissions`)
        .top(1)
        .get();

      return true;
    } catch (error) {
      // console.error('Error checking file access:', error)
      return false;
    }
  }

  /**
   * Search for files in SharePoint
   */
  async searchFiles(
    siteId: string,
    searchQuery: string,
    fileTypes: string[] = ['xlsx', 'xls']
  ): Promise<FileInfo[]> {
    try {
      const client = await this.ensureClient();

      // Build search query
      const typeFilter = fileTypes.map((ext) => `filetype:${ext}`).join(' OR ');
      const fullQuery = `${searchQuery} AND (${typeFilter}) AND path:https://*/sites/*`;

      const response = await client.api('/search/query').post({
        requests: [
          {
            entityTypes: ['driveItem'],
            query: {
              queryString: fullQuery,
            },
            from: 0,
            size: 50,
          },
        ],
      });

      const files: FileInfo[] = [];

      if (response.value?.[0]?.hitsContainers?.[0]?.hits) {
        for (const hit of response.value[0].hitsContainers[0].hits) {
          const resource = hit.resource;
          if (resource) {
            files.push({
              id: resource.id,
              name: resource.name,
              size: resource.size || 0,
              modifiedDate: new Date(resource.lastModifiedDateTime),
              webUrl: resource.webUrl,
            });
          }
        }
      }

      return files;
    } catch (error) {
      // console.error('Error searching files:', error)
      throw new Error('Failed to search files in SharePoint');
    }
  }
}

// Singleton instance
let fileServiceInstance: SharePointFileService | null = null;

export function getSharePointFileService(): SharePointFileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new SharePointFileService();
  }
  return fileServiceInstance;
}
