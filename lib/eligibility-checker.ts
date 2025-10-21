// SEIS/EIS Eligibility Checker
// Based on HMRC guidelines for SEIS and EIS schemes

interface CompanyData {
  incorporation_date: string;
  gross_assets?: number;
  employees?: number;
  previous_seis_rounds?: number;
  previous_eis_rounds?: number;
  is_parent_company?: boolean;
  has_subsidiaries?: boolean;
  trading_activity?: string;
  sic_codes?: string[];
}

interface FundingRoundData {
  scheme: 'SEIS' | 'EIS' | 'BOTH';
  amount_to_raise: number;
  use_of_funds?: string;
  first_time_applicant?: boolean;
}

interface EligibilityResult {
  result: 'eligible' | 'possibly_eligible' | 'not_eligible';
  reasons: string[];
  checks_performed: {
    [key: string]: {
      passed: boolean;
      value?: any;
      threshold?: any;
      notes?: string;
    };
  };
}

export class EligibilityChecker {
  
  checkSEISEligibility(company: CompanyData, round: FundingRoundData): EligibilityResult {
    const checks: EligibilityResult['checks_performed'] = {};
    const reasons: string[] = [];
    let overallResult: 'eligible' | 'possibly_eligible' | 'not_eligible' = 'eligible';

    // 1. Company age check (must be less than 2 years old)
    const incorporationDate = new Date(company.incorporation_date);
    const ageInYears = (Date.now() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    checks.company_age = {
      passed: ageInYears < 2,
      value: Math.round(ageInYears * 10) / 10,
      threshold: 2,
      notes: 'Company must be less than 2 years old for SEIS'
    };

    if (!checks.company_age.passed) {
      reasons.push('Company is too old for SEIS (must be less than 2 years)');
      overallResult = 'not_eligible';
    }

    // 2. Gross assets check (must be £200,000 or less)
    if (company.gross_assets !== undefined) {
      checks.gross_assets = {
        passed: company.gross_assets <= 200000,
        value: company.gross_assets,
        threshold: 200000,
        notes: 'Gross assets must not exceed £200,000 for SEIS'
      };

      if (!checks.gross_assets.passed) {
        reasons.push('Gross assets exceed £200,000 limit for SEIS');
        overallResult = 'not_eligible';
      }
    } else {
      checks.gross_assets = {
        passed: true,
        notes: 'Gross assets not provided - manual verification required'
      };
      if (overallResult === 'eligible') overallResult = 'possibly_eligible';
    }

    // 3. Employee count check (must be 25 or fewer)
    if (company.employees !== undefined) {
      checks.employee_count = {
        passed: company.employees <= 25,
        value: company.employees,
        threshold: 25,
        notes: 'Must have 25 or fewer employees for SEIS'
      };

      if (!checks.employee_count.passed) {
        reasons.push('Too many employees for SEIS (must be 25 or fewer)');
        overallResult = 'not_eligible';
      }
    } else {
      checks.employee_count = {
        passed: true,
        notes: 'Employee count not provided - manual verification required'
      };
      if (overallResult === 'eligible') overallResult = 'possibly_eligible';
    }

    // 4. Investment amount check (£150,000 maximum per company)
    checks.investment_amount = {
      passed: round.amount_to_raise <= 150000,
      value: round.amount_to_raise,
      threshold: 150000,
      notes: 'Maximum SEIS investment per company is £150,000'
    };

    if (!checks.investment_amount.passed) {
      reasons.push('Investment amount exceeds £150,000 SEIS limit');
      overallResult = 'not_eligible';
    }

    // 5. Previous SEIS funding check
    if (company.previous_seis_rounds && company.previous_seis_rounds > 0) {
      checks.previous_seis = {
        passed: false,
        value: company.previous_seis_rounds,
        notes: 'Company has already received SEIS funding'
      };
      reasons.push('Company has already received SEIS funding');
      overallResult = 'not_eligible';
    } else {
      checks.previous_seis = {
        passed: true,
        value: company.previous_seis_rounds || 0,
        notes: 'No previous SEIS funding'
      };
    }

    // 6. Group structure check
    if (company.is_parent_company || company.has_subsidiaries) {
      checks.group_structure = {
        passed: false,
        notes: 'SEIS companies cannot be part of a group structure'
      };
      reasons.push('SEIS companies cannot have subsidiaries or be subsidiaries');
      overallResult = 'not_eligible';
    } else {
      checks.group_structure = {
        passed: true,
        notes: 'No group structure identified'
      };
    }

    // 7. Trading activity check
    checks.trading_activity = {
      passed: true,
      notes: 'Must carry on qualifying trade - manual verification required'
    };
    if (overallResult === 'eligible') overallResult = 'possibly_eligible';

    return {
      result: overallResult,
      reasons,
      checks_performed: checks
    };
  }

  checkEISEligibility(company: CompanyData, round: FundingRoundData): EligibilityResult {
    const checks: EligibilityResult['checks_performed'] = {};
    const reasons: string[] = [];
    let overallResult: 'eligible' | 'possibly_eligible' | 'not_eligible' = 'eligible';

    // 1. Company age check (must be less than 7 years old, or 10 for knowledge-intensive)
    const incorporationDate = new Date(company.incorporation_date);
    const ageInYears = (Date.now() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Assume knowledge-intensive if in tech/R&D sectors
    const isKnowledgeIntensive = this.isKnowledgeIntensive(company.sic_codes || []);
    const ageLimit = isKnowledgeIntensive ? 10 : 7;
    
    checks.company_age = {
      passed: ageInYears < ageLimit,
      value: Math.round(ageInYears * 10) / 10,
      threshold: ageLimit,
      notes: `Company must be less than ${ageLimit} years old for EIS${isKnowledgeIntensive ? ' (knowledge-intensive)' : ''}`
    };

    if (!checks.company_age.passed) {
      reasons.push(`Company is too old for EIS (must be less than ${ageLimit} years)`);
      overallResult = 'not_eligible';
    }

    // 2. Gross assets check (must be £15m or less before investment, £16m after)
    if (company.gross_assets !== undefined) {
      checks.gross_assets_before = {
        passed: company.gross_assets <= 15000000,
        value: company.gross_assets,
        threshold: 15000000,
        notes: 'Gross assets must not exceed £15m before investment for EIS'
      };

      const assetsAfter = company.gross_assets + round.amount_to_raise;
      checks.gross_assets_after = {
        passed: assetsAfter <= 16000000,
        value: assetsAfter,
        threshold: 16000000,
        notes: 'Gross assets must not exceed £16m after investment for EIS'
      };

      if (!checks.gross_assets_before.passed || !checks.gross_assets_after.passed) {
        reasons.push('Gross assets exceed EIS limits');
        overallResult = 'not_eligible';
      }
    } else {
      checks.gross_assets_before = {
        passed: true,
        notes: 'Gross assets not provided - manual verification required'
      };
      if (overallResult === 'eligible') overallResult = 'possibly_eligible';
    }

    // 3. Employee count check (must be 250 or fewer, or 500 for knowledge-intensive)
    const employeeLimit = isKnowledgeIntensive ? 500 : 250;
    
    if (company.employees !== undefined) {
      checks.employee_count = {
        passed: company.employees <= employeeLimit,
        value: company.employees,
        threshold: employeeLimit,
        notes: `Must have ${employeeLimit} or fewer employees for EIS${isKnowledgeIntensive ? ' (knowledge-intensive)' : ''}`
      };

      if (!checks.employee_count.passed) {
        reasons.push(`Too many employees for EIS (must be ${employeeLimit} or fewer)`);
        overallResult = 'not_eligible';
      }
    } else {
      checks.employee_count = {
        passed: true,
        notes: 'Employee count not provided - manual verification required'
      };
      if (overallResult === 'eligible') overallResult = 'possibly_eligible';
    }

    // 4. Investment amount check (£5m maximum per year, £12m lifetime)
    const annualLimit = isKnowledgeIntensive ? 10000000 : 5000000;
    const lifetimeLimit = isKnowledgeIntensive ? 20000000 : 12000000;
    
    checks.annual_investment_limit = {
      passed: round.amount_to_raise <= annualLimit,
      value: round.amount_to_raise,
      threshold: annualLimit,
      notes: `Maximum EIS investment per year is £${annualLimit.toLocaleString()}${isKnowledgeIntensive ? ' (knowledge-intensive)' : ''}`
    };

    if (!checks.annual_investment_limit.passed) {
      reasons.push(`Investment amount exceeds annual EIS limit of £${annualLimit.toLocaleString()}`);
      overallResult = 'not_eligible';
    }

    // 5. Trading activity check
    checks.trading_activity = {
      passed: true,
      notes: 'Must carry on qualifying trade - manual verification required'
    };
    if (overallResult === 'eligible') overallResult = 'possibly_eligible';

    // 6. Independence check
    checks.independence = {
      passed: true,
      notes: 'Company must be independent - manual verification required'
    };
    // Note: overallResult is already set to 'possibly_eligible' from previous checks

    return {
      result: overallResult,
      reasons,
      checks_performed: checks
    };
  }

  private isKnowledgeIntensive(sicCodes: string[]): boolean {
    // Knowledge-intensive SIC codes (simplified list)
    const knowledgeIntensiveCodes = [
      '62', '63', '72', // Information and communication
      '71', // Architectural and engineering activities
      '73', // Advertising and market research
      '74', // Other professional, scientific and technical activities
      '75', // Veterinary activities
    ];

    return sicCodes.some(code => 
      knowledgeIntensiveCodes.some(kiCode => code.startsWith(kiCode))
    );
  }

  checkEligibility(company: CompanyData, round: FundingRoundData): EligibilityResult {
    if (round.scheme === 'SEIS') {
      return this.checkSEISEligibility(company, round);
    } else if (round.scheme === 'EIS') {
      return this.checkEISEligibility(company, round);
    } else if (round.scheme === 'BOTH') {
      const seisResult = this.checkSEISEligibility(company, round);
      const eisResult = this.checkEISEligibility(company, round);
      
      // Return the more restrictive result
      if (seisResult.result === 'not_eligible' && eisResult.result === 'not_eligible') {
        return {
          result: 'not_eligible',
          reasons: [...seisResult.reasons, ...eisResult.reasons],
          checks_performed: { ...seisResult.checks_performed, ...eisResult.checks_performed }
        };
      } else if (seisResult.result === 'eligible' && eisResult.result === 'eligible') {
        return {
          result: 'eligible',
          reasons: [],
          checks_performed: { ...seisResult.checks_performed, ...eisResult.checks_performed }
        };
      } else {
        return {
          result: 'possibly_eligible',
          reasons: [...seisResult.reasons, ...eisResult.reasons],
          checks_performed: { ...seisResult.checks_performed, ...eisResult.checks_performed }
        };
      }
    }

    throw new Error('Invalid scheme type');
  }
}

export const eligibilityChecker = new EligibilityChecker();
