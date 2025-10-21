import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseAPI } from '@/lib/companies-house';

export async function GET(
  request: NextRequest,
  { params }: { params: { crn: string } }
) {
  try {
    const { crn } = params;

    if (!crn) {
      return NextResponse.json(
        { error: 'Company registration number is required' },
        { status: 400 }
      );
    }

    // Get company details
    const companyResponse = await companiesHouseAPI.getCompanyByNumber(crn);
    
    if (companyResponse.error) {
      return NextResponse.json(
        { error: companyResponse.error },
        { status: companyResponse.status }
      );
    }

    if (!companyResponse.data) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get company officers (directors)
    const officersResponse = await companiesHouseAPI.getCompanyOfficers(crn);
    
    // Format the data
    const formattedCompany = companiesHouseAPI.formatCompanyData(companyResponse.data);
    const eligibility = companiesHouseAPI.checkBasicEligibility(companyResponse.data);
    
    let directors: any[] = [];
    if (officersResponse.data?.items) {
      directors = companiesHouseAPI.getActiveDirectors(officersResponse.data.items);
    }

    return NextResponse.json({
      company: {
        ...formattedCompany,
        directors,
        eligibility,
      }
    });

  } catch (error) {
    console.error('Companies House API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
