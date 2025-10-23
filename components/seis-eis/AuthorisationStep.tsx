'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Download, AlertCircle } from 'lucide-react';
import AgentAppointment from './agent-appointment';

interface Company {
  id: string;
  company_name: string;
  crn: string;
  incorporation_date: string;
  registered_address: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
}

interface AuthorisationStepProps {
  company: Company | null;
  onContinue: () => void;
}

export default function AuthorisationStep({ company, onContinue }: AuthorisationStepProps) {
  const [showAgentAppointment, setShowAgentAppointment] = useState(false);
  const [appointmentCompleted, setAppointmentCompleted] = useState(false);

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

  if (showAgentAppointment) {
    return (
      <AgentAppointment
        company={company}
        onComplete={(appointmentData) => {
          setAppointmentCompleted(true);
          setShowAgentAppointment(false);
        }}
      />
    );
  }

  if (appointmentCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authorisation Complete</h3>
        <p className="text-gray-600 mb-6">
          SurgeAI Ltd is now authorized to act as your agent for SEIS/EIS applications.
        </p>
        <Button onClick={onContinue} size="lg">
          Continue to Eligibility Check
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Authorisation Required</h3>
        <p className="text-gray-600 mb-6">
          To proceed with your SEIS/EIS application, you need to authorize SurgeAI Ltd to act as your agent with HMRC.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is Agent Authorisation?</CardTitle>
          <CardDescription>
            This legal document allows us to represent your company in dealings with HMRC for SEIS/EIS matters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What we can do as your agent:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Submit SEIS/EIS applications on your behalf</li>
              <li>• Respond to HMRC queries and requests</li>
              <li>• Receive correspondence from HMRC</li>
              <li>• Provide updates on application status</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">What we cannot do:</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Make financial commitments on your behalf</li>
              <li>• Enter into contracts for your company</li>
              <li>• Act as a director or officer</li>
              <li>• Make decisions requiring board approval</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setShowAgentAppointment(true)} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Generate Authorisation Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
