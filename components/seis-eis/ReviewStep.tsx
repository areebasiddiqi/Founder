'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, FileText, Send, Download } from 'lucide-react';

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
}

interface FundingRound {
  id: string;
  scheme: string;
  amount_to_raise: number;
  use_of_funds: string;
  first_time_applicant: boolean;
  status: string;
}

interface ReviewStepProps {
  company: Company | null;
  onSubmit: () => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  business_plan: 'Business Plan',
  financial_forecast: 'Financial Forecast',
  articles_of_association: 'Articles of Association',
  share_register: 'Share Register',
  accounts: 'Accounts',
  investor_list: 'Investor Evidence',
  hmrc_checklist: 'HMRC Checklist',
  cover_letter: 'Cover Letter',
  authorisation_letter: 'Authorisation Letter',
};

export default function ReviewStep({ company, onSubmit }: ReviewStepProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [fundingRound, setFundingRound] = useState<FundingRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      loadApplicationData();
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

  const loadApplicationData = async () => {
    try {
      // Load documents
      const docsResponse = await fetch(`/api/seis-eis/documents?company_id=${company.id}`);
      const docsData = await docsResponse.json();
      
      if (docsResponse.ok) {
        setDocuments(docsData.documents || []);
      }

      // Load funding round
      const roundResponse = await fetch(`/api/seis-eis/funding-rounds?company_id=${company.id}`);
      const roundData = await roundResponse.json();
      
      if (roundResponse.ok && roundData.rounds && roundData.rounds.length > 0) {
        setFundingRound(roundData.rounds[0]);
      }
    } catch (error) {
      console.error('Error loading application data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSubmissionPack = async () => {
    if (!fundingRound) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/seis-eis/generate-pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: company.id,
          round_id: fundingRound.id,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Download the generated pack
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = `SEIS_EIS_Application_${company.company_name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('Application pack generated successfully! The download should start automatically.');
      } else {
        throw new Error(result.error || 'Failed to generate pack');
      }
    } catch (error) {
      console.error('Error generating pack:', error);
      alert('Failed to generate application pack. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitApplication = async () => {
    if (!fundingRound) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/seis-eis/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: company.id,
          round_id: fundingRound.id,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        onSubmit();
      } else {
        throw new Error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentStatus = (doc: Document) => {
    if (doc.is_verified) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    }
    return <Badge variant="outline">Pending Review</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const allDocumentsVerified = documents.every(doc => doc.is_verified);
  const canSubmit = documents.length >= 9 && fundingRound; // Minimum required documents

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading application data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Review & Submit Application</h3>
        <p className="text-gray-600 mb-6">
          Review your application details before submitting to HMRC for SEIS/EIS advance assurance.
        </p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Company Name:</span> {company.company_name}
            </div>
            <div>
              <span className="font-medium">Registration Number:</span> {company.crn}
            </div>
            <div>
              <span className="font-medium">Incorporation Date:</span> {formatDate(company.incorporation_date)}
            </div>
            <div>
              <span className="font-medium">Contact:</span> {company.contact_name}
            </div>
            <div className="md:col-span-2">
              <span className="font-medium">Registered Address:</span> {company.registered_address}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Round Information */}
      {fundingRound && (
        <Card>
          <CardHeader>
            <CardTitle>Funding Round Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Scheme:</span> {fundingRound.scheme}
              </div>
              <div>
                <span className="font-medium">Amount to Raise:</span> {formatCurrency(fundingRound.amount_to_raise)}
              </div>
              <div>
                <span className="font-medium">First-time Applicant:</span> {fundingRound.first_time_applicant ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant="outline" className="ml-2">{fundingRound.status}</Badge>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Use of Funds:</span> {fundingRound.use_of_funds}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            {documents.length} documents uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">
                      {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                    </p>
                    <p className="text-xs text-gray-600">{doc.filename}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getDocumentStatus(doc)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!allDocumentsVerified && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-800 text-sm font-medium">
                  Some documents are still pending verification
                </span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                You can still submit your application, but HMRC may request additional verification.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Application</CardTitle>
          <CardDescription>
            Generate your application pack and submit to HMRC for advance assurance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• We'll compile all your documents into a professional submission pack</li>
              <li>• Your application will be submitted to HMRC on your behalf</li>
              <li>• You'll receive updates on the application status</li>
              <li>• HMRC typically responds within 30 working days</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={generateSubmissionPack}
              disabled={submitting || !canSubmit}
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Pack
            </Button>
            
            <Button
              onClick={submitApplication}
              disabled={submitting || !canSubmit}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit to HMRC
                </>
              )}
            </Button>
          </div>

          {!canSubmit && (
            <p className="text-sm text-gray-500 text-center">
              Please ensure all required documents are uploaded and funding round details are complete.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
