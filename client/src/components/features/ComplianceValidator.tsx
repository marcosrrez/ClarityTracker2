/**
 * Compliance Validator Component
 * Provides international compliance validation for global markets
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle,
  CheckCircle, 
  AlertCircle, 
  Activity,
  Globe,
  FileText,
  Eye,
  Lock
} from 'lucide-react';
import { useFeatureFlag, ProgressiveFeature } from '@/utils/featureFlags';
import { apiRequest } from '@/lib/queryClient';

interface ComplianceValidatorProps {
  userId: string;
  operationType: 'data_processing' | 'data_transfer' | 'data_storage' | 'user_access';
  dataTypes: string[];
  onValidationComplete?: (result: any) => void;
}

interface ComplianceResult {
  region: string;
  compliant: boolean;
  validationResults: Array<{
    rule: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
    severity: 'low' | 'medium' | 'high';
    recommendation?: string;
  }>;
  complianceScore: number;
  certificationsRequired: string[];
}

const REGIONS = [
  { code: 'US', name: 'United States', framework: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
  { code: 'EU', name: 'European Union', framework: 'GDPR', description: 'General Data Protection Regulation' },
  { code: 'CA', name: 'Canada', framework: 'PIPEDA', description: 'Personal Information Protection and Electronic Documents Act' }
];

const OPERATION_TYPES = [
  { code: 'data_processing', name: 'Data Processing', description: 'Processing of personal/health data' },
  { code: 'data_transfer', name: 'Data Transfer', description: 'Cross-border data transfers' },
  { code: 'data_storage', name: 'Data Storage', description: 'Long-term data storage' },
  { code: 'user_access', name: 'User Access', description: 'User access and authentication' }
];

export function ComplianceValidator({ 
  userId, 
  operationType, 
  dataTypes, 
  onValidationComplete 
}: ComplianceValidatorProps) {
  const [selectedRegion, setSelectedRegion] = useState<'US' | 'EU' | 'CA'>('US');
  const [validationResults, setValidationResults] = useState<{ [key: string]: ComplianceResult }>({});
  const complianceValidation = useFeatureFlag('complianceValidation');

  const validateComplianceMutation = useMutation({
    mutationFn: async (region: string) => {
      const response = await apiRequest('/api/phase3a/check-compliance', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          region,
          operationType,
          dataTypes
        })
      });
      return response.json();
    },
    onSuccess: (data, region) => {
      setValidationResults(prev => ({ ...prev, [region]: data }));
      onValidationComplete?.(data);
    }
  });

  const validateAllRegions = async () => {
    for (const region of REGIONS) {
      await validateComplianceMutation.mutateAsync(region.code);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentRegion = REGIONS.find(r => r.code === selectedRegion);
  const currentResult = validationResults[selectedRegion];

  return (
    <ProgressiveFeature
      flag="complianceValidation"
      fallback={
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>International compliance validation available with Phase 3A features</span>
          </div>
        </div>
      }
    >
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Compliance Validation
            <Badge variant="secondary" className="ml-2">Phase 3A</Badge>
          </CardTitle>
          <CardDescription>
            Automated compliance validation for global healthcare regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Region</TabsTrigger>
              <TabsTrigger value="global">Global Validation</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Target Region</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value as 'US' | 'EU' | 'CA')}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {REGIONS.map(region => (
                        <option key={region.code} value={region.code}>
                          {region.name} ({region.framework})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      onClick={() => validateComplianceMutation.mutate(selectedRegion)}
                      disabled={validateComplianceMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {validateComplianceMutation.isPending ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Validate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {currentRegion && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{currentRegion.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentRegion.description}
                    </p>
                  </div>
                )}

                {currentResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={currentResult.compliant ? 'default' : 'destructive'}>
                          {currentResult.compliant ? 'Compliant' : 'Non-Compliant'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Score: <span className={`font-medium ${getComplianceScoreColor(currentResult.complianceScore)}`}>
                            {currentResult.complianceScore}%
                          </span>
                        </span>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {currentResult.validationResults.length} rules checked
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium">Validation Results:</span>
                      <div className="space-y-2">
                        {currentResult.validationResults.map((result, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              {getStatusIcon(result.status)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{result.rule}</span>
                                <Badge className={getSeverityColor(result.severity)}>
                                  {result.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{result.message}</p>
                              {result.recommendation && (
                                <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                  <strong>Recommendation:</strong> {result.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {currentResult.certificationsRequired.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-medium">Required Certifications:</span>
                        <div className="flex flex-wrap gap-2">
                          {currentResult.certificationsRequired.map((cert, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="global" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Validate compliance across all supported regions
                  </p>
                  <Button 
                    onClick={validateAllRegions}
                    disabled={validateComplianceMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {validateComplianceMutation.isPending ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Validate All
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {REGIONS.map(region => {
                    const result = validationResults[region.code];
                    return (
                      <Card key={region.code} className="border-l-4 border-l-purple-300">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="w-4 h-4" />
                            {region.name}
                          </CardTitle>
                          <CardDescription>{region.framework}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {result ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant={result.compliant ? 'default' : 'destructive'}>
                                  {result.compliant ? 'Compliant' : 'Issues Found'}
                                </Badge>
                                <span className={`text-sm font-medium ${getComplianceScoreColor(result.complianceScore)}`}>
                                  {result.complianceScore}%
                                </span>
                              </div>
                              <div className="space-y-1">
                                {result.validationResults.slice(0, 3).map((validationResult, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    {getStatusIcon(validationResult.status)}
                                    <span className="truncate">{validationResult.rule}</span>
                                  </div>
                                ))}
                                {result.validationResults.length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{result.validationResults.length - 3} more rules
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4 mr-2" />
                              Not validated
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Operation Context */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Validation Context</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Operation:</strong> {OPERATION_TYPES.find(op => op.code === operationType)?.name}</p>
              <p><strong>Data Types:</strong> {dataTypes.join(', ')}</p>
              <p><strong>User ID:</strong> {userId}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ProgressiveFeature>
  );
}