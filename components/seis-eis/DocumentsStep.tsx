'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Upload, CheckCircle } from 'lucide-react';
import DocumentUpload from './document-upload';

interface Company {
  id: string;
  company_name: string;
  crn: string;
  incorporation_date: string;
  registered_address: string;
  contact_name: string;
  contact_email: string;
}

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

interface DocumentsStepProps {
  company: Company | null;
  onContinue: () => void;
}

const REQUIRED_DOCUMENT_TYPES = [
  'business_plan',
  'financial_forecast',
  'articles_of_association',
  'share_register',
  'accounts',
  'investor_list',
  'hmrc_checklist',
  'cover_letter',
  'authorisation_letter',
];

export default function DocumentsStep({ company, onContinue }: DocumentsStepProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundId, setRoundId] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      loadDocuments();
      loadFundingRound();
    }
  }, [company]);

  if (!company) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Information Required</h3>
        <p className="text-gray-600">
          Please complete the company details step first.
        </p>
      </div>
    );
  }

  const loadFundingRound = async () => {
    try {
      const response = await fetch(`/api/seis-eis/funding-rounds?company_id=${company.id}`);
      const data = await response.json();
      
      if (response.ok && data.rounds && data.rounds.length > 0) {
        setRoundId(data.rounds[0].id);
      }
    } catch (error) {
      console.error('Error loading funding round:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/seis-eis/documents?company_id=${company.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = (document: Document) => {
    setDocuments(prev => [...prev.filter(d => d.document_type !== document.document_type), document]);
  };

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  const getUploadedDocumentTypes = () => {
    return documents.map(doc => doc.document_type);
  };

  const getVerifiedDocumentTypes = () => {
    return documents.filter(doc => doc.is_verified).map(doc => doc.document_type);
  };

  const isReadyToContinue = () => {
    const uploadedTypes = getUploadedDocumentTypes();
    return REQUIRED_DOCUMENT_TYPES.every(type => uploadedTypes.includes(type));
  };

  const getCompletionStats = () => {
    const uploaded = getUploadedDocumentTypes().length;
    const verified = getVerifiedDocumentTypes().length;
    const total = REQUIRED_DOCUMENT_TYPES.length;
    
    return { uploaded, verified, total };
  };

  const stats = getCompletionStats();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Required Documents</h3>
        <p className="text-gray-600 mb-6">
          Upload all required documents for your SEIS/EIS application. All documents must be uploaded before proceeding.
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload Progress</CardTitle>
          <CardDescription>
            Track your progress uploading the required documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.uploaded}</div>
              <div className="text-sm text-gray-600">Uploaded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Required</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.uploaded / stats.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats.uploaded} of {stats.total} documents uploaded
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Component */}
      <DocumentUpload
        companyId={company.id}
        roundId={roundId || undefined}
        documents={documents}
        onDocumentUploaded={handleDocumentUploaded}
        onDocumentDeleted={handleDocumentDeleted}
      />

      {/* Continue Button */}
      <div className="flex gap-4">
        {isReadyToContinue() ? (
          <Button onClick={onContinue} className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Continue to Review
          </Button>
        ) : (
          <div className="flex-1">
            <Button disabled className="w-full">
              Upload All Documents to Continue
            </Button>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {stats.total - stats.uploaded} documents remaining
            </p>
          </div>
        )}
      </div>

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Document Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All documents must be in PDF, Word, or Excel format</li>
              <li>• Maximum file size: 10MB per document</li>
              <li>• Documents must be dated within the last 12 months (except articles)</li>
              <li>• Business plan must be at least 2 pages long</li>
              <li>• Financial forecast must cover at least 3 years</li>
            </ul>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>
              If you need help with any documents, please contact our support team at{' '}
              <a href="mailto:support@surgeai.co.uk" className="text-blue-600 hover:underline">
                support@surgeai.co.uk
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
