/**
 * Clinical Decision Support System for Dinger
 * Provides structured decision trees and ethical guidance for complex clinical scenarios
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DecisionNode {
  id: string;
  question: string;
  type: 'assessment' | 'intervention' | 'ethical' | 'safety';
  options: DecisionOption[];
  guidance: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresSupervision: boolean;
  evidenceBase: string[];
}

interface DecisionOption {
  id: string;
  label: string;
  description: string;
  nextNodeId?: string;
  recommendation?: string;
  actionSteps: string[];
  considerations: string[];
  documentationRequired: string[];
}

interface ClinicalScenario {
  id: string;
  category: 'crisis' | 'ethics' | 'treatment' | 'assessment' | 'supervision';
  title: string;
  description: string;
  complexity: 'novice' | 'developing' | 'proficient' | 'expert';
  decisionTree: DecisionNode[];
  learningObjectives: string[];
  resources: string[];
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  protectiveFactors: string[];
  immediateActions: string[];
  supervisionRequired: boolean;
  followUpTimeline: string;
  documentation: string[];
}

export class ClinicalDecisionSupport {
  private openai: OpenAI | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  /**
   * Generate clinical decision tree for complex scenarios
   */
  async generateDecisionTree(
    scenario: string,
    userExperience: string,
    clientPopulation: string
  ): Promise<ClinicalScenario> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a clinical supervisor creating structured decision trees for counselors. Generate a comprehensive clinical decision support scenario with:

              1. Clear decision nodes with assessment questions
              2. Multiple-choice options with next steps
              3. Risk level assessments for each node
              4. Evidence-based recommendations
              5. Documentation requirements
              6. Supervision checkpoints

              Focus on practical, ethical, and evidence-based clinical decision making. Include specific guidance for different experience levels.

              Respond with JSON format containing: id, category, title, description, complexity, decisionTree (array of nodes), learningObjectives, and resources.`
            },
            {
              role: "user",
              content: `Clinical scenario: ${scenario}
              
              Counselor experience: ${userExperience}
              Client population: ${clientPopulation}
              
              Create a decision tree that guides through assessment, intervention selection, risk evaluation, and ethical considerations.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      }

      return this.createFallbackDecisionTree(scenario, userExperience);
    } catch (error) {
      console.error('Decision tree generation failed:', error);
      return this.createFallbackDecisionTree(scenario, userExperience);
    }
  }

  /**
   * Assess clinical risk based on presentation
   */
  async assessClinicalRisk(
    clientPresentation: string,
    contextualFactors: string[],
    counselorConcerns: string[]
  ): Promise<RiskAssessment> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert clinical supervisor conducting risk assessment. Analyze the client presentation and provide structured risk evaluation including:

              - Overall risk level (low/medium/high/critical)
              - Specific risk factors identified
              - Protective factors present
              - Immediate actions required
              - Timeline for follow-up
              - Documentation requirements
              - Whether supervision is required

              Focus on suicide risk, harm to others, child abuse, elder abuse, and other safety concerns. Provide specific, actionable guidance.

              Respond with JSON format containing: overallRisk, riskFactors, protectiveFactors, immediateActions, supervisionRequired, followUpTimeline, documentation.`
            },
            {
              role: "user",
              content: `Client presentation: ${clientPresentation}
              
              Contextual factors: ${contextualFactors.join(', ')}
              
              Counselor concerns: ${counselorConcerns.join(', ')}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      }

      return this.createFallbackRiskAssessment(clientPresentation);
    } catch (error) {
      console.error('Risk assessment failed:', error);
      return this.createFallbackRiskAssessment(clientPresentation);
    }
  }

  /**
   * Generate ethical decision framework
   */
  async generateEthicalGuidance(
    ethicalDilemma: string,
    involvedParties: string[],
    conflictingValues: string[]
  ): Promise<{
    framework: string;
    considerations: string[];
    stakeholderAnalysis: any[];
    recommendations: string[];
    consultationNeeded: boolean;
    ethicalCodes: string[];
  }> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an ethics expert providing structured ethical decision-making guidance for counselors. Use established ethical frameworks (ACA Code of Ethics, beneficence, non-maleficence, autonomy, justice, fidelity) to analyze complex ethical dilemmas.

              Provide:
              1. Relevant ethical framework to apply
              2. Key ethical considerations
              3. Stakeholder analysis (who is affected and how)
              4. Step-by-step recommendations
              5. Whether additional consultation is needed
              6. Relevant ethical codes and guidelines

              Respond with JSON format containing: framework, considerations, stakeholderAnalysis, recommendations, consultationNeeded, ethicalCodes.`
            },
            {
              role: "user",
              content: `Ethical dilemma: ${ethicalDilemma}
              
              Involved parties: ${involvedParties.join(', ')}
              
              Conflicting values: ${conflictingValues.join(', ')}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1200
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      }

      return this.createFallbackEthicalGuidance(ethicalDilemma);
    } catch (error) {
      console.error('Ethical guidance generation failed:', error);
      return this.createFallbackEthicalGuidance(ethicalDilemma);
    }
  }

  /**
   * Create treatment planning guidance
   */
  async generateTreatmentPlan(
    clientPresentation: string,
    diagnosticImpression: string,
    clientGoals: string[],
    counselorModalities: string[]
  ): Promise<{
    recommendedApproaches: any[];
    interventionStrategies: string[];
    measurementTools: string[];
    timeline: string;
    supervisionFocus: string[];
    documentation: string[];
  }> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a clinical supervisor helping develop evidence-based treatment plans. Provide structured treatment planning guidance including:

              1. Recommended therapeutic approaches based on evidence
              2. Specific intervention strategies
              3. Assessment and measurement tools
              4. Treatment timeline and milestones
              5. Areas for supervision focus
              6. Documentation requirements

              Consider client factors, evidence-based practices, and counselor competencies.

              Respond with JSON format containing: recommendedApproaches, interventionStrategies, measurementTools, timeline, supervisionFocus, documentation.`
            },
            {
              role: "user",
              content: `Client presentation: ${clientPresentation}
              
              Diagnostic impression: ${diagnosticImpression}
              
              Client goals: ${clientGoals.join(', ')}
              
              Counselor modalities: ${counselorModalities.join(', ')}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1500
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      }

      return this.createFallbackTreatmentPlan(clientPresentation);
    } catch (error) {
      console.error('Treatment planning failed:', error);
      return this.createFallbackTreatmentPlan(clientPresentation);
    }
  }

  /**
   * Fallback decision tree creation
   */
  private createFallbackDecisionTree(scenario: string, experience: string): ClinicalScenario {
    return {
      id: `scenario_${Date.now()}`,
      category: 'treatment',
      title: 'Clinical Decision Analysis',
      description: `Decision framework for: ${scenario}`,
      complexity: experience as any,
      decisionTree: [
        {
          id: 'initial_assessment',
          question: 'What is the primary clinical concern?',
          type: 'assessment',
          options: [
            {
              id: 'safety',
              label: 'Safety/Crisis Issues',
              description: 'Client presents with immediate safety concerns',
              nextNodeId: 'risk_assessment',
              recommendation: 'Conduct immediate risk assessment',
              actionSteps: [
                'Assess suicide/homicide risk',
                'Evaluate need for immediate intervention',
                'Consider involuntary commitment if necessary'
              ],
              considerations: ['Legal obligations', 'Client safety', 'Documentation'],
              documentationRequired: ['Risk assessment', 'Safety plan', 'Supervision consultation']
            },
            {
              id: 'symptoms',
              label: 'Symptom Management',
              description: 'Client needs help managing specific symptoms',
              nextNodeId: 'intervention_selection',
              recommendation: 'Develop targeted intervention plan',
              actionSteps: [
                'Complete thorough assessment',
                'Identify evidence-based interventions',
                'Collaborate on treatment goals'
              ],
              considerations: ['Client preferences', 'Evidence base', 'Counselor competency'],
              documentationRequired: ['Assessment summary', 'Treatment plan', 'Progress notes']
            }
          ],
          guidance: 'Begin with comprehensive assessment to determine primary focus',
          riskLevel: 'medium',
          requiresSupervision: experience === 'novice',
          evidenceBase: ['ACA Code of Ethics', 'Best practice guidelines']
        }
      ],
      learningObjectives: [
        'Conduct systematic clinical assessment',
        'Apply ethical decision-making framework',
        'Develop appropriate intervention strategies'
      ],
      resources: [
        'ACA Code of Ethics',
        'Crisis intervention protocols',
        'Evidence-based practice guidelines'
      ]
    };
  }

  /**
   * Fallback risk assessment
   */
  private createFallbackRiskAssessment(presentation: string): RiskAssessment {
    const hasRiskKeywords = presentation.toLowerCase().includes('suicide') || 
                           presentation.toLowerCase().includes('harm') ||
                           presentation.toLowerCase().includes('crisis');

    return {
      overallRisk: hasRiskKeywords ? 'high' : 'medium',
      riskFactors: hasRiskKeywords ? ['Expressed suicidal ideation', 'Crisis presentation'] : ['Emotional distress'],
      protectiveFactors: ['Seeking help', 'Engaged in treatment'],
      immediateActions: hasRiskKeywords ? ['Conduct safety assessment', 'Develop safety plan'] : ['Continue assessment'],
      supervisionRequired: hasRiskKeywords,
      followUpTimeline: hasRiskKeywords ? 'Within 24 hours' : 'Next session',
      documentation: ['Risk assessment completed', 'Safety plan if indicated', 'Supervision consultation']
    };
  }

  /**
   * Fallback ethical guidance
   */
  private createFallbackEthicalGuidance(dilemma: string): any {
    return {
      framework: 'ACA Ethical Decision-Making Model',
      considerations: [
        'Identify the ethical issue',
        'Apply relevant ethical codes',
        'Consider stakeholder welfare',
        'Evaluate options and consequences'
      ],
      stakeholderAnalysis: [
        { party: 'Client', impact: 'Primary consideration for welfare and autonomy' },
        { party: 'Counselor', impact: 'Professional obligations and competence' }
      ],
      recommendations: [
        'Consult ACA Code of Ethics',
        'Seek supervision consultation',
        'Document decision-making process',
        'Consider client best interests'
      ],
      consultationNeeded: true,
      ethicalCodes: ['ACA Code of Ethics', 'State licensing requirements']
    };
  }

  /**
   * Fallback treatment planning
   */
  private createFallbackTreatmentPlan(presentation: string): any {
    return {
      recommendedApproaches: [
        { approach: 'Person-Centered Therapy', evidence: 'Strong evidence for building therapeutic alliance' },
        { approach: 'Cognitive-Behavioral Therapy', evidence: 'Evidence-based for many presenting concerns' }
      ],
      interventionStrategies: [
        'Establish therapeutic rapport',
        'Collaborative goal setting',
        'Psychoeducation about presenting concerns',
        'Skill-building interventions'
      ],
      measurementTools: [
        'GAD-7 for anxiety symptoms',
        'PHQ-9 for depression symptoms',
        'Client satisfaction measures'
      ],
      timeline: '12-16 sessions with review at session 6',
      supervisionFocus: [
        'Therapeutic alliance development',
        'Intervention effectiveness',
        'Client progress monitoring'
      ],
      documentation: [
        'Initial assessment and diagnosis',
        'Treatment plan with measurable goals',
        'Regular progress notes',
        'Supervision consultation records'
      ]
    };
  }
}

export const clinicalDecisionSupport = new ClinicalDecisionSupport();