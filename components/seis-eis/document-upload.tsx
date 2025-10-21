'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download,
  Loader2 
} from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  filename: string;
  file_url: string;
  file_size: number;
  is_verified: boolean;
  uploaded_at: string;
  verification_notes?: string;
}

interface DocumentUploadProps {
  companyId: string;
  roundId?: string;
  documents: Document[];
  onDocumentUploaded: (document: Document) => void;
  onDocumentDeleted: (documentId: string) => void;
}

const REQUIRED_DOCUMENTS = [
  { type: 'business_plan', label: 'Business Plan', description: 'Detailed business plan (min 2 pages)' },
  { type: 'financial_forecast', label: 'Financial Forecast', description: '3-year financial projections' },
  { type: 'articles_of_association', label: 'Articles of Association', description: 'Company articles' },
  { type: 'share_register', label: 'Share Register', description: 'Current shareholding structure' },
  { type: 'accounts', label: 'Accounts', description: 'Latest accounts or bank statement (≤12 months)' },
  { type: 'investor_list', label: 'Investor Evidence', description: 'Named investor list or platform letter' },
  { type: 'hmrc_checklist', label: 'HMRC Checklist', description: 'Completed HMRC checklist' },
  { type: 'cover_letter', label: 'Cover Letter', description: 'Application cover letter' },
  { type: 'authorisation_letter', label: 'Authorisation Letter', description: 'Signed agent authorisation' },
];

export default function DocumentUpload({ 
  companyId, 
  roundId, 
  documents, 
  onDocumentUploaded, 
  onDocumentDeleted 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const uploadDocument = async (file: File, documentType: string) => {
    setUploading(documentType);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('company_id', companyId);
      if (roundId) formData.append('round_id', roundId);
      formData.append('document_type', documentType);

      const response = await fetch('/api/seis-eis/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        onDocumentUploaded(result.document);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/seis-eis/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDocumentDeleted(documentId);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getDocumentForType = (type: string) => {
    return documents.find(doc => doc.document_type === type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Required Documents</h3>
        <p className="text-gray-600 text-sm">
          Upload all required documents for your SEIS/EIS application. Documents must be in PDF, Word, or Excel format.
        </p>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 text-sm">{uploadError}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {REQUIRED_DOCUMENTS.map((docType) => {
          const existingDoc = getDocumentForType(docType.type);
          const isUploading = uploading === docType.type;

          return (
            <DocumentUploadCard
              key={docType.type}
              docType={docType}
              existingDoc={existingDoc}
              isUploading={isUploading}
              onUpload={(file) => uploadDocument(file, docType.type)}
              onDelete={deleteDocument}
            />
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Document Requirements</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All documents must be dated within the last 12 months (except articles)</li>
          <li>• Business plan must be at least 2 pages</li>
          <li>• Financial forecast must cover at least 3 years</li>
          <li>• First-time applicants must provide investor evidence covering ≥30% of round</li>
          <li>• Maximum file size: 10MB per document</li>
        </ul>
      </div>
    </div>
  );
}

interface DocumentUploadCardProps {
  docType: { type: string; label: string; description: string };
  existingDoc?: Document;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (documentId: string) => void;
}

function DocumentUploadCard({ 
  docType, 
  existingDoc, 
  isUploading, 
  onUpload, 
  onDelete 
}: DocumentUploadCardProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{docType.label}</CardTitle>
            <CardDescription>{docType.description}</CardDescription>
          </div>
          {existingDoc && (
            <div className="flex items-center gap-2">
              {existingDoc.is_verified ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending Review
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {existingDoc ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-sm">{existingDoc.filename}</p>
                <p className="text-xs text-gray-600">
                  {formatFileSize(existingDoc.file_size)} • 
                  Uploaded {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(existingDoc.file_url, '_blank')}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(existingDoc.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">PDF, Word, or Excel files only</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
