// DocuSign integration utilities
// This is a mock implementation - replace with actual DocuSign SDK integration

export interface DocuSignEnvelope {
  envelopeId: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed';
  signers: {
    name: string;
    email: string;
    status: 'created' | 'sent' | 'delivered' | 'signed';
  }[];
  documents: {
    documentId: string;
    name: string;
    pages: number;
  }[];
}

export interface DocuSignSigner {
  name: string;
  email: string;
  recipientId: string;
}

export interface DocuSignDocument {
  documentId: string;
  name: string;
  documentBase64: string;
  fileExtension: string;
}

class DocuSignService {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    // In production, these would come from environment variables
    this.baseUrl = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi';
  }

  async authenticate(): Promise<boolean> {
    // Mock authentication - in production, implement OAuth flow
    // For now, simulate successful authentication
    this.accessToken = 'mock_access_token';
    return true;
  }

  async createEnvelope(
    document: DocuSignDocument,
    signers: DocuSignSigner[],
    emailSubject: string,
    emailMessage: string
  ): Promise<DocuSignEnvelope> {
    // Mock envelope creation
    // In production, this would make actual API calls to DocuSign
    
    const envelopeId = `mock_envelope_${Date.now()}`;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      envelopeId,
      status: 'created',
      signers: signers.map(signer => ({
        name: signer.name,
        email: signer.email,
        status: 'created'
      })),
      documents: [{
        documentId: document.documentId,
        name: document.name,
        pages: 1
      }]
    };
  }

  async sendEnvelope(envelopeId: string): Promise<DocuSignEnvelope> {
    // Mock sending envelope
    // In production, this would call DocuSign API to send the envelope
    
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      envelopeId,
      status: 'sent',
      signers: [{
        name: 'Mock Signer',
        email: 'signer@example.com',
        status: 'sent'
      }],
      documents: [{
        documentId: '1',
        name: 'Agent Appointment Agreement',
        pages: 1
      }]
    };
  }

  async getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope> {
    // Mock status check
    // In production, this would query DocuSign API for envelope status
    
    return {
      envelopeId,
      status: 'sent',
      signers: [{
        name: 'Mock Signer',
        email: 'signer@example.com',
        status: 'delivered'
      }],
      documents: [{
        documentId: '1',
        name: 'Agent Appointment Agreement',
        pages: 1
      }]
    };
  }

  async getSignedDocument(envelopeId: string, documentId: string): Promise<string> {
    // Mock document retrieval
    // In production, this would download the signed document from DocuSign
    
    return 'mock_signed_document_base64_content';
  }

  // Helper method to convert text document to base64
  textToBase64(text: string): string {
    return Buffer.from(text).toString('base64');
  }

  // Helper method to create agent appointment document for DocuSign
  createAgentAppointmentDocument(
    companyName: string,
    companyNumber: string,
    registeredAddress: string,
    directorName: string,
    directorTitle: string,
    startDate: string
  ): DocuSignDocument {
    const documentText = `AGENT APPOINTMENT AGREEMENT

This document appoints SurgeAI Ltd (hereinafter referred to as the "Agent") to act as an agent for ${companyName} (hereinafter referred to as the "Company"), a company registered in England and Wales with company number ${companyNumber} and registered office at ${registeredAddress}, for the specific purpose of obtaining SEIS/EIS approvals from HMRC.

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
This Appointment shall commence on ${new Date(startDate).toLocaleDateString('en-GB')} and shall remain in effect until terminated by either party upon 30 days written notice to the other party.
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
${directorName}
${directorTitle}

FOR THE AGENT:
____________________________
S. Bilkhu
Director (SurgeAI Ltd)

Date: ${new Date(startDate).toLocaleDateString('en-GB')}`;

    return {
      documentId: '1',
      name: 'Agent_Appointment_Agreement.txt',
      documentBase64: this.textToBase64(documentText),
      fileExtension: 'txt'
    };
  }
}

export const docuSignService = new DocuSignService();

// API endpoint helper for sending documents via DocuSign
export async function sendAgentAppointmentForSigning(
  companyData: {
    name: string;
    crn: string;
    registered_address: string;
    contact_name: string;
    contact_email: string;
  },
  directorTitle: string = 'Director',
  startDate: string = new Date().toISOString().split('T')[0]
): Promise<{ success: boolean; envelopeId?: string; error?: string }> {
  try {
    // Authenticate with DocuSign
    const authenticated = await docuSignService.authenticate();
    if (!authenticated) {
      throw new Error('Failed to authenticate with DocuSign');
    }

    // Create the document
    const document = docuSignService.createAgentAppointmentDocument(
      companyData.name,
      companyData.crn,
      companyData.registered_address,
      companyData.contact_name,
      directorTitle,
      startDate
    );

    // Define signers
    const signers: DocuSignSigner[] = [
      {
        name: companyData.contact_name,
        email: companyData.contact_email,
        recipientId: '1'
      },
      {
        name: 'S. Bilkhu',
        email: 'admin@surgeai.co.uk', // Replace with actual SurgeAI email
        recipientId: '2'
      }
    ];

    // Create envelope
    const envelope = await docuSignService.createEnvelope(
      document,
      signers,
      `Agent Appointment Agreement - ${companyData.name}`,
      `Please sign the agent appointment agreement for ${companyData.name} to proceed with SEIS/EIS applications.`
    );

    // Send envelope
    const sentEnvelope = await docuSignService.sendEnvelope(envelope.envelopeId);

    return {
      success: true,
      envelopeId: sentEnvelope.envelopeId
    };
  } catch (error) {
    console.error('DocuSign error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
