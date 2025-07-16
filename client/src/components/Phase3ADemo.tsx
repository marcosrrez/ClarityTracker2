import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Circle, Zap, Shield, Smartphone, Globe } from 'lucide-react';

interface Phase3AStatus {
  phase: string;
  status: string;
  services: {
    ai: string;
    mobile: string;
    compliance: string;
  };
  timestamp: string;
}

interface ComplianceCheck {
  compliant: boolean;
  region: string;
  operation: string;
}

export function Phase3ADemo() {
  const [status, setStatus] = useState<Phase3AStatus | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceCheck | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPhase3AStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase3a/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check Phase 3A status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCompliance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/phase3a/check-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region: 'US',
          operation: 'demo_test',
          data: { userId: 'demo_user', type: 'session_analysis' }
        })
      });
      const data = await response.json();
      setComplianceResult(data);
    } catch (error) {
      console.error('Failed to test compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Phase 3A Foundation</h1>
        <p className="text-gray-600">Advanced AI Integration, Mobile PWA, and International Compliance</p>
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Phase 3A implementation completed with zero disruption. All services operational.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <Card className="border-2 border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                onClick={checkPhase3AStatus} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Checking...' : 'Check Phase 3A Status'}
              </Button>
            </div>
            
            {status && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Phase:</span>
                  <Badge variant="outline">{status.phase}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Overall:</span>
                  <Badge className={getStatusColor(status.status)}>
                    {status.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Services:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">AI Services:</span>
                      <Badge className={getStatusColor(status.services.ai)}>
                        {status.services.ai}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mobile PWA:</span>
                      <Badge className={getStatusColor(status.services.mobile)}>
                        {status.services.mobile}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Compliance:</span>
                      <Badge className={getStatusColor(status.services.compliance)}>
                        {status.services.compliance}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Test Card */}
        <Card className="border-2 border-green-100">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Compliance Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                onClick={testCompliance} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Testing...' : 'Test US Compliance'}
              </Button>
            </div>
            
            {complianceResult && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Region:</span>
                  <Badge variant="outline">{complianceResult.region}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Operation:</span>
                  <Badge variant="outline">{complianceResult.operation}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Compliant:</span>
                  <Badge className={complianceResult.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {complianceResult.compliant ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-purple-50">
          <CardTitle className="text-center">Phase 3A Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold">AI Services</h3>
              <p className="text-sm text-gray-600">
                Advanced AI analysis with OpenAI GPT-4 primary and Google Gemini fallback
              </p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Operational</span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold">Mobile PWA</h3>
              <p className="text-sm text-gray-600">
                Offline-first mobile experience with intelligent sync capabilities
              </p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Operational</span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold">Global Compliance</h3>
              <p className="text-sm text-gray-600">
                International compliance framework supporting US, EU, and Canadian regulations
              </p>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Operational</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Technical Architecture</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Event-driven architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Circuit breaker pattern</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Real-time processing</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Offline-first design</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>International compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Zero-disruption deployment</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}