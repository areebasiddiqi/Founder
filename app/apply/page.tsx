'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Circle, AlertCircle, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface Company {
  id: string;
  name: string;
  crn: string;
  incorporation_date: string;
  registered_address: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
}

export default function ApplyPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [company, setCompany] = useState<Company | null>(null);

  const steps: Step[] = [
    {
      id: 'subscription',
      title: 'Subscription Check',
      description: 'Verify SEIS/EIS plan subscription',
      completed: false,
      current: true,
    },
    {
      id: 'company',
      title: 'Company Details',
      description: 'Enter your company information',
      completed: false,
      current: false,
    },
    {
      id: 'authorisation',
      title: 'Authorisation Letter',
      description: 'Sign agent authorisation',
      completed: false,
      current: false,
    },
    {
      id: 'eligibility',
      title: 'Eligibility Check',
      description: 'Check SEIS/EIS eligibility',
      completed: false,
      current: false,
    },
    {
      id: 'documents',
      title: 'Upload Documents',
      description: 'Upload required documents',
      completed: false,
      current: false,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review and submit application',
      completed: false,
      current: false,
    },
  ];

  useEffect(() => {
    checkUserAndSubscription();
  }, []);

  const checkUserAndSubscription = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      // Check subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSubscription(sub);

      if (!sub || sub.plan_type !== 'seis_eis_plan' || sub.status !== 'active') {
        // User needs to subscribe
        setCurrentStep(0);
      } else {
        // Check if user has existing companies
        const { data: companies } = await supabase
          .from('companies')
          .select('*')
          .eq('founder_id', user.id)
          .limit(1);

        if (companies && companies.length > 0) {
          setCompany(companies[0]);
          setCurrentStep(2); // Skip to authorisation
        } else {
          setCurrentStep(1); // Go to company details
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_seis_eis_monthly', // Replace with actual Stripe price ID
          successUrl: `${window.location.origin}/apply?success=true`,
          cancelUrl: `${window.location.origin}/apply`,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEIS/EIS Advance Assurance Application</h1>
          <p className="text-gray-600 mt-2">
            Complete your application for SEIS/EIS Advance Assurance with our authorised agent service.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStep 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep]?.title}</CardTitle>
            <CardDescription>{steps[currentStep]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && <SubscriptionStep 
              subscription={subscription} 
              onSubscribe={handleSubscribe}
              onContinue={() => setCurrentStep(1)}
            />}
            {currentStep === 1 && <CompanyDetailsStep 
              user={user}
              onCompanyCreated={(company: Company) => {
                setCompany(company);
                setCurrentStep(2);
              }}
            />}
            {currentStep === 2 && <AuthorisationStep 
              company={company}
              onContinue={() => setCurrentStep(3)}
            />}
            {currentStep === 3 && <EligibilityStep 
              company={company}
              onContinue={() => setCurrentStep(4)}
            />}
            {currentStep === 4 && <DocumentsStep 
              company={company}
              onContinue={() => setCurrentStep(5)}
            />}
            {currentStep === 5 && <ReviewStep 
              company={company}
              onSubmit={() => {
                // Handle final submission
                router.push('/dashboard?success=application_submitted');
              }}
            />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step Components
function SubscriptionStep({ subscription, onSubscribe, onContinue }: any) {
  const hasValidSubscription = subscription?.plan_type === 'seis_eis_plan' && subscription?.status === 'active';

  if (hasValidSubscription) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Active</h3>
        <p className="text-gray-600 mb-6">
          You have an active SEIS/EIS Agent Service subscription.
        </p>
        <Button onClick={onContinue}>Continue to Application</Button>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Required</h3>
      <p className="text-gray-600 mb-6">
        You need an active SEIS/EIS Agent Service subscription (£9/month) to access this application workflow.
      </p>
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">What's included:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Full SEIS/EIS application workflow</li>
          <li>• Authorised agent representation</li>
          <li>• Document validation & compilation</li>
          <li>• HMRC submission management</li>
          <li>• Compliance tracking & reminders</li>
          <li>• Priority support</li>
        </ul>
      </div>
      <Button onClick={onSubscribe} size="lg">
        Subscribe for £9/month
      </Button>
    </div>
  );
}

function CompanyDetailsStep({ user, onCompanyCreated }: any) {
  const [loading, setLoading] = useState(false);
  const [crn, setCrn] = useState('');
  const [companyData, setCompanyData] = useState<any>(null);
  const [error, setError] = useState('');

  const lookupCompany = async () => {
    if (!crn.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/companies-house/${crn}`);
      const data = await response.json();
      
      if (response.ok) {
        setCompanyData(data.company);
      } else {
        setError(data.error || 'Company not found');
      }
    } catch (error) {
      setError('Failed to lookup company');
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!companyData) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/seis-eis/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyData.name,
          crn: companyData.crn,
          incorporation_date: companyData.incorporation_date,
          registered_address: companyData.registered_address,
          contact_name: user.user_metadata?.full_name || '',
          contact_email: user.email,
          is_seis_candidate: companyData.eligibility?.is_seis_eligible,
          is_eis_candidate: companyData.eligibility?.is_eis_eligible,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        onCompanyCreated(result.company);
      } else {
        setError(result.error || 'Failed to create company');
      }
    } catch (error) {
      setError('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Registration Number (CRN)
        </label>
        <div className="flex gap-2">
          <Input
            value={crn}
            onChange={(e) => setCrn(e.target.value)}
            placeholder="e.g. 12345678"
            className="flex-1"
          />
          <Button onClick={lookupCompany} disabled={loading || !crn.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
          </Button>
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
      </div>

      {companyData && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Company Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {companyData.name}
            </div>
            <div>
              <span className="font-medium">CRN:</span> {companyData.crn}
            </div>
            <div>
              <span className="font-medium">Incorporated:</span> {companyData.incorporation_date}
            </div>
            <div>
              <span className="font-medium">Status:</span> {companyData.company_status}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Address:</span> {companyData.registered_address}
            </div>
          </div>
          
          {companyData.eligibility && (
            <div className="mt-4 p-4 bg-white rounded border">
              <h4 className="font-medium mb-2">Initial Eligibility Assessment</h4>
              <div className="flex gap-4">
                <div className={`flex items-center gap-2 ${companyData.eligibility.is_seis_eligible ? 'text-green-600' : 'text-red-600'}`}>
                  {companyData.eligibility.is_seis_eligible ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  SEIS Eligible
                </div>
                <div className={`flex items-center gap-2 ${companyData.eligibility.is_eis_eligible ? 'text-green-600' : 'text-red-600'}`}>
                  {companyData.eligibility.is_eis_eligible ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  EIS Eligible
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Company age: {companyData.eligibility.company_age_years} years
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <Button onClick={createCompany} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Continue with this Company
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthorisationStep({ company, onContinue }: any) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Authorisation Letter</h3>
      <p className="text-gray-600 mb-6">
        You need to sign an authorisation letter allowing us to act as your agent with HMRC.
      </p>
      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> E-signature integration will be implemented in the next phase. 
          For now, please contact support to complete this step.
        </p>
      </div>
      <Button onClick={onContinue}>Continue (Skip for Demo)</Button>
    </div>
  );
}

function EligibilityStep({ company, onContinue }: any) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Check</h3>
      <p className="text-gray-600 mb-6">
        We'll run a comprehensive eligibility check for SEIS/EIS schemes.
      </p>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          Detailed eligibility checking will be implemented in the next phase.
        </p>
      </div>
      <Button onClick={onContinue}>Continue (Skip for Demo)</Button>
    </div>
  );
}

function DocumentsStep({ company, onContinue }: any) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
      <p className="text-gray-600 mb-6">
        Upload all required documents for your SEIS/EIS application.
      </p>
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-green-800">
          Document upload and validation will be implemented in the next phase.
        </p>
      </div>
      <Button onClick={onContinue}>Continue (Skip for Demo)</Button>
    </div>
  );
}

function ReviewStep({ company, onSubmit }: any) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h3>
      <p className="text-gray-600 mb-6">
        Review your application and submit to HMRC.
      </p>
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-purple-800">
          Final review and submission will be implemented in the next phase.
        </p>
      </div>
      <Button onClick={onSubmit}>Submit Application (Demo)</Button>
    </div>
  );
}
