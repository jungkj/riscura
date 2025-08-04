'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCardTitle, DaisyTabsTrigger } from '@/components/ui/daisy-components';
// import { 
  Download, 
  Eye, 
  FileText, 
  Image, 
  Archive, 
  Share2, 
  Edit3, 
  Trash2,
  Clock,
  User,
  Tag,
  Link,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  X,
} from 'lucide-react'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle, DaisyDialogTrigger } from '@/components/ui/DaisyDialog';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
// import { formatFileSize } from '@/lib/storage/file-validator'
// import { format } from 'date-fns'
import toast from 'react-hot-toast';

interface DocumentViewerProps {
  document: {
    id: string;
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    tags: string[];
    description?: string;
    uploadedBy: {
      id: string;
      name: string;
      email: string;
    }
    uploadedAt: string;
    updatedAt: string;
    version: number;
    downloadCount: number;
    lastDownloadedAt?: string;
    linkedEntityType?: string;
    linkedEntityId?: string;
    isImage: boolean;
    isDocument: boolean;
    detectedFileType: string;
    versions?: Array<{
      id: string;
      version: number;
      fileName: string;
      fileSize: number;
      uploadedAt: string;
      changeLog?: string;
    }>;
    commentCount?: number;
    shareCount?: number;
  }
  onEdit?: (document: any) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  className?: string;
}

const FILE_TYPE_ICONS = {
  pdf: FileText,
  word: FileText,
  excel: FileText,
  powerpoint: FileText,
  text: FileText,
  image: Image,
  archive: Archive,
  unknown: FileText,
}

const CATEGORY_COLORS = {
  evidence: 'bg-blue-100 text-blue-800',
  policy: 'bg-purple-100 text-purple-800',
  control: 'bg-green-100 text-green-800',
  risk: 'bg-red-100 text-red-800',
  audit: 'bg-orange-100 text-orange-800',
  template: 'bg-gray-100 text-gray-800',
  general: 'bg-gray-100 text-gray-800',
}

export default function DocumentViewer({
  document: documentData,
  onEdit,
  onDelete,
  onShare,
  className = '',
}: DocumentViewerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);

  const FileIcon = FILE_TYPE_ICONS[document.detectedFileType as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.unknown;

  useEffect(() => {
    return () => {
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentData.id}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = documentData.fileName;
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      // console.error('Download error:', error)
      toast.error('Failed to download file');
    } finally {
      setLoading(false);
    }
  }

  const handlePreview = async () => {
    if (!documentData.isImage && documentData.detectedFileType !== 'pdf') {
      toast.error('Preview not available for this file type');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentData.id}/download?inline=true`);
      
      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      // console.error('Preview error:', error)
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = () => {
    onEdit?.(documentData);
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${documentData.originalName}"?`)) {
      onDelete?.(documentData.id);
    }
  }

  const handleShare = () => {
    onShare?.(documentData.id);
  }

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.general;
  }

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    if (documentData.isImage) {

  return (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded">
          <img
            src={previewUrl}
            alt={documentData.originalName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }} />
        </div>
      );
    }

    if (documentData.detectedFileType === 'pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={documentData.originalName} />
        </div>
      );
    }

  return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Preview not available for this file type</p>
      </div>
    );
  }

  const canPreview = documentData.isImage || documentData.detectedFileType === 'pdf';

  return (
    <>
      <DaisyCard className={`w-full ${className}`}>
        <DaisyCardBody className="pb-3" >
  <div className="flex items-start justify-between">
</DaisyCard>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                  <FileIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <DaisyCardTitle className="text-lg truncate" title={documentData.originalName} >
  {documentData.originalName}
</DaisyCardTitle>
                </DaisyCardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <DaisyBadge className={getCategoryColor(documentData.category)} >
  {documentData.category}
</DaisyBadge>
                  </DaisyBadge>
                  <span className="text-sm text-gray-500">
                    v{documentData.version}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {Boolean(canPreview) && (
                <DaisyButton 
                  size="sm" 
                  variant="ghost" 
                  onClick={handlePreview}
                  disabled={loading} >
  <Eye className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              )}
              <DaisyButton 
                size="sm" 
                variant="ghost" 
                onClick={handleDownload}
                disabled={loading} >
  <Download className="w-4 h-4" />
</DaisyButton>
              </DaisyButton>
              {Boolean(onShare) && (
                <DaisyButton 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleShare} >
  <Share2 className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              )}
              {Boolean(onEdit) && (
                <DaisyButton 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleEdit} >
  <Edit3 className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              )}
              {Boolean(onDelete) && (
                <DaisyButton 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700" >
  <Trash2 className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              )}
            </div>
          </div>
        

        <DaisyCardBody className="space-y-4" >
  {/* Description */}
</DaisyCardBody>
          {documentData.description && (
            <div>
              <p className="text-sm text-gray-700">{documentData.description}</p>
            </div>
          )}

          {/* Tags */}
          {documentData.tags && documentData.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-400" />
              {documentData.tags.map((tag, index) => (
                <DaisyBadge key={index} variant="outline" className="text-xs" >
  {tag}
</DaisyBadge>
                </DaisyBadge>
              ))}
            </div>
          )}

          <DaisySeparator />
{/* Document Details */}
          <DaisyTabs defaultValue="details" className="w-full" >
              <DaisyTabsList className="grid w-full grid-cols-3" >
                <DaisyTabsTrigger value="details">Details</DaisySeparator>
              <DaisyTabsTrigger value="versions">Versions</DaisyTabsTrigger>
              <DaisyTabsTrigger value="activity">Activity</DaisyTabsTrigger>
            </DaisyTabsList>

            <DaisyTabsContent value="details" className="space-y-3 mt-4" >
                <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Uploaded by</p>
                    <p className="text-gray-600">{documentData.uploadedBy.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Upload date</p>
                    <p className="text-gray-600">
                      {format(new Date(documentData.uploadedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">File size</p>
                  <p className="text-gray-600">{formatFileSize(documentData.fileSize)}</p>
                </div>

                <div>
                  <p className="font-medium">File type</p>
                  <p className="text-gray-600">{documentData.mimeType}</p>
                </div>

                <div>
                  <p className="font-medium">Downloads</p>
                  <p className="text-gray-600">{documentData.downloadCount}</p>
                </div>

                {documentData.lastDownloadedAt && (
                  <div>
                    <p className="font-medium">Last downloaded</p>
                    <p className="text-gray-600">
                      {format(new Date(documentData.lastDownloadedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Entity */}
              {documentData.linkedEntityType && documentData.linkedEntityId && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Link className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">Linked to</p>
                    <p className="text-sm text-gray-600">
                      {documentData.linkedEntityType}: {documentData.linkedEntityId}
                    </p>
                  </div>
                </div>
              )}
            </DaisyTabsContent>

            <DaisyTabsContent value="versions" className="space-y-3 mt-4" >
                {document.versions && document.versions.length > 0 ? (
                <div className="space-y-2">
                  {document.versions.map((version) => (
                    <div 
                      key={version.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {version.version}</span>
                          {version.version === document.version && (
                            <DaisyBadge variant="outline" className="text-xs">Current</DaisyTabsContent>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(version.fileSize)} • {format(new Date(version.uploadedAt), 'MMM dd, yyyy')}
                        </p>
                        {version.changeLog && (
                          <p className="text-sm text-gray-700 mt-1">{version.changeLog}</p>
                        )}
                      </div>
                      <DaisyButton size="sm" variant="ghost" >
  <Download className="w-4 h-4" />
</DaisyButton>
                      </DaisyButton>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No version history available</p>
              )}
            </DaisyTabsContent>

            <DaisyTabsContent value="activity" className="space-y-3 mt-4" >
                <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Document uploaded</span>
                  <span className="text-gray-500">
                    {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {document.updatedAt && document.updatedAt !== document.uploadedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Document updated</span>
                    <span className="text-gray-500">
                      {format(new Date(document.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                )}
                {document.lastDownloadedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Last downloaded</span>
                    <span className="text-gray-500">
                      {format(new Date(document.lastDownloadedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </DaisyTabsContent>
          </DaisyTabs>
        </DaisyCardBody>
      </DaisyCard>

      {/* Preview Dialog */}
      <DaisyDialog open={previewOpen} onOpenChange={setPreviewOpen} >
          <DaisyDialogContent className="max-w-4xl max-h-[90vh] p-0" >
  <DaisyDialogHeader className="p-4 pb-2">
</DaisyDialog>
            <div className="flex items-center justify-between">
              <DaisyDialogTitle className="truncate">{document.originalName}</DaisyDialogTitle>
              <div className="flex items-center gap-2">
                {document.isImage && (
                  <>
                    <DaisyButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(Math.max(25, zoom - 25))} />
                      <ZoomOut className="w-4 h-4" />
                    </DaisyButton>
                    <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
                    <DaisyButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(Math.min(200, zoom + 25))} />
                      <ZoomIn className="w-4 h-4" />
                    </DaisyButton>
                    <DaisyButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setRotation((rotation + 90) % 360)} />
                      <RotateCw className="w-4 h-4" />
                    </DaisyButton>
                  </>
                )}
                <DaisyButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewOpen(false)} />
                  <X className="w-4 h-4" />
                </DaisyButton>
              </div>
            </div>
          </DaisyDialogHeader>
          <div className="flex-1 p-4 pt-0" style={{ height: '70vh' }}>
            {renderPreviewContent()}
          </div>
        </DaisyDialogContent>
      </DaisyDialog>
    </>
  );
} 