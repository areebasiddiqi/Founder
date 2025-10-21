'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  ExternalLink,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import AgentAppointment from '@/components/seis-eis/agent-appointment';

interface Company {
  id: string;
  name: string;
  crn: string;
  incorporation_date: string;
  registered_address?: string;
  contact_name?: string;
  contact_email?: string;
  is_seis_candidate: boolean;
  is_eis_candidate: boolean;
  funding_rounds: FundingRound[];
  authorisations: Authorisation[];
  agent_appointment?: {
    status: 'pending' | 'sent' | 'signed';
    signed_at?: string;
    document_url?: string;
  };
}

interface FundingRound {
  id: string;
  scheme: 'SEIS' | 'EIS' | 'BOTH';
  amount_to_raise: number;
  status: 'draft' | 'ready' | 'submitted' | 'query' | 'approved' | 'rejected';
  created_at: string;
}

interface Authorisation {
  id: string;
  is_valid: boolean;
  expires_at: string;
}

export default function SEISEISDashboard() {
  const supabase = createClientComponentClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [showAgentAppointment, setShowAgentAppointment] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    checkSubscriptionAndLoadData();
  }, []);

  const checkSubscriptionAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      // Check subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSubscription(sub);

      if (sub?.plan_type === 'seis_eis_plan' && sub?.status === 'active') {
        await loadCompanies();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/seis-eis/companies');
      const data = await response.json();
      
      if (response.ok) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Check if user has valid subscription
  const hasValidSubscription = subscription?.plan_type === 'seis_eis_plan' && subscription?.status === 'active';

  if (!hasValidSubscription) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SEIS/EIS Agent Service Required</h1>
          <p className="text-gray-600 mb-6">
            You need an active SEIS/EIS Agent Service subscription to access this feature.
          </p>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What you get for £9/month:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Full SEIS/EIS application workflow</li>
              <li>• Authorised agent representation</li>
              <li>• Document validation & compilation</li>
              <li>• HMRC submission management</li>
              <li>• Compliance tracking & reminders</li>
              <li>• Priority support</li>
            </ul>
          </div>
          <Button asChild size="lg">
            <Link href="/pricing">Subscribe Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEIS/EIS Applications</h1>
          <p className="text-gray-600">Manage your SEIS/EIS Advance Assurance applications</p>
        </div>
        <Button asChild>
          <Link href="/apply">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Link>
        </Button>
      </div>

      {showAgentAppointment && selectedCompany ? (
        <AgentAppointment 
          company={selectedCompany}
          onComplete={(appointmentData) => {
            console.log('Agent appointment completed:', appointmentData);
            setShowAgentAppointment(false);
            setSelectedCompany(null);
            // Refresh companies data
            loadCompanies();
          }}
        />
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              Start your first SEIS/EIS Advance Assurance application.
            </p>
            <Button asChild>
              <Link href="/apply">
                <Plus className="w-4 h-4 mr-2" />
                Start Application
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {company.name}
                    </CardTitle>
                    <CardDescription>
                      CRN: {company.crn} • Incorporated: {new Date(company.incorporation_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {company.is_seis_candidate && (
                      <Badge variant="outline">SEIS Candidate</Badge>
                    )}
                    {company.is_eis_candidate && (
                      <Badge variant="outline">EIS Candidate</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Agent Appointment Status */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Agent Appointment Status
                  </h4>
                  {company.agent_appointment?.status === 'signed' ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          Signed on {company.agent_appointment.signed_at ? new Date(company.agent_appointment.signed_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Document
                      </Button>
                    </div>
                  ) : company.agent_appointment?.status === 'sent' ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-700">Sent for signature - check your email</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowAgentAppointment(true);
                        }}
                      >
                        Resend
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700">Agent appointment required before SEIS/EIS application</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowAgentAppointment(true);
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Sign Now
                      </Button>
                    </div>
                  )}
                </div>

                {/* Authorisation Status */}
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">HMRC Authorisation Status</h4>
                  {company.authorisations.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {company.authorisations[0].is_valid ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-700">Valid until {new Date(company.authorisations[0].expires_at).toLocaleDateString()}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-amber-700">Expired - needs renewal</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {company.agent_appointment?.status === 'signed' 
                          ? 'Ready for HMRC application' 
                          : 'Requires agent appointment first'
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Funding Rounds */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Funding Rounds</h4>
                  {company.funding_rounds.length > 0 ? (
                    <div className="space-y-2">
                      {company.funding_rounds.map((round) => (
                        <div key={round.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{round.scheme}</Badge>
                            <span className="font-medium">{formatCurrency(round.amount_to_raise)}</span>
                            <Badge className={getStatusColor(round.status)}>
                              {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {new Date(round.created_at).toLocaleDateString()}
                            </span>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No funding rounds yet</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        Create Funding Round
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
