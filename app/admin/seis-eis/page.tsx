'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  X
} from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  crn: string;
  incorporation_date: string;
  contact_name: string;
  contact_email: string;
  founder_id: string;
  funding_rounds: FundingRound[];
  authorisations: Authorisation[];
  profiles: {
    full_name: string;
    email: string;
  };
}

interface FundingRound {
  id: string;
  scheme: 'SEIS' | 'EIS' | 'BOTH';
  amount_to_raise: number;
  status: 'draft' | 'ready' | 'submitted' | 'query' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  documents: Document[];
  submissions: Submission[];
}

interface Authorisation {
  id: string;
  is_valid: boolean;
  expires_at: string;
  signed_at: string;
}

interface Document {
  id: string;
  document_type: string;
  filename: string;
  is_verified: boolean;
  uploaded_at: string;
  verification_notes?: string;
}

interface Submission {
  id: string;
  hmrc_reference?: string;
  submitted_at: string;
  due_followup_at?: string;
  status: 'pending' | 'info_requested' | 'approved' | 'rejected';
}

export default function AdminSEISEIS() {
  const supabase = createClientComponentClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [user, setUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return;
      }

      setUser(user);
      await loadCompanies();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          profiles!companies_founder_id_fkey (
            full_name,
            email
          ),
          funding_rounds (
            *,
            documents (
              id,
              document_type,
              filename,
              is_verified,
              uploaded_at,
              verification_notes
            ),
            submissions (
              id,
              hmrc_reference,
              submitted_at,
              due_followup_at,
              status
            )
          ),
          authorisations (
            id,
            is_valid,
            expires_at,
            signed_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return;
      }

      setCompanies(companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const updateDocumentVerification = async (documentId: string, isVerified: boolean, notes?: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          is_verified: isVerified,
          verification_notes: notes,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq('id', documentId);

      if (!error) {
        await loadCompanies(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const updateRoundStatus = async (roundId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('funding_rounds')
        .update({ status })
        .eq('id', roundId);

      if (!error) {
        await loadCompanies(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating round status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'query': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleContactCompany = (company: Company) => {
    const subject = `SEIS/EIS Application - ${company.company_name}`;
    const body = `Dear ${company.contact_name},\n\nRegarding your SEIS/EIS application for ${company.company_name} (CRN: ${company.crn}).\n\nBest regards,\nSurgeAI Team`;
    const mailtoLink = `mailto:${company.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      // Get the document details from the database
      const { data: document, error } = await supabase
        .from('documents')
        .select('file_url, filename')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        alert('Failed to load document');
        return;
      }

      if (document?.file_url) {
        // Open the document in a new tab
        window.open(document.file_url, '_blank');
      } else {
        alert('Document file not found');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to open document');
    }
  };

  const getUrgentItems = () => {
    const urgent: any[] = [];
    
    companies.forEach(company => {
      // Check for expired authorisations
      company.authorisations.forEach(auth => {
        if (!auth.is_valid || new Date(auth.expires_at) < new Date()) {
          urgent.push({
            type: 'expired_auth',
            company: company.company_name || 'Unknown Company',
            message: 'Authorisation expired or invalid'
          });
        }
      });

      // Check for overdue follow-ups
      company.funding_rounds.forEach(round => {
        round.submissions.forEach(submission => {
          if (submission.due_followup_at && new Date(submission.due_followup_at) < new Date()) {
            urgent.push({
              type: 'overdue_followup',
              company: company.company_name || 'Unknown Company',
              message: `Follow-up overdue for ${round.scheme} application`
            });
          }
        });
      });
    });

    return urgent;
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = (company.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.crn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    return matchesSearch && company.funding_rounds.some(round => round.status === statusFilter);
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || !companies) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const urgentItems = getUrgentItems();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEIS/EIS Admin Portal</h1>
        <p className="text-gray-600">Manage all SEIS/EIS applications and submissions</p>
      </div>

      {/* Urgent Items Alert */}
      {urgentItems.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Urgent Items ({urgentItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{item.company}:</span>
                  <span>{item.message}</span>
                </div>
              ))}
              {urgentItems.length > 5 && (
                <p className="text-sm text-amber-600">...and {urgentItems.length - 5} more items</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search companies, CRN, or contact name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="submitted">Submitted</option>
          <option value="query">Query</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Companies List */}
      <div className="space-y-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {company.company_name || 'Unknown Company'}
                  </CardTitle>
                  <CardDescription>
                    CRN: {company.crn} • Contact: {company.contact_name} ({company.contact_email})
                  </CardDescription>
                  <div className="text-sm text-gray-600 mt-1">
                    Founder: {company.profiles?.full_name} ({company.profiles?.email})
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewCompany(company)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleContactCompany(company)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Authorisation Status */}
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Authorisation Status</h4>
                {company.authorisations.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {company.authorisations[0].is_valid ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          Valid until {new Date(company.authorisations[0].expires_at).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700">Expired - needs renewal</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Not signed</span>
                  </div>
                )}
              </div>

              {/* Funding Rounds */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Funding Rounds</h4>
                {company.funding_rounds.length > 0 ? (
                  <div className="space-y-3">
                    {company.funding_rounds.map((round) => (
                      <div key={round.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{round.scheme}</Badge>
                            <span className="font-medium">{formatCurrency(round.amount_to_raise)}</span>
                            <Badge className={getStatusColor(round.status)}>
                              {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={round.status}
                              onChange={(e) => updateRoundStatus(round.id, e.target.value)}
                              className="text-sm px-2 py-1 border rounded"
                            >
                              <option value="draft">Draft</option>
                              <option value="ready">Ready</option>
                              <option value="submitted">Submitted</option>
                              <option value="query">Query</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {/* Documents */}
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-600 mb-2">Documents ({round.documents.length})</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {round.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3 h-3" />
                                  <span>{doc.document_type.replace('_', ' ')}</span>
                                  {doc.is_verified ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-amber-500" />
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDocument(doc.id)}
                                    className="h-6 px-2 text-blue-600 hover:text-blue-800"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateDocumentVerification(doc.id, !doc.is_verified)}
                                    className="h-6 px-2"
                                  >
                                    {doc.is_verified ? 'Unverify' : 'Verify'}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Submissions */}
                        {round.submissions.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-600 mb-2">Submissions</h5>
                            {round.submissions.map((submission) => (
                              <div key={submission.id} className="text-xs bg-white p-2 rounded">
                                <div className="flex items-center justify-between">
                                  <span>HMRC Ref: {submission.hmrc_reference || 'Pending'}</span>
                                  <Badge className={getStatusColor(submission.status)}>
                                    {submission.status}
                                  </Badge>
                                </div>
                                <div className="text-gray-600 mt-1">
                                  Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                                  {submission.due_followup_at && (
                                    <span className="ml-2">
                                      Follow-up due: {new Date(submission.due_followup_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No funding rounds yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No SEIS/EIS applications have been submitted yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Company Detail Modal */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    {selectedCompany.company_name}
                  </h2>
                  <p className="text-gray-600">Detailed company information and application status</p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCompanyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Company Name:</span>
                      <p className="text-gray-900">{selectedCompany.company_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Registration Number:</span>
                      <p className="text-gray-900">{selectedCompany.crn}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Incorporation Date:</span>
                      <p className="text-gray-900">{new Date(selectedCompany.incorporation_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Contact Person:</span>
                      <p className="text-gray-900">{selectedCompany.contact_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Contact Email:</span>
                      <p className="text-gray-900">{selectedCompany.contact_email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Founder:</span>
                      <p className="text-gray-900">
                        {selectedCompany.profiles?.full_name} ({selectedCompany.profiles?.email})
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Authorization Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Authorization Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCompany.authorisations.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCompany.authorisations.map((auth, index) => (
                          <div key={auth.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {auth.is_valid ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-medium">
                                {auth.is_valid ? 'Valid' : 'Invalid/Expired'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Expires: {new Date(auth.expires_at).toLocaleDateString()}</p>
                              {auth.signed_at && (
                                <p>Signed: {new Date(auth.signed_at).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No authorizations found</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Funding Rounds */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Funding Rounds</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCompany.funding_rounds.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCompany.funding_rounds.map((round) => (
                        <div key={round.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{round.scheme}</Badge>
                              <span className="font-medium">{formatCurrency(round.amount_to_raise)}</span>
                              <Badge className={getStatusColor(round.status)}>
                                {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              Created: {new Date(round.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Documents for this round */}
                          <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-2">
                              Documents ({round.documents.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {round.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{doc.document_type.replace('_', ' ')}</span>
                                    {doc.is_verified ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-amber-500" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewDocument(doc.id)}
                                      className="h-6 px-2 text-blue-600 hover:text-blue-800"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <div className="text-xs text-gray-500">
                                      {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Submissions for this round */}
                          {round.submissions.length > 0 && (
                            <div className="mt-3">
                              <h5 className="font-medium text-sm text-gray-700 mb-2">Submissions</h5>
                              {round.submissions.map((submission) => (
                                <div key={submission.id} className="text-sm bg-blue-50 p-2 rounded">
                                  <div className="flex items-center justify-between">
                                    <span>HMRC Ref: {submission.hmrc_reference || 'Pending'}</span>
                                    <Badge className={getStatusColor(submission.status)}>
                                      {submission.status}
                                    </Badge>
                                  </div>
                                  <div className="text-gray-600 mt-1">
                                    Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No funding rounds found</p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={() => handleContactCompany(selectedCompany)}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Company
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCompanyModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
