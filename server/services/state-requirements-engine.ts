import type { StateRequirements } from '../../shared/schema';

interface RequirementValidation {
  isValid: boolean;
  violations: string[];
  warnings: string[];
  recommendations: string[];
}

interface LicensePathway {
  pathway: string;
  requirements: StateRequirements;
  timelineMonths: number;
  prerequisites: string[];
  specialNotes: string[];
}

export class StateRequirementsEngine {
  
  // Comprehensive state requirements database
  private static readonly STATE_REQUIREMENTS: Record<string, Record<string, StateRequirements>> = {
    'Texas': {
      'LPC': {
        id: 'tx-lpc',
        state: 'Texas',
        licenseType: 'LPC',
        totalCCH: 4000,
        directCCH: 3000,
        supervisionHours: 200,
        ethicsHours: 6,
        groupSupervisionRatio: 2,
        maxGroupParticipants: 6,
        renewalCEHours: 40,
        renewalPeriodMonths: 24,
        specialRequirements: [
          'Must complete 3000 direct client contact hours',
          'Supervision must be provided by LPC-S',
          'Maximum 1000 hours can be indirect client contact',
          'At least 100 hours must be individual supervision',
          'Group supervision limited to 6 participants',
          'Ethics training must include Texas-specific laws'
        ],
        lastUpdated: new Date(),
      },
      'LMFT': {
        id: 'tx-lmft',
        state: 'Texas',
        licenseType: 'LMFT',
        totalCCH: 4000,
        directCCH: 3000,
        supervisionHours: 200,
        ethicsHours: 6,
        groupSupervisionRatio: 2,
        maxGroupParticipants: 6,
        renewalCEHours: 40,
        renewalPeriodMonths: 24,
        specialRequirements: [
          'Must focus on marriage and family therapy',
          'Systemic therapy training required',
          'Supervision must be provided by LMFT-S',
          'Minimum 1500 hours with couples/families'
        ],
        lastUpdated: new Date(),
      }
    },
    'California': {
      'LPCC': {
        id: 'ca-lpcc',
        state: 'California',
        licenseType: 'LPCC',
        totalCCH: 4000,
        directCCH: 3000,
        supervisionHours: 104,
        ethicsHours: 10,
        groupSupervisionRatio: 1,
        maxGroupParticipants: 8,
        renewalCEHours: 40,
        renewalPeriodMonths: 24,
        specialRequirements: [
          'Weekly supervision required during first year',
          'At least 52 weeks of supervised experience',
          'Suicide risk assessment training required',
          'Child abuse detection training required',
          'Aging and long-term care training required'
        ],
        lastUpdated: new Date(),
      }
    },
    'Florida': {
      'LMHC': {
        id: 'fl-lmhc',
        state: 'Florida',
        licenseType: 'LMHC',
        totalCCH: 4000,
        directCCH: 3000,
        supervisionHours: 200,
        ethicsHours: 4,
        groupSupervisionRatio: 2,
        maxGroupParticipants: 6,
        renewalCEHours: 30,
        renewalPeriodMonths: 24,
        specialRequirements: [
          'HIV/AIDS training required (3 hours)',
          'Domestic violence training required (2 hours)',
          'Prevention of medical errors training required',
          'Must pass state examination'
        ],
        lastUpdated: new Date(),
      }
    },
    'New York': {
      'LMHC': {
        id: 'ny-lmhc',
        state: 'New York',
        licenseType: 'LMHC',
        totalCCH: 4500,
        directCCH: 3000,
        supervisionHours: 180,
        ethicsHours: 6,
        groupSupervisionRatio: 1,
        maxGroupParticipants: 4,
        renewalCEHours: 36,
        renewalPeriodMonths: 36,
        specialRequirements: [
          'Must complete approved masters program',
          'Child abuse identification training required',
          'Infection control training required',
          '4500 hours over minimum 3 years'
        ],
        lastUpdated: new Date(),
      }
    }
  };

  /**
   * Get requirements for specific state and license type
   */
  static getRequirements(state: string, licenseType: string): StateRequirements | null {
    const stateReqs = this.STATE_REQUIREMENTS[state];
    if (!stateReqs) return null;
    
    return stateReqs[licenseType] || null;
  }

  /**
   * Get all available license types for a state
   */
  static getAvailableLicenseTypes(state: string): string[] {
    const stateReqs = this.STATE_REQUIREMENTS[state];
    return stateReqs ? Object.keys(stateReqs) : [];
  }

  /**
   * Get all supported states
   */
  static getSupportedStates(): string[] {
    return Object.keys(this.STATE_REQUIREMENTS);
  }

  /**
   * Validate current progress against state requirements
   */
  static validateProgress(
    state: string,
    licenseType: string,
    currentHours: {
      totalCCH: number;
      directCCH: number;
      supervisionHours: number;
      ethicsHours: number;
      groupSupervisionHours?: number;
    }
  ): RequirementValidation {
    const requirements = this.getRequirements(state, licenseType);
    
    if (!requirements) {
      return {
        isValid: false,
        violations: [`Requirements not found for ${licenseType} in ${state}`],
        warnings: [],
        recommendations: ['Please verify your state and license type selection']
      };
    }

    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check total hours
    if (currentHours.totalCCH > requirements.totalCCH) {
      violations.push(`Total hours exceed maximum (${currentHours.totalCCH} > ${requirements.totalCCH})`);
    }

    // Check direct hours
    if (currentHours.directCCH > requirements.directCCH) {
      violations.push(`Direct hours exceed maximum (${currentHours.directCCH} > ${requirements.directCCH})`);
    }

    // Check indirect hours ratio
    const indirectHours = currentHours.totalCCH - currentHours.directCCH;
    const maxIndirectHours = requirements.totalCCH - requirements.directCCH;
    if (indirectHours > maxIndirectHours) {
      violations.push(`Too many indirect hours (${indirectHours} > ${maxIndirectHours} allowed)`);
    }

    // Check supervision ratio
    const supervisionRatio = currentHours.supervisionHours / Math.max(1, currentHours.totalCCH);
    const requiredRatio = requirements.supervisionHours / requirements.totalCCH;
    
    if (supervisionRatio < requiredRatio * 0.8) {
      warnings.push('Supervision hours may be below required ratio');
      recommendations.push('Schedule additional supervision sessions to maintain compliance');
    }

    // Check ethics hours
    if (currentHours.ethicsHours < requirements.ethicsHours) {
      const remaining = requirements.ethicsHours - currentHours.ethicsHours;
      recommendations.push(`Complete ${remaining} more ethics hours to meet state requirements`);
    }

    // State-specific validations
    if (state === 'Texas' && licenseType === 'LPC') {
      if (currentHours.directCCH < 3000) {
        const remaining = 3000 - currentHours.directCCH;
        recommendations.push(`Need ${remaining} more direct client contact hours for Texas LPC`);
      }
    }

    if (state === 'California' && licenseType === 'LPCC') {
      if (currentHours.supervisionHours < 52) {
        recommendations.push('California requires weekly supervision for minimum 52 weeks');
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate remaining requirements
   */
  static calculateRemaining(
    state: string,
    licenseType: string,
    currentHours: {
      totalCCH: number;
      directCCH: number;
      supervisionHours: number;
      ethicsHours: number;
    }
  ) {
    const requirements = this.getRequirements(state, licenseType);
    
    if (!requirements) {
      return null;
    }

    return {
      totalCCH: Math.max(0, requirements.totalCCH - currentHours.totalCCH),
      directCCH: Math.max(0, requirements.directCCH - currentHours.directCCH),
      supervisionHours: Math.max(0, requirements.supervisionHours - currentHours.supervisionHours),
      ethicsHours: Math.max(0, requirements.ethicsHours - currentHours.ethicsHours),
      percentageComplete: {
        total: Math.min(100, (currentHours.totalCCH / requirements.totalCCH) * 100),
        direct: Math.min(100, (currentHours.directCCH / requirements.directCCH) * 100),
        supervision: Math.min(100, (currentHours.supervisionHours / requirements.supervisionHours) * 100),
        ethics: Math.min(100, (currentHours.ethicsHours / requirements.ethicsHours) * 100),
      }
    };
  }

  /**
   * Get license pathway information
   */
  static getLicensePathway(state: string, licenseType: string): LicensePathway | null {
    const requirements = this.getRequirements(state, licenseType);
    
    if (!requirements) return null;

    // Calculate typical timeline based on requirements
    const timelineMonths = Math.ceil(requirements.totalCCH / (20 * 4.33)); // Assuming 20 hours/week

    const pathways: Record<string, LicensePathway> = {
      'Texas-LPC': {
        pathway: 'Texas Licensed Professional Counselor',
        requirements,
        timelineMonths,
        prerequisites: [
          'Masters degree in counseling or related field',
          'Complete required coursework including practicum and internship',
          'Pass the National Counselor Examination (NCE)',
          'Submit application with required fees'
        ],
        specialNotes: [
          'Must work under LPC-S supervision',
          'Cannot provide independent practice until licensed',
          'Required to complete jurisprudence exam'
        ]
      },
      'California-LPCC': {
        pathway: 'California Licensed Professional Clinical Counselor',
        requirements,
        timelineMonths,
        prerequisites: [
          'Masters degree from BBS-approved program',
          'Pass California Law and Ethics Examination',
          'Pass Clinical Examination',
          'Submit Associate registration'
        ],
        specialNotes: [
          'Must register as Associate Professional Clinical Counselor first',
          'Required specialized training in suicide risk assessment',
          'Continuing education in aging and long-term care'
        ]
      }
    };

    return pathways[`${state}-${licenseType}`] || {
      pathway: `${state} ${licenseType}`,
      requirements,
      timelineMonths,
      prerequisites: ['Masters degree in counseling', 'Pass required examinations'],
      specialNotes: ['Verify specific requirements with state board']
    };
  }

  /**
   * Compare requirements across states
   */
  static compareStates(licenseType: string, states: string[]) {
    const comparisons = states.map(state => {
      const req = this.getRequirements(state, licenseType);
      return { state, requirements: req };
    }).filter(comp => comp.requirements !== null);

    return {
      states: comparisons,
      analysis: {
        lowestHours: Math.min(...comparisons.map(c => c.requirements!.totalCCH)),
        highestHours: Math.max(...comparisons.map(c => c.requirements!.totalCCH)),
        averageHours: Math.round(
          comparisons.reduce((sum, c) => sum + c.requirements!.totalCCH, 0) / comparisons.length
        ),
        mostSupervision: Math.max(...comparisons.map(c => c.requirements!.supervisionHours)),
        leastSupervision: Math.min(...comparisons.map(c => c.requirements!.supervisionHours)),
      }
    };
  }

  /**
   * Get renewal requirements
   */
  static getRenewalRequirements(state: string, licenseType: string) {
    const requirements = this.getRequirements(state, licenseType);
    
    if (!requirements) return null;

    return {
      ceHours: requirements.renewalCEHours,
      periodMonths: requirements.renewalPeriodMonths,
      specialRequirements: requirements.specialRequirements.filter(req => 
        req.includes('renewal') || req.includes('continuing education')
      ),
      deadlineReminder: `Renewal required every ${requirements.renewalPeriodMonths} months`
    };
  }
}