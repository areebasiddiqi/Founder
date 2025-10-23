'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Note: Using basic HTML elements instead of custom Label/Textarea components
import { FileText, Download, Send, CheckCircle } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  crn: string;
  incorporation_date: string;
  registered_address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface AgentAppointmentProps {
  company?: Company;
  onComplete: (appointmentData: any) => void;
}

export default function AgentAppointment({ company, onComplete }: AgentAppointmentProps) {
  const [formData, setFormData] = useState({
    directorName: company?.contact_name || '',
    directorEmail: company?.contact_email || '',
    directorTitle: 'Director',
    startDate: new Date().toISOString().split('T')[0],
    companyName: company?.company_name || '',
    companyNumber: company?.crn || '',
    registeredAddress: company?.registered_address || ''
  });

  const [step, setStep] = useState<'form' | 'preview' | 'docusign' | 'completed'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateDocument = () => {
    return `AGENT APPOINTMENT AGREEMENT

This document appoints SurgeAI Ltd (hereinafter referred to as the "Agent") to act as an agent for ${formData.companyName} (hereinafter referred to as the "Company"), a company registered in England and Wales with company number ${formData.companyNumber} and registered office at ${formData.registeredAddress}, for the specific purpose of obtaining SEIS/EIS approvals from HMRC.

1. Scope of Authority
The Company hereby grants the Agent the following limited powers to act on its behalf solely in connection with obtaining SEIS/EIS approvals from HMRC:
• Gather and prepare all necessary documentation required for SEIS/EIS applications, including business plans, financial forecasts, and company records.
• Liaise with HMRC on the Company's behalf regarding SEIS/EIS applications.
• Submit SEIS/EIS applications to HMRC on the Company's behalf.
• Respond to inquiries from HMRC related to SEIS/EIS applications.
• Sign documents specifically related to SEIS/EIS applications on the Company's behalf, provided they are pre-approved by a Company Director.

2. Limitations on Powers
The Agent is not authorized to:
• Enter into any contracts on the Company's behalf.
• Open or operate bank accounts in the Company's name.
• Make any financial commitments on the Company's behalf.
• Act as a director or officer of the Company.
• Take any action that would otherwise require the approval of the Company's Board of Directors.

3. Term and Termination
This Appointment shall commence on ${new Date(formData.startDate).toLocaleDateString('en-GB')} and shall remain in effect until terminated by either party upon 30 days written notice to the other party.
This Appointment may be terminated immediately by the Company if the Agent breaches this agreement, acts outside the scope of their authority, or fails to diligently pursue SEIS/EIS applications.

4. Fees and Expenses
The Agent's fees for services rendered under this appointment shall be zero. The Company shall reimburse the Agent for all reasonable out-of-pocket expenses incurred in connection with SEIS/EIS applications, upon presentation of receipts.

5. Governing Law
This Appointment shall be governed by and construed in accordance with the laws of England and Wales.

6. Entire Agreement
This Appointment constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior or contemporaneous communications, representations, or agreements, whether oral or written.

7. Notices
All notices and other communications hereunder shall be in writing and shall be deemed to have been duly given when delivered personally, sent by registered post or recorded delivery, or sent by email to the registered emails of the Agent or the Company.

8. Severability
If any provision of this Appointment is held by a court of competent jurisdiction to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall remain in full force and effect.

IN WITNESS WHEREOF, the parties hereto have executed this Appointment as of the date first written above.

FOR THE COMPANY:
________________________________
${formData.directorName}
${formData.directorTitle}

FOR THE AGENT:
____________________________
S. Bilkhu
Director (SurgeAI Ltd)

Date: ${new Date(formData.startDate).toLocaleDateString('en-GB')}`;
  };

  const downloadDocument = () => {
    const documentText = generateDocument();
    const blob = new Blob([documentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `Agent_Appointment_${formData.companyName.replace(/\s+/g, '_')}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendToDocuSign = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/docusign/send-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyNumber: formData.companyNumber,
          registeredAddress: formData.registeredAddress,
          directorName: formData.directorName,
          directorEmail: formData.directorEmail,
          directorTitle: formData.directorTitle,
          startDate: formData.startDate
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send document');
      }

      alert(`DocuSign envelope sent to ${formData.directorEmail}. Please check your email to sign the document.`);
      setStep('docusign');
    } catch (error) {
      console.error('Error sending to DocuSign:', error);
      alert(`Error sending document: ${error instanceof Error ? error.message : 'Unknown error'}. Please try downloading and signing manually.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsCompleted = () => {
    const appointmentData = {
      ...formData,
      document: generateDocument(),
      status: 'signed',
      signedAt: new Date().toISOString()
    };
    
    setStep('completed');
    onComplete(appointmentData);
  };

  if (step === 'form') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agent Appointment Agreement
          </CardTitle>
          <CardDescription>
            Complete the details below to generate the agent appointment document for SEIS/EIS applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="companyNumber" className="text-sm font-medium">Company Number</label>
              <Input
                id="companyNumber"
                value={formData.companyNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('companyNumber', e.target.value)}
                placeholder="Enter company registration number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="registeredAddress" className="text-sm font-medium">Registered Office Address</label>
            <textarea
              id="registeredAddress"
              value={formData.registeredAddress}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('registeredAddress', e.target.value)}
              placeholder="Enter registered office address"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="directorName" className="text-sm font-medium">Director Name</label>
              <Input
                id="directorName"
                value={formData.directorName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('directorName', e.target.value)}
                placeholder="Enter director's full name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="directorEmail" className="text-sm font-medium">Director Email</label>
              <Input
                id="directorEmail"
                type="email"
                value={formData.directorEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('directorEmail', e.target.value)}
                placeholder="Enter director's email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="directorTitle" className="text-sm font-medium">Director Title</label>
              <Input
                id="directorTitle"
                value={formData.directorTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('directorTitle', e.target.value)}
                placeholder="e.g., Director, Secretary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">Agreement Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('startDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setStep('preview')} className="flex-1">
              Preview Document
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
          <CardDescription>
            Review the agent appointment document before sending for signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {generateDocument()}
            </pre>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('form')}>
              Edit Details
            </Button>
            <Button variant="outline" onClick={downloadDocument}>
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
            <Button onClick={sendToDocuSign} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send via DocuSign
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'docusign') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Document Sent for Signature</CardTitle>
          <CardDescription>
            The agent appointment document has been sent to {formData.directorEmail} via DocuSign.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Send className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
            <p className="text-gray-600 mb-4">
              A DocuSign envelope has been sent to <strong>{formData.directorEmail}</strong>.
              Please check your email and follow the instructions to sign the document.
            </p>
            <p className="text-sm text-gray-500">
              Once signed, you can proceed with the SEIS/EIS application process.
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('preview')}>
              Back to Preview
            </Button>
            <Button onClick={markAsCompleted} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Signed (for testing)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'completed') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Agent Appointment Completed
          </CardTitle>
          <CardDescription>
            The agent appointment document has been signed and SurgeAI Ltd is now authorized to act on your behalf for SEIS/EIS applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• SurgeAI Ltd can now prepare your SEIS/EIS application</li>
              <li>• We will gather all necessary documentation</li>
              <li>• We will liaise with HMRC on your behalf</li>
              <li>• You will be kept informed throughout the process</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={downloadDocument} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Signed Document
            </Button>
            <Button onClick={() => onComplete(formData)} className="flex-1">
              Continue to Application
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
