'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Search } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  crn: string;
  incorporation_date: string;
  registered_address: string;
  contact_name: string;
  contact_email: string;
}

interface EligibilityStepProps {
  company: Company | null;
  onContinue: () => void;
}

interface EligibilityData {
  gross_assets: number;
  employees: number;
  is_parent_company: boolean;
  has_subsidiaries: boolean;
  trading_activity: string;
  sic_codes: string[];
  scheme: 'SEIS' | 'EIS' | 'BOTH';
  amount_to_raise: number;
  use_of_funds: string;
  first_time_applicant: boolean;
}

interface EligibilityResult {
  result: 'ELIGIBLE' | 'INELIGIBLE' | 'REVIEW_REQUIRED';
  reasons: string[];
  checks_performed: Record<string, boolean>;
  recommendations?: string[];
}

export default function EligibilityStep({ company, onContinue }: EligibilityStepProps) {
  const [loading, setLoading] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<EligibilityData>({
    gross_assets: 0,
    employees: 0,
    is_parent_company: false,
    has_subsidiaries: false,
    trading_activity: '',
    sic_codes: [],
    scheme: 'BOTH',
    amount_to_raise: 0,
    use_of_funds: '',
    first_time_applicant: true,
  });
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);

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

  const createFundingRound = async () => {
    try {
      const response = await fetch('/api/seis-eis/funding-rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: company.id,
          scheme: eligibilityData.scheme,
          amount_to_raise: eligibilityData.amount_to_raise,
          use_of_funds: eligibilityData.use_of_funds,
          first_time_applicant: eligibilityData.first_time_applicant,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        return result.round.id;
      } else {
        throw new Error(result.error || 'Failed to create funding round');
      }
    } catch (error) {
      console.error('Error creating funding round:', error);
      throw error;
    }
  };

  const runEligibilityCheck = async () => {
    setLoading(true);
    try {
      // First create a funding round if we don't have one
      let currentRoundId = roundId;
      if (!currentRoundId) {
        currentRoundId = await createFundingRound();
        setRoundId(currentRoundId);
      }

      const response = await fetch('/api/seis-eis/eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: company.id,
          round_id: currentRoundId,
          ...eligibilityData,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setEligibilityResult(result.eligibility);
      } else {
        throw new Error(result.error || 'Eligibility check failed');
      }
    } catch (error) {
      console.error('Error running eligibility check:', error);
      alert('Failed to run eligibility check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'ELIGIBLE':
        return 'bg-green-100 text-green-800';
      case 'INELIGIBLE':
        return 'bg-red-100 text-red-800';
      case 'REVIEW_REQUIRED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (eligibilityResult) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          {eligibilityResult.result === 'ELIGIBLE' ? (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : eligibilityResult.result === 'INELIGIBLE' ? (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          ) : (
            <Search className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Eligibility Check Complete</h3>
          <Badge className={getResultColor(eligibilityResult.result)} variant="outline">
            {eligibilityResult.result.replace('_', ' ')}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Eligibility Results</CardTitle>
            <CardDescription>
              Based on the information provided, here are the eligibility findings:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibilityResult.reasons.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Findings:</h4>
                <ul className="space-y-1">
                  {eligibilityResult.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {eligibilityResult.recommendations && eligibilityResult.recommendations.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {eligibilityResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setEligibilityResult(null)}
              >
                Run New Check
              </Button>
              <Button onClick={onContinue} className="flex-1">
                Continue to Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Search className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">SEIS/EIS Eligibility Check</h3>
        <p className="text-gray-600 mb-6">
          Provide information about your company and funding round to check eligibility for SEIS/EIS schemes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Tell us about your company's current status and structure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gross Assets (£)</label>
              <Input
                type="number"
                value={eligibilityData.gross_assets}
                onChange={(e) => setEligibilityData(prev => ({
                  ...prev,
                  gross_assets: parseInt(e.target.value) || 0
                }))}
                placeholder="e.g. 200000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Employees</label>
              <Input
                type="number"
                value={eligibilityData.employees}
                onChange={(e) => setEligibilityData(prev => ({
                  ...prev,
                  employees: parseInt(e.target.value) || 0
                }))}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Trading Activity</label>
            <Input
              value={eligibilityData.trading_activity}
              onChange={(e) => setEligibilityData(prev => ({
                ...prev,
                trading_activity: e.target.value
              }))}
              placeholder="Describe your main business activity"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="parent_company"
                checked={eligibilityData.is_parent_company}
                onChange={(e) => setEligibilityData(prev => ({
                  ...prev,
                  is_parent_company: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="parent_company" className="text-sm">Is parent company</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has_subsidiaries"
                checked={eligibilityData.has_subsidiaries}
                onChange={(e) => setEligibilityData(prev => ({
                  ...prev,
                  has_subsidiaries: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="has_subsidiaries" className="text-sm">Has subsidiaries</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funding Round Details</CardTitle>
          <CardDescription>
            Information about the funding round you're seeking approval for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scheme Type</label>
            <select
              value={eligibilityData.scheme}
              onChange={(e) => setEligibilityData(prev => ({
                ...prev,
                scheme: e.target.value as 'SEIS' | 'EIS' | 'BOTH'
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="SEIS">SEIS Only</option>
              <option value="EIS">EIS Only</option>
              <option value="BOTH">Both SEIS and EIS</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Raise (£)</label>
              <Input
                type="number"
                value={eligibilityData.amount_to_raise}
                onChange={(e) => setEligibilityData(prev => ({
                  ...prev,
                  amount_to_raise: parseInt(e.target.value) || 0
                }))}
                placeholder="e.g. 150000"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="first_time"
                checked={eligibilityData.first_time_applicant}
                onChange={(e) => setEligibilityData(prev => ({
                  ...prev,
                  first_time_applicant: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="first_time" className="text-sm">First-time applicant</label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Use of Funds</label>
            <textarea
              value={eligibilityData.use_of_funds}
              onChange={(e) => setEligibilityData(prev => ({
                ...prev,
                use_of_funds: e.target.value
              }))}
              placeholder="Describe how the funds will be used"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={runEligibilityCheck}
          disabled={loading || !eligibilityData.amount_to_raise}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Check...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Run Eligibility Check
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
