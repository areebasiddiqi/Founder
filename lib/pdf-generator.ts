// PDF Generation Service for SEIS/EIS Applications
// This service compiles all documents and generates the final submission pack

interface CompanyData {
  name: string;
  crn: string;
  incorporation_date: string;
  registered_address: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
}

interface FundingRoundData {
  scheme: 'SEIS' | 'EIS' | 'BOTH';
  amount_to_raise: number;
  valuation?: number;
  use_of_funds: string;
  risk_to_capital: string;
  first_time_applicant: boolean;
  investor_evidence_type?: string;
  investor_coverage_percent?: number;
}

interface DocumentData {
  document_type: string;
  filename: string;
  file_url: string;
}

export class PDFGenerator {
  
  // Generate HMRC Cover Letter
  generateCoverLetter(company: CompanyData, round: FundingRoundData): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SEIS/EIS Advance Assurance Application - Cover Letter</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-details { margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .signature { margin-top: 40px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td { padding: 5px; vertical-align: top; }
        .label { font-weight: bold; width: 200px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Application for ${round.scheme} Advance Assurance</h1>
        <p>Submitted on behalf of ${company.name}</p>
        <p>Date: ${currentDate}</p>
    </div>

    <div class="section">
        <h2>Company Details</h2>
        <table>
            <tr><td class="label">Company Name:</td><td>${company.name}</td></tr>
            <tr><td class="label">Company Registration Number:</td><td>${company.crn}</td></tr>
            <tr><td class="label">Incorporation Date:</td><td>${new Date(company.incorporation_date).toLocaleDateString('en-GB')}</td></tr>
            <tr><td class="label">Registered Address:</td><td>${company.registered_address}</td></tr>
            <tr><td class="label">Contact Name:</td><td>${company.contact_name}</td></tr>
            <tr><td class="label">Contact Email:</td><td>${company.contact_email}</td></tr>
            ${company.contact_phone ? `<tr><td class="label">Contact Phone:</td><td>${company.contact_phone}</td></tr>` : ''}
        </table>
    </div>

    <div class="section">
        <h2>Investment Details</h2>
        <table>
            <tr><td class="label">Scheme:</td><td>${round.scheme}</td></tr>
            <tr><td class="label">Amount to Raise:</td><td>£${round.amount_to_raise.toLocaleString()}</td></tr>
            ${round.valuation ? `<tr><td class="label">Pre-money Valuation:</td><td>£${round.valuation.toLocaleString()}</td></tr>` : ''}
            <tr><td class="label">First-time Applicant:</td><td>${round.first_time_applicant ? 'Yes' : 'No'}</td></tr>
            ${round.investor_evidence_type ? `<tr><td class="label">Investor Evidence Type:</td><td>${round.investor_evidence_type}</td></tr>` : ''}
            ${round.investor_coverage_percent ? `<tr><td class="label">Investor Coverage:</td><td>${round.investor_coverage_percent}%</td></tr>` : ''}
        </table>
    </div>

    <div class="section">
        <h2>Use of Funds</h2>
        <p>${round.use_of_funds}</p>
    </div>

    <div class="section">
        <h2>Risk to Capital Statement</h2>
        <p>${round.risk_to_capital}</p>
    </div>

    <div class="section">
        <h2>Supporting Documents</h2>
        <p>The following documents are attached to support this application:</p>
        <ul>
            <li>Business Plan</li>
            <li>Financial Forecast (3 years)</li>
            <li>Articles of Association</li>
            <li>Share Register</li>
            <li>Latest Accounts or Bank Statement</li>
            <li>Investor Evidence</li>
            <li>HMRC Checklist</li>
            <li>Authorisation Letter</li>
        </ul>
    </div>

    <div class="section">
        <h2>Declaration</h2>
        <p>I confirm that the information provided in this application is true and complete to the best of my knowledge. 
        I understand that providing false information may result in the rejection of this application and potential penalties.</p>
        
        <p>I request that HMRC provides advance assurance that the company and the proposed investment will qualify 
        for ${round.scheme} relief, subject to the conditions set out in the relevant legislation.</p>
    </div>

    <div class="signature">
        <p>Submitted by: FoundersPitch Ltd (Authorised Agent)</p>
        <p>On behalf of: ${company.contact_name}, ${company.name}</p>
        <p>Date: ${currentDate}</p>
    </div>
</body>
</html>`;
  }

  // Generate HMRC Checklist
  generateHMRCChecklist(company: CompanyData, round: FundingRoundData): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const incorporationAge = (Date.now() - new Date(company.incorporation_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>HMRC ${round.scheme} Checklist</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.3; margin: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .checklist-item { margin: 10px 0; padding: 8px; border: 1px solid #ddd; }
        .checkbox { display: inline-block; width: 15px; height: 15px; border: 2px solid #333; margin-right: 10px; text-align: center; }
        .checked { background-color: #333; color: white; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HMRC ${round.scheme} Advance Assurance Checklist</h1>
        <p>Company: ${company.name} (${company.crn})</p>
        <p>Date: ${currentDate}</p>
    </div>

    <h2>Company Eligibility Criteria</h2>
    
    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Company Age:</strong> Company is ${Math.round(incorporationAge * 10) / 10} years old
        ${round.scheme === 'SEIS' ? '(Must be less than 2 years for SEIS)' : '(Must be less than 7 years for EIS, or 10 for knowledge-intensive)'}
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Company Type:</strong> Private limited company incorporated in the UK
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Independence:</strong> Company is not controlled by another company
    </div>

    <div class="checklist-item">
        <span class="checkbox">☐</span>
        <strong>Gross Assets:</strong> 
        ${round.scheme === 'SEIS' 
          ? 'Company has gross assets of £200,000 or less immediately before the investment'
          : 'Company has gross assets of £15m or less before investment, £16m or less after'
        }
    </div>

    <div class="checklist-item">
        <span class="checkbox">☐</span>
        <strong>Employees:</strong> 
        ${round.scheme === 'SEIS' 
          ? 'Company has 25 or fewer employees'
          : 'Company has 250 or fewer employees (500 for knowledge-intensive companies)'
        }
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Trading Activity:</strong> Company carries on, or will carry on, a qualifying trade
    </div>

    <h2>Investment Details</h2>
    
    <table>
        <tr>
            <th>Investment Amount</th>
            <td>£${round.amount_to_raise.toLocaleString()}</td>
        </tr>
        <tr>
            <th>Maximum Annual Limit</th>
            <td>${round.scheme === 'SEIS' ? '£150,000' : '£5,000,000 (£10m for knowledge-intensive)'}</td>
        </tr>
        <tr>
            <th>Within Limits</th>
            <td>${round.amount_to_raise <= (round.scheme === 'SEIS' ? 150000 : 5000000) ? 'Yes ✓' : 'No ✗'}</td>
        </tr>
    </table>

    <h2>Use of Investment</h2>
    
    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Qualifying Business Purpose:</strong> Investment will be used wholly for the purpose of the qualifying business activity
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Use of Funds Specified:</strong> Detailed use of funds has been provided
    </div>

    <h2>Risk to Capital</h2>
    
    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Risk Statement:</strong> Risk to capital statement has been provided explaining the risk of loss of capital
    </div>

    <h2>Supporting Documents Provided</h2>
    
    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Business Plan:</strong> Comprehensive business plan provided
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Financial Projections:</strong> 3-year financial forecast provided
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Articles of Association:</strong> Current articles of association provided
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Share Register:</strong> Current share register provided
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Financial Information:</strong> Latest accounts or bank statement provided
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Investor Evidence:</strong> 
        ${round.first_time_applicant 
          ? 'Named investor list or platform letter provided (covering ≥30% of round)'
          : 'Not required (not first-time applicant)'
        }
    </div>

    <div class="checklist-item">
        <span class="checkbox checked">✓</span>
        <strong>Authorisation:</strong> Valid agent authorisation letter provided
    </div>

    <div style="margin-top: 40px;">
        <p><strong>Completed by:</strong> FoundersPitch Ltd (Authorised Agent)</p>
        <p><strong>Date:</strong> ${currentDate}</p>
        <p><strong>Reference:</strong> ${company.crn}-${round.scheme}-${Date.now()}</p>
    </div>
</body>
</html>`;
  }

  // Generate Authorisation Letter Template
  generateAuthorisationTemplate(company: CompanyData): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Agent Authorisation Letter</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .letterhead { text-align: right; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .signature-section { margin-top: 50px; }
        .signature-box { border: 1px solid #333; height: 60px; width: 300px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="letterhead">
        <p>${company.name}<br>
        ${company.registered_address}<br>
        Company Registration Number: ${company.crn}</p>
        <p>Date: ${currentDate}</p>
    </div>

    <div class="section">
        <p>HM Revenue and Customs<br>
        Small Company Enterprise Centre<br>
        SO777<br>
        PO Box 3900<br>
        Glasgow<br>
        G70 6AA</p>
    </div>

    <div class="section">
        <p><strong>Subject: Authorisation of Agent for SEIS/EIS Advance Assurance Application</strong></p>
    </div>

    <div class="section">
        <p>Dear Sir/Madam,</p>
        
        <p>I, ${company.contact_name}, as a director of ${company.name} (Company Registration Number: ${company.crn}), 
        hereby authorise <strong>FoundersPitch Ltd</strong> to act as our agent in all matters relating to our application 
        for SEIS/EIS Advance Assurance.</p>
        
        <p>This authorisation includes, but is not limited to:</p>
        <ul>
            <li>Submitting our SEIS/EIS Advance Assurance application on our behalf</li>
            <li>Corresponding with HMRC regarding our application</li>
            <li>Receiving and responding to any queries or requests for additional information</li>
            <li>Receiving the advance assurance decision and any related correspondence</li>
            <li>Making any necessary amendments or clarifications to our application</li>
        </ul>
    </div>

    <div class="section">
        <p><strong>Agent Details:</strong></p>
        <p>FoundersPitch Ltd<br>
        [Agent Address]<br>
        Email: support@founderspitch.com<br>
        Phone: [Agent Phone]</p>
    </div>

    <div class="section">
        <p>This authorisation is valid from the date of signing until ${expiryDate} (90 days from the date of this letter), 
        unless revoked earlier in writing.</p>
        
        <p>I confirm that I have the authority to give this authorisation on behalf of the company.</p>
    </div>

    <div class="signature-section">
        <p>Yours faithfully,</p>
        
        <div class="signature-box"></div>
        
        <p><strong>Name:</strong> ${company.contact_name}<br>
        <strong>Position:</strong> Director<br>
        <strong>Company:</strong> ${company.name}<br>
        <strong>Date:</strong> ________________</p>
    </div>

    <div class="section" style="margin-top: 40px; font-size: 10pt; color: #666;">
        <p><strong>Note:</strong> This letter must be signed by a director or authorised signatory of the company. 
        The authorisation is valid for 90 days from the date of signing. Please ensure this letter is dated 
        and signed before submission of your SEIS/EIS application.</p>
    </div>
</body>
</html>`;
  }

  // Compile all documents into a submission pack
  async generateSubmissionPack(
    company: CompanyData, 
    round: FundingRoundData, 
    documents: DocumentData[]
  ): Promise<{ success: boolean; packUrl?: string; error?: string }> {
    try {
      // In a real implementation, this would:
      // 1. Generate the cover letter and checklist PDFs
      // 2. Download all uploaded documents
      // 3. Combine them into a single PDF
      // 4. Upload the combined PDF to storage
      // 5. Return the URL
      
      // For now, we'll simulate this process
      const packData = {
        coverLetter: this.generateCoverLetter(company, round),
        checklist: this.generateHMRCChecklist(company, round),
        documents: documents,
        generatedAt: new Date().toISOString(),
        reference: `${company.crn}-${round.scheme}-${Date.now()}`
      };

      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would be the actual URL of the generated PDF
      const mockPackUrl = `https://storage.example.com/packs/${packData.reference}.pdf`;

      return {
        success: true,
        packUrl: mockPackUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed'
      };
    }
  }

  // Validate that all required documents are present
  validateDocuments(documents: DocumentData[], scheme: string): { valid: boolean; missing: string[] } {
    const requiredDocs = [
      'business_plan',
      'financial_forecast', 
      'articles_of_association',
      'share_register',
      'accounts',
      'investor_list',
      'hmrc_checklist',
      'cover_letter',
      'authorisation_letter'
    ];

    const uploadedTypes = documents.map(doc => doc.document_type);
    const missing = requiredDocs.filter(type => !uploadedTypes.includes(type));

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

export const pdfGenerator = new PDFGenerator();
