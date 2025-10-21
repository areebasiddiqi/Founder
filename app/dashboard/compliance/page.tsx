'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Building2,
  Upload
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  company_id: string;
  round_id: string;
  share_issue_date?: string;
  seis1_eis1_submitted_at?: string;
  seis3_eis3_received_at?: string;
  next_reminder_due?: string;
  companies: {
    name: string;
    crn: string;
  };
  funding_rounds: {
    scheme: string;
    amount_to_raise: number;
    status: string;
  };
}

export default function CompliancePage() {
  const supabase = createClientComponentClient();
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: compliance, error } = await supabase
        .from('compliance_tracking')
        .select(`
          *,
          companies!inner (
            name,
            crn,
            founder_id
          ),
          funding_rounds (
            scheme,
            amount_to_raise,
            status
          )
        `)
        .eq('companies.founder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading compliance data:', error);
        return;
      }

      setComplianceItems(compliance || []);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateShareIssueDate = async (complianceId: string, companyId: string, roundId: string, date: string) => {
    setUpdating(complianceId);
    
    try {
      const response = await fetch('/api/seis-eis/compliance/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          round_id: roundId,
          share_issue_date: date,
        }),
      });

      if (response.ok) {
        await loadComplianceData(); // Refresh data
      } else {
        console.error('Failed to update share issue date');
      }
    } catch (error) {
      console.error('Error updating share issue date:', error);
    } finally {
      setUpdating(null);
    }
  };

  const markSEIS1EIS1Submitted = async (complianceId: string, companyId: string, roundId: string) => {
    setUpdating(complianceId);
    
    try {
      const response = await fetch('/api/seis-eis/compliance/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          round_id: roundId,
          seis1_eis1_submitted: true,
        }),
      });

      if (response.ok) {
        await loadComplianceData(); // Refresh data
      } else {
        console.error('Failed to mark SEIS1/EIS1 as submitted');
      }
    } catch (error) {
      console.error('Error marking SEIS1/EIS1 as submitted:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getComplianceStatus = (item: ComplianceItem) => {
    if (item.seis1_eis1_submitted_at) {
      return { status: 'complete', label: 'Complete', color: 'bg-green-100 text-green-800' };
    }
    
    if (item.share_issue_date) {
      const issueDate = new Date(item.share_issue_date);
      const daysAgo = Math.floor((Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysAgo > 90) {
        return { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' };
      } else if (daysAgo > 60) {
        return { status: 'due_soon', label: 'Due Soon', color: 'bg-amber-100 text-amber-800' };
      } else {
        return { status: 'on_track', label: 'On Track', color: 'bg-blue-100 text-blue-800' };
      }
    }
    
    if (item.funding_rounds.status === 'approved') {
      return { status: 'awaiting_issue', label: 'Awaiting Share Issue', color: 'bg-purple-100 text-purple-800' };
    }
    
    return { status: 'not_applicable', label: 'Not Applicable', color: 'bg-gray-100 text-gray-800' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const pendingItems = complianceItems.filter(item => {
    const status = getComplianceStatus(item);
    return ['awaiting_issue', 'on_track', 'due_soon', 'overdue'].includes(status.status);
  });

  const completedItems = complianceItems.filter(item => {
    const status = getComplianceStatus(item);
    return status.status === 'complete';
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post-Approval Compliance</h1>
        <p className="text-gray-600">
          Track your SEIS/EIS compliance requirements after receiving advance assurance approval.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingItems.length}</p>
                <p className="text-sm text-gray-600">Pending Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedItems.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {pendingItems.filter(item => getComplianceStatus(item).status === 'overdue').length}
                </p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Requirements Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">SEIS/EIS Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Share Issue:</strong> Issue shares to investors within the agreed timeframe</p>
            <p>• <strong>SEIS1/EIS1 Form:</strong> Submit to HMRC within 3 months of share issue</p>
            <p>• <strong>SEIS3/EIS3 Certificates:</strong> Receive and distribute to investors</p>
            <p>• <strong>Record Keeping:</strong> Maintain all records for at least 6 years</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h2>
          <div className="space-y-4">
            {pendingItems.map((item) => {
              const status = getComplianceStatus(item);
              return (
                <ComplianceCard
                  key={item.id}
                  item={item}
                  status={status}
                  updating={updating === item.id}
                  onUpdateShareIssue={updateShareIssueDate}
                  onMarkSubmitted={markSEIS1EIS1Submitted}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed</h2>
          <div className="space-y-4">
            {completedItems.map((item) => {
              const status = getComplianceStatus(item);
              return (
                <ComplianceCard
                  key={item.id}
                  item={item}
                  status={status}
                  updating={false}
                  onUpdateShareIssue={updateShareIssueDate}
                  onMarkSubmitted={markSEIS1EIS1Submitted}
                />
              );
            })}
          </div>
        </div>
      )}

      {complianceItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Compliance Items</h3>
            <p className="text-gray-600">
              Compliance tracking will appear here after your SEIS/EIS applications are approved.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ComplianceCardProps {
  item: ComplianceItem;
  status: { status: string; label: string; color: string };
  updating: boolean;
  onUpdateShareIssue: (id: string, companyId: string, roundId: string, date: string) => void;
  onMarkSubmitted: (id: string, companyId: string, roundId: string) => void;
}

function ComplianceCard({ item, status, updating, onUpdateShareIssue, onMarkSubmitted }: ComplianceCardProps) {
  const [shareIssueDate, setShareIssueDate] = useState(
    item.share_issue_date ? item.share_issue_date.split('T')[0] : ''
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = () => {
    if (!item.share_issue_date) return null;
    
    const issueDate = new Date(item.share_issue_date);
    const deadline = new Date(issueDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return daysRemaining;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {item.companies.name}
            </CardTitle>
            <CardDescription>
              {item.funding_rounds.scheme} • {formatCurrency(item.funding_rounds.amount_to_raise)} • CRN: {item.companies.crn}
            </CardDescription>
          </div>
          <Badge className={status.color}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Share Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Issue Date
            </label>
            {item.share_issue_date ? (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {new Date(item.share_issue_date).toLocaleDateString()}
                </span>
                {getDaysRemaining() !== null && (
                  <span className={`text-sm ${getDaysRemaining()! < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    ({getDaysRemaining()! < 0 ? `${Math.abs(getDaysRemaining()!)} days overdue` : `${getDaysRemaining()} days remaining`})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={shareIssueDate}
                  onChange={(e) => setShareIssueDate(e.target.value)}
                  className="w-auto"
                />
                <Button
                  onClick={() => onUpdateShareIssue(item.id, item.company_id, item.round_id, shareIssueDate)}
                  disabled={!shareIssueDate || updating}
                  size="sm"
                >
                  {updating ? 'Updating...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {/* SEIS1/EIS1 Submission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEIS1/EIS1 Form Submission
            </label>
            {item.seis1_eis1_submitted_at ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700">
                  Submitted on {new Date(item.seis1_eis1_submitted_at).toLocaleDateString()}
                </span>
              </div>
            ) : item.share_issue_date ? (
              <Button
                onClick={() => onMarkSubmitted(item.id, item.company_id, item.round_id)}
                disabled={updating}
                size="sm"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                {updating ? 'Updating...' : 'Mark as Submitted'}
              </Button>
            ) : (
              <p className="text-sm text-gray-600">
                Please provide share issue date first
              </p>
            )}
          </div>

          {/* Next Steps */}
          {status.status === 'awaiting_issue' && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Next Step:</strong> Issue shares to your investors and record the date above.
              </p>
            </div>
          )}
          
          {status.status === 'on_track' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next Step:</strong> Submit SEIS1/EIS1 form to HMRC within 3 months of share issue.
              </p>
            </div>
          )}
          
          {status.status === 'due_soon' && (
            <div className="bg-amber-50 p-3 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Urgent:</strong> SEIS1/EIS1 form submission is due soon. Please submit to HMRC immediately.
              </p>
            </div>
          )}
          
          {status.status === 'overdue' && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Overdue:</strong> SEIS1/EIS1 form submission is overdue. Contact HMRC immediately to avoid penalties.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
