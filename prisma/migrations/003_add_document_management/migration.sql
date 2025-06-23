-- Document Management Schema
-- This migration adds comprehensive document management capabilities

-- Main documents table
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[],
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "detectedFileType" TEXT NOT NULL,
    "isImage" BOOLEAN NOT NULL DEFAULT false,
    "isDocument" BOOLEAN NOT NULL DEFAULT false,
    "virusScanned" BOOLEAN NOT NULL DEFAULT false,
    "virusScanResult" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadedAt" TIMESTAMP(3),
    "linkedEntityType" TEXT,
    "linkedEntityId" TEXT,
    "parentId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- Document versions table for version history
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeLog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- Document access permissions table
CREATE TABLE "DocumentAccess" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentAccess_pkey" PRIMARY KEY ("id")
);

-- Document shares table for sharing with external users
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "sharedWith" TEXT,
    "shareToken" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- Document comments table
CREATE TABLE "DocumentComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocumentComment_pkey" PRIMARY KEY ("id")
);

-- Document approval workflow table
CREATE TABLE "DocumentApproval" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "comments" TEXT,
    "reviewNotes" TEXT,
    "approvalLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentApproval_pkey" PRIMARY KEY ("id")
);

-- Document metadata extraction table
CREATE TABLE "DocumentMetadata" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "textContent" TEXT,
    "pageCount" INTEGER,
    "wordCount" INTEGER,
    "language" TEXT,
    "author" TEXT,
    "subject" TEXT,
    "keywords" TEXT[],
    "createdDate" TIMESTAMP(3),
    "modifiedDate" TIMESTAMP(3),
    "extractionMethod" TEXT NOT NULL DEFAULT 'automatic',

    CONSTRAINT "DocumentMetadata_pkey" PRIMARY KEY ("id")
);

-- Document audit log table
CREATE TABLE "DocumentAuditLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAuditLog_pkey" PRIMARY KEY ("id")
);

-- Saved searches table
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "Document_uploadedBy_idx" ON "Document"("uploadedBy");
CREATE INDEX "Document_category_idx" ON "Document"("category");
CREATE INDEX "Document_detectedFileType_idx" ON "Document"("detectedFileType");
CREATE INDEX "Document_linkedEntityType_linkedEntityId_idx" ON "Document"("linkedEntityType", "linkedEntityId");
CREATE INDEX "Document_uploadedAt_idx" ON "Document"("uploadedAt");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_tags_idx" ON "Document" USING GIN("tags");
CREATE INDEX "Document_hash_idx" ON "Document"("hash");

CREATE INDEX "DocumentVersion_documentId_version_idx" ON "DocumentVersion"("documentId", "version");
CREATE INDEX "DocumentVersion_uploadedAt_idx" ON "DocumentVersion"("uploadedAt");

CREATE INDEX "DocumentAccess_documentId_userId_idx" ON "DocumentAccess"("documentId", "userId");
CREATE INDEX "DocumentAccess_userId_idx" ON "DocumentAccess"("userId");
CREATE INDEX "DocumentAccess_expiresAt_idx" ON "DocumentAccess"("expiresAt");

CREATE INDEX "DocumentShare_documentId_idx" ON "DocumentShare"("documentId");
CREATE INDEX "DocumentShare_shareToken_idx" ON "DocumentShare"("shareToken");
CREATE INDEX "DocumentShare_sharedBy_idx" ON "DocumentShare"("sharedBy");
CREATE INDEX "DocumentShare_expiresAt_idx" ON "DocumentShare"("expiresAt");

CREATE INDEX "DocumentComment_documentId_idx" ON "DocumentComment"("documentId");
CREATE INDEX "DocumentComment_userId_idx" ON "DocumentComment"("userId");
CREATE INDEX "DocumentComment_parentId_idx" ON "DocumentComment"("parentId");
CREATE INDEX "DocumentComment_createdAt_idx" ON "DocumentComment"("createdAt");

CREATE INDEX "DocumentApproval_documentId_idx" ON "DocumentApproval"("documentId");
CREATE INDEX "DocumentApproval_assignedTo_idx" ON "DocumentApproval"("assignedTo");
CREATE INDEX "DocumentApproval_status_idx" ON "DocumentApproval"("status");
CREATE INDEX "DocumentApproval_dueDate_idx" ON "DocumentApproval"("dueDate");

CREATE INDEX "DocumentMetadata_documentId_idx" ON "DocumentMetadata"("documentId");
CREATE INDEX "DocumentMetadata_textContent_idx" ON "DocumentMetadata" USING GIN(to_tsvector('english', "textContent"));

CREATE INDEX "DocumentAuditLog_documentId_idx" ON "DocumentAuditLog"("documentId");
CREATE INDEX "DocumentAuditLog_userId_idx" ON "DocumentAuditLog"("userId");
CREATE INDEX "DocumentAuditLog_action_idx" ON "DocumentAuditLog"("action");
CREATE INDEX "DocumentAuditLog_timestamp_idx" ON "DocumentAuditLog"("timestamp");

CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");
CREATE INDEX "SavedSearch_entityType_idx" ON "SavedSearch"("entityType");
CREATE INDEX "SavedSearch_useCount_idx" ON "SavedSearch"("useCount");

-- Add foreign key constraints
-- Note: These assume the existence of a User table
-- Adjust table names as needed based on your existing schema

-- Document foreign keys
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DocumentVersion foreign keys
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DocumentAccess foreign keys
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DocumentShare foreign keys
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DocumentComment foreign keys
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentComment" ADD CONSTRAINT "DocumentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DocumentApproval foreign keys
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DocumentMetadata foreign keys
ALTER TABLE "DocumentMetadata" ADD CONSTRAINT "DocumentMetadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DocumentAuditLog foreign keys
ALTER TABLE "DocumentAuditLog" ADD CONSTRAINT "DocumentAuditLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAuditLog" ADD CONSTRAINT "DocumentAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SavedSearch foreign keys
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraints
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_version_key" UNIQUE ("documentId", "version");
ALTER TABLE "DocumentAccess" ADD CONSTRAINT "DocumentAccess_documentId_userId_key" UNIQUE ("documentId", "userId");
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_shareToken_key" UNIQUE ("shareToken");
ALTER TABLE "DocumentMetadata" ADD CONSTRAINT "DocumentMetadata_documentId_key" UNIQUE ("documentId");

-- Create enum types for better data consistency
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED', 'PROCESSING');
CREATE TYPE "DocumentPermission" AS ENUM ('VIEW', 'EDIT', 'DELETE', 'SHARE');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ApprovalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Update existing columns to use enums (this will need to be done carefully in production)
-- ALTER TABLE "Document" ALTER COLUMN "status" TYPE "DocumentStatus" USING "status"::"DocumentStatus";
-- ALTER TABLE "DocumentAccess" ALTER COLUMN "permission" TYPE "DocumentPermission" USING "permission"::"DocumentPermission";
-- ALTER TABLE "DocumentShare" ALTER COLUMN "permission" TYPE "DocumentPermission" USING "permission"::"DocumentPermission";
-- ALTER TABLE "DocumentApproval" ALTER COLUMN "status" TYPE "ApprovalStatus" USING "status"::"ApprovalStatus";
-- ALTER TABLE "DocumentApproval" ALTER COLUMN "priority" TYPE "ApprovalPriority" USING "priority"::"ApprovalPriority";

-- Create triggers for audit logging
CREATE OR REPLACE FUNCTION document_audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "DocumentAuditLog" ("documentId", "userId", "action", "details", "timestamp")
        VALUES (NEW.id, NEW."uploadedBy", 'CREATE', 
                json_build_object('fileName', NEW."originalName", 'category', NEW.category)::jsonb,
                CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "DocumentAuditLog" ("documentId", "userId", "action", "details", "timestamp")
        VALUES (NEW.id, NEW."uploadedBy", 'UPDATE', 
                json_build_object('changes', json_build_object('from', OLD, 'to', NEW))::jsonb,
                CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO "DocumentAuditLog" ("documentId", "userId", "action", "details", "timestamp")
        VALUES (OLD.id, OLD."deletedBy", 'DELETE', 
                json_build_object('fileName', OLD."originalName")::jsonb,
                CURRENT_TIMESTAMP);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER document_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Document"
    FOR EACH ROW EXECUTE FUNCTION document_audit_trigger(); 