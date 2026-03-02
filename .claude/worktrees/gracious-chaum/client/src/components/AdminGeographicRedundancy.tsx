import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  HardDrive,
  PlayCircle,
  Server,
  Shield,
  Timer,
  TrendingUp,
  XCircle
} from 'lucide-react';

interface RegionConfig {
  name: string;
  code: string;
  primary: boolean;
  compliance: string;
  status: 'healthy' | 'degraded' | 'failed';
  latency: number;
}

interface ReplicationStatus {
  region: string;
  lag: number;
  status: 'synced' | 'lagging' | 'disconnected';
  lastSync: Date;
  queueSize: number;
}

interface SystemStatus {
  regions: RegionConfig[];
  replication: ReplicationStatus[];
  compliance: {
    compliant: boolean;
    violations: string[];
    euDataInEU: boolean;
    usDataInUS: boolean;
  };
  performance: {
    regions: { from: string; to: string; latency: number }[];
    averageLatency: number;
    maxLatency: number;
  };
  costs: {
    currentCost: number;
    optimizedCost: number;
    savings: number;
    recommendations: string[];
  };
  overall: 'healthy' | 'degraded' | 'critical';
}

export default function AdminGeographicRedundancy() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runbooks, setRunbooks] = useState<string[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSystemStatus();
    loadRunbooks();
    loadExecutions();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemStatus();
      loadExecutions();
    }, 30000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/geographic-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRunbooks = async () => {
    try {
      const response = await fetch('/api/admin/runbooks');
      const data = await response.json();
      setRunbooks(data);
    } catch (error) {
      console.error('Failed to load runbooks:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/admin/executions');
      const data = await response.json();
      setExecutions(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  const executeRunbook = async (runbookId: string) => {
    try {
      const response = await fetch(`/api/admin/runbooks/${runbookId}/execute`, {
        method: 'POST'
      });
      const execution = await response.json();
      console.log('Runbook execution started:', execution);
      loadExecutions();
    } catch (error) {
      console.error('Failed to execute runbook:', error);
    }
  };

  const testFailover = async (region: string) => {
    try {
      const response = await fetch('/api/admin/failover-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region })
      });
      const result = await response.json();
      console.log('Failover test result:', result);
      loadSystemStatus();
    } catch (error) {
      console.error('Failed to test failover:', error);
    }
  };

  const syncBackups = async () => {
    try {
      const response = await fetch('/api/admin/backup-sync', {
        method: 'POST'
      });
      const result = await response.json();
      console.log('Backup sync result:', result);
      loadSystemStatus();
    } catch (error) {
      console.error('Failed to sync backups:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'synced':
        return 'bg-green-500';
      case 'degraded':
      case 'lagging':
        return 'bg-yellow-500';
      case 'failed':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
      case 'lagging':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load geographic redundancy status. Please check system connectivity.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geographic Redundancy Control Center</h1>
          <p className="text-gray-600 mt-2">Multi-region infrastructure monitoring and management</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={status.overall === 'healthy' ? 'default' : 'destructive'}>
            System Status: {status.overall.toUpperCase()}
          </Badge>
          <Button onClick={loadSystemStatus} size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.regions.length}</div>
            <p className="text-xs text-muted-foreground">
              {status.regions.filter(r => r.status === 'healthy').length} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.performance.averageLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Max: {status.performance.maxLatency.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {status.compliance.compliant ? 'COMPLIANT' : 'VIOLATION'}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.compliance.violations.length} violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${status.costs.savings.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly optimization
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regions">Regional Status</TabsTrigger>
          <TabsTrigger value="replication">Replication</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="space-y-4">
          <div className="grid gap-4">
            {status.regions.map((region) => (
              <Card key={region.code}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(region.status)}
                      <CardTitle className="text-lg">{region.name}</CardTitle>
                      {region.primary && <Badge variant="default">Primary</Badge>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{region.compliance}</Badge>
                      <Badge variant="outline">{region.latency}ms</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Status: {region.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Compliance: {region.compliance}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Latency: {region.latency}ms</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testFailover(region.code)}
                      disabled={region.status === 'failed'}
                    >
                      Test Failover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="replication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Replication Status</CardTitle>
              <CardDescription>
                Cross-region database synchronization monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {status.replication.map((repl) => (
                  <div key={repl.region} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(repl.status)}
                      <div>
                        <div className="font-medium">{repl.region}</div>
                        <div className="text-sm text-gray-600">
                          Last sync: {new Date(repl.lastSync).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{repl.lag}ms</div>
                      <div className="text-sm text-gray-600">
                        {repl.queueSize > 0 ? `${repl.queueSize} queued` : 'No queue'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button onClick={syncBackups} className="w-full">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Synchronize Backups
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Residency Compliance</CardTitle>
              <CardDescription>
                HIPAA and GDPR compliance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${status.compliance.euDataInEU ? 'text-green-500' : 'text-red-500'}`} />
                    <span>EU Data in EU: {status.compliance.euDataInEU ? 'Compliant' : 'Violation'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${status.compliance.usDataInUS ? 'text-green-500' : 'text-red-500'}`} />
                    <span>US Data in US: {status.compliance.usDataInUS ? 'Compliant' : 'Violation'}</span>
                  </div>
                </div>
                
                {status.compliance.violations.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Compliance Violations:</div>
                      <ul className="list-disc list-inside mt-2">
                        {status.compliance.violations.map((violation, index) => (
                          <li key={index}>{violation}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Region Performance</CardTitle>
              <CardDescription>
                Latency measurements between regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {status.performance.regions.map((perf, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{perf.from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium">{perf.to}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(perf.latency / 200 * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{perf.latency.toFixed(0)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disaster Recovery Runbooks</CardTitle>
              <CardDescription>
                Automated disaster recovery procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {runbooks.map((runbook) => (
                  <div key={runbook} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{runbook.replace('-', ' ').toUpperCase()}</div>
                      <div className="text-sm text-gray-600">
                        Automated recovery procedure
                      </div>
                    </div>
                    <Button
                      onClick={() => executeRunbook(runbook)}
                      size="sm"
                      variant="outline"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Execute
                    </Button>
                  </div>
                ))}
              </div>
              
              {executions.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Recent Executions</h4>
                  <div className="space-y-2">
                    {executions.slice(0, 5).map((execution, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{execution.runbookId}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(execution.startTime).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'}>
                          {execution.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}