// Companies House API integration
// API documentation: https://developer-specs.company-information.service.gov.uk/

interface CompaniesHouseCompany {
  company_name: string;
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    postal_code?: string;
    country?: string;
    region?: string;
  };
  accounts?: {
    next_due?: string;
    next_made_up_to?: string;
    accounting_reference_date?: {
      day: string;
      month: string;
    };
  };
  confirmation_statement?: {
    next_due?: string;
    next_made_up_to?: string;
  };
  sic_codes?: string[];
}

interface CompaniesHouseOfficer {
  name: string;
  officer_role: string;
  appointed_on?: string;
  resigned_on?: string;
  date_of_birth?: {
    month: number;
    year: number;
  };
  nationality?: string;
  country_of_residence?: string;
  occupation?: string;
}

interface CompaniesHouseApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class CompaniesHouseAPI {
  private baseUrl = 'https://api.company-information.service.gov.uk';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Companies House API key not found. Set COMPANIES_HOUSE_API_KEY environment variable.');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<CompaniesHouseApiResponse<T>> {
    if (!this.apiKey) {
      return {
        error: 'Companies House API key not configured',
        status: 500
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            error: 'Company not found',
            status: 404
          };
        }
        return {
          error: `API request failed: ${response.statusText}`,
          status: response.status
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status
      };
    } catch (error) {
      return {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 500
      };
    }
  }

  async getCompanyByNumber(companyNumber: string): Promise<CompaniesHouseApiResponse<CompaniesHouseCompany>> {
    // Remove any spaces and convert to uppercase
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase();
    
    // Pad with leading zeros if needed (UK company numbers are typically 8 digits)
    const paddedNumber = cleanCompanyNumber.padStart(8, '0');
    
    return this.makeRequest<CompaniesHouseCompany>(`/company/${paddedNumber}`);
  }

  async getCompanyOfficers(companyNumber: string): Promise<CompaniesHouseApiResponse<{ items: CompaniesHouseOfficer[] }>> {
    const cleanCompanyNumber = companyNumber.replace(/\s+/g, '').toUpperCase();
    const paddedNumber = cleanCompanyNumber.padStart(8, '0');
    
    return this.makeRequest<{ items: CompaniesHouseOfficer[] }>(`/company/${paddedNumber}/officers`);
  }

  async searchCompanies(query: string): Promise<CompaniesHouseApiResponse<{ items: CompaniesHouseCompany[] }>> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest<{ items: CompaniesHouseCompany[] }>(`/search/companies?q=${encodedQuery}&items_per_page=20`);
  }

  // Helper function to format company data for our database
  formatCompanyData(company: CompaniesHouseCompany) {
    const address = company.registered_office_address;
    const formattedAddress = [
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.postal_code,
      address.country
    ].filter(Boolean).join(', ');

    return {
      name: company.company_name,
      crn: company.company_number,
      incorporation_date: company.date_of_creation,
      registered_address: formattedAddress,
      company_status: company.company_status,
      company_type: company.company_type,
      sic_codes: company.sic_codes || [],
    };
  }

  // Helper function to get active directors
  getActiveDirectors(officers: CompaniesHouseOfficer[]) {
    return officers
      .filter(officer => 
        officer.officer_role.toLowerCase().includes('director') && 
        !officer.resigned_on
      )
      .map(officer => ({
        name: officer.name,
        role: officer.officer_role,
        appointed_on: officer.appointed_on,
        nationality: officer.nationality,
        occupation: officer.occupation,
      }));
  }

  // Validate if company is eligible for SEIS/EIS based on basic criteria
  checkBasicEligibility(company: CompaniesHouseCompany) {
    const incorporationDate = new Date(company.date_of_creation);
    const now = new Date();
    const ageInYears = (now.getTime() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const issues: string[] = [];
    let isEligible = true;

    // Check company status
    if (company.company_status !== 'active') {
      issues.push('Company is not active');
      isEligible = false;
    }

    // Check company type
    const eligibleTypes = ['ltd', 'private-limited-guarant-nsc-limited-exemption', 'private-limited-guarant-nsc'];
    if (!eligibleTypes.includes(company.company_type)) {
      issues.push('Company type may not be eligible for SEIS/EIS');
    }

    // Age check for SEIS (must be less than 2 years old)
    const seisEligible = ageInYears < 2;
    
    // Age check for EIS (must be less than 7 years old, or less than 10 for knowledge-intensive companies)
    const eisEligible = ageInYears < 7;

    return {
      is_seis_eligible: seisEligible && isEligible,
      is_eis_eligible: eisEligible && isEligible,
      company_age_years: Math.round(ageInYears * 10) / 10,
      issues,
      incorporation_date: incorporationDate,
    };
  }
}

export const companiesHouseAPI = new CompaniesHouseAPI();

// Export types for use in other files
export type { CompaniesHouseCompany, CompaniesHouseOfficer, CompaniesHouseApiResponse };
