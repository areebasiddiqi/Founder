import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseAPI } from '@/lib/companies-house';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const response = await companiesHouseAPI.searchCompanies(query);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status }
      );
    }

    if (!response.data?.items) {
      return NextResponse.json({
        companies: []
      });
    }

    // Format the search results
    const companies = response.data.items.map(company => ({
      ...companiesHouseAPI.formatCompanyData(company),
      eligibility: companiesHouseAPI.checkBasicEligibility(company),
    }));

    return NextResponse.json({
      companies
    });

  } catch (error) {
    console.error('Companies House search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
