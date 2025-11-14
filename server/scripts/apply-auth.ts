/**
 * Authentication Application Script for ClarityTracker 2
 *
 * This script helps automate the process of applying authentication
 * to endpoints by analyzing routes.ts and generating recommendations.
 *
 * Usage:
 *   ts-node server/scripts/apply-auth.ts [--analyze|--generate|--report]
 *
 * Options:
 *   --analyze   Analyze current authentication coverage
 *   --generate  Generate authentication patches for endpoints
 *   --report    Generate detailed report of authentication status
 *   --dry-run   Preview changes without modifying files
 */

import * as fs from 'fs';
import * as path from 'path';

interface Endpoint {
  method: string;
  path: string;
  lineNumber: number;
  hasAuth: boolean;
  hasRateLimit: boolean;
  currentMiddleware: string[];
  recommendedAuth: string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  reasoning: string;
}

interface AuthReport {
  totalEndpoints: number;
  authenticatedEndpoints: number;
  unauthenticatedEndpoints: number;
  byCategory: Record<string, {
    total: number;
    authenticated: number;
    unauthenticated: number;
  }>;
  byPriority: Record<string, number>;
  criticalIssues: Endpoint[];
}

class AuthAnalyzer {
  private routesPath: string;
  private routesContent: string;
  private endpoints: Endpoint[] = [];

  constructor() {
    this.routesPath = path.join(__dirname, '../routes.ts');
    this.routesContent = fs.readFileSync(this.routesPath, 'utf-8');
  }

  /**
   * Main analysis function
   */
  analyze(): AuthReport {
    console.log('🔍 Analyzing authentication coverage...\n');

    this.extractEndpoints();
    this.categorizeEndpoints();
    this.assessAuthenticationStatus();

    return this.generateReport();
  }

  /**
   * Extract all endpoints from routes.ts
   */
  private extractEndpoints(): void {
    const lines = this.routesContent.split('\n');
    const endpointRegex = /app\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/;

    lines.forEach((line, index) => {
      const match = line.match(endpointRegex);
      if (match) {
        const [, method, path] = match;

        // Check for middleware in the line
        const middleware = this.extractMiddleware(line);
        const hasAuth = this.checkForAuth(middleware);
        const hasRateLimit = this.checkForRateLimit(middleware);

        this.endpoints.push({
          method: method.toUpperCase(),
          path,
          lineNumber: index + 1,
          hasAuth,
          hasRateLimit,
          currentMiddleware: middleware,
          recommendedAuth: [],
          priority: 'MEDIUM',
          category: 'uncategorized',
          reasoning: ''
        });
      }
    });

    console.log(`✓ Found ${this.endpoints.length} endpoints\n`);
  }

  /**
   * Extract middleware from endpoint declaration
   */
  private extractMiddleware(line: string): string[] {
    const middleware: string[] = [];

    // Check for common middleware patterns
    if (line.includes('verifyToken')) middleware.push('verifyToken');
    if (line.includes('requireRole')) middleware.push('requireRole');
    if (line.includes('verifyOwnership')) middleware.push('verifyOwnership');
    if (line.includes('optionalAuth')) middleware.push('optionalAuth');
    if (line.includes('adminRateLimit')) middleware.push('adminRateLimit');
    if (line.includes('authRateLimit')) middleware.push('authRateLimit');
    if (line.includes('aiAnalysisRateLimit')) middleware.push('aiAnalysisRateLimit');
    if (line.includes('basicRateLimit')) middleware.push('basicRateLimit');
    if (line.includes('dataExportRateLimit')) middleware.push('dataExportRateLimit');

    return middleware;
  }

  /**
   * Check if endpoint has authentication
   */
  private checkForAuth(middleware: string[]): boolean {
    return middleware.some(m =>
      ['verifyToken', 'requireRole', 'verifyOwnership', 'optionalAuth'].includes(m)
    );
  }

  /**
   * Check if endpoint has rate limiting
   */
  private checkForRateLimit(middleware: string[]): boolean {
    return middleware.some(m => m.includes('RateLimit'));
  }

  /**
   * Categorize endpoints by path
   */
  private categorizeEndpoints(): void {
    this.endpoints.forEach(endpoint => {
      const path = endpoint.path;

      if (path.startsWith('/api/admin/')) {
        endpoint.category = 'admin';
      } else if (path.startsWith('/api/supervision/')) {
        endpoint.category = 'supervision';
      } else if (path.startsWith('/api/supervisors') || path.startsWith('/api/supervisees')) {
        endpoint.category = 'supervision';
      } else if (path.startsWith('/api/clients') || path.startsWith('/api/client-')) {
        endpoint.category = 'clients';
      } else if (path.startsWith('/api/ai/')) {
        endpoint.category = 'ai';
      } else if (path.startsWith('/api/privacy')) {
        endpoint.category = 'privacy';
      } else if (path.startsWith('/api/session')) {
        endpoint.category = 'sessions';
      } else if (path.startsWith('/api/intelligence/')) {
        endpoint.category = 'intelligence';
      } else if (path.startsWith('/api/research/')) {
        endpoint.category = 'research';
      } else if (path.startsWith('/api/feature-flags')) {
        endpoint.category = 'feature-flags';
      } else if (path.startsWith('/api/health')) {
        endpoint.category = 'health';
      } else if (path.startsWith('/api/analytics')) {
        endpoint.category = 'analytics';
      } else if (path.startsWith('/api/auth/')) {
        endpoint.category = 'auth';
      } else if (path.startsWith('/api/feedback')) {
        endpoint.category = 'feedback';
      } else {
        endpoint.category = 'other';
      }
    });

    console.log('✓ Categorized endpoints\n');
  }

  /**
   * Assess authentication status and recommend changes
   */
  private assessAuthenticationStatus(): void {
    this.endpoints.forEach(endpoint => {
      const { category, path, method } = endpoint;

      // Admin endpoints
      if (category === 'admin') {
        endpoint.priority = 'CRITICAL';
        endpoint.recommendedAuth = ['verifyToken', "requireRole(['admin'])"];
        endpoint.reasoning = 'Admin operations require strict authentication and role checking';
      }

      // Privacy endpoints
      else if (category === 'privacy') {
        endpoint.priority = 'CRITICAL';
        if (path.includes('export-data')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership', 'dataExportRateLimit'];
          endpoint.reasoning = 'Data export is HIPAA-critical and must verify ownership';
        } else {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'Privacy data must be protected with ownership verification';
        }
      }

      // Client endpoints
      else if (category === 'clients') {
        endpoint.priority = 'CRITICAL';
        if (path.includes(':therapistId') || path.includes(':clientId') || path.includes(':id')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership or verifyClientAccess'];
          endpoint.reasoning = 'Client data is PHI and requires strict ownership verification';
        } else if (method === 'POST' && path === '/api/clients') {
          endpoint.recommendedAuth = ['verifyToken'];
          endpoint.reasoning = 'Creating clients requires authentication';
        } else {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'All client data must be protected';
        }
      }

      // Supervision endpoints
      else if (category === 'supervision') {
        endpoint.priority = 'HIGH';
        if (path.includes(':supervisorId') || path.includes(':superviseeId')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'Supervision data requires ownership verification';
        } else if (path.includes('/frameworks') || path.includes('/competency-areas')) {
          endpoint.recommendedAuth = ['verifyToken'];
          endpoint.reasoning = 'General supervision resources require authentication';
        } else {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'Supervision relationships must be protected';
        }
      }

      // Feature flags
      else if (category === 'feature-flags') {
        endpoint.priority = 'CRITICAL';
        endpoint.recommendedAuth = ['adminRateLimit', 'verifyToken', "requireRole(['admin'])"];
        endpoint.reasoning = 'Feature flags control system behavior - admin only';
      }

      // AI endpoints
      else if (category === 'ai') {
        endpoint.priority = 'MEDIUM';
        if (path.includes(':userId')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'User-specific AI data requires ownership verification';
        } else {
          endpoint.recommendedAuth = ['verifyToken', 'aiAnalysisRateLimit'];
          endpoint.reasoning = 'AI operations are expensive and require authentication';
        }
      }

      // Session endpoints
      else if (category === 'sessions') {
        endpoint.priority = 'MEDIUM';
        if (path.includes(':sessionId') || path.includes(':id')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifySessionOwnership'];
          endpoint.reasoning = 'Session data requires ownership verification';
        } else {
          endpoint.recommendedAuth = ['verifyToken'];
          endpoint.reasoning = 'Session operations require authentication';
        }
      }

      // Intelligence endpoints
      else if (category === 'intelligence') {
        endpoint.priority = 'MEDIUM';
        if (path.includes(':userId')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'User intelligence data requires ownership verification';
        } else {
          endpoint.recommendedAuth = ['verifyToken'];
          endpoint.reasoning = 'Intelligence features require authentication';
        }
      }

      // Research endpoints
      else if (category === 'research') {
        endpoint.priority = 'MEDIUM';
        if (path.includes(':userId')) {
          endpoint.recommendedAuth = ['verifyToken', 'verifyOwnership'];
          endpoint.reasoning = 'User research data requires ownership verification';
        } else {
          endpoint.recommendedAuth = ['verifyToken'];
          endpoint.reasoning = 'Research features require authentication';
        }
      }

      // Health endpoints
      else if (category === 'health') {
        endpoint.priority = 'LOW';
        endpoint.recommendedAuth = ['optionalAuth'];
        endpoint.reasoning = 'Health checks should be publicly accessible for monitoring';
      }

      // Auth endpoints
      else if (category === 'auth') {
        endpoint.priority = 'LOW';
        endpoint.recommendedAuth = ['authRateLimit'];
        endpoint.reasoning = 'Auth endpoints are public but need rate limiting';
      }

      // Analytics endpoints
      else if (category === 'analytics') {
        endpoint.priority = 'LOW';
        if (path.startsWith('/api/admin/analytics')) {
          endpoint.priority = 'CRITICAL';
          endpoint.recommendedAuth = ['verifyToken', "requireRole(['admin'])"];
          endpoint.reasoning = 'Admin analytics require authentication';
        } else {
          endpoint.recommendedAuth = ['optionalAuth'];
          endpoint.reasoning = 'Analytics tracking can work with optional auth';
        }
      }

      // Feedback endpoints
      else if (category === 'feedback') {
        endpoint.priority = 'MEDIUM';
        if (path.startsWith('/api/admin/feedback') || path.startsWith('/api/replit/feedback')) {
          endpoint.recommendedAuth = ['verifyToken', "requireRole(['admin'])"];
          endpoint.reasoning = 'Feedback management requires admin access';
        } else {
          endpoint.recommendedAuth = ['verifyToken'];
          endpoint.reasoning = 'Feedback submission requires authentication';
        }
      }

      // Other endpoints
      else {
        endpoint.priority = 'MEDIUM';
        endpoint.recommendedAuth = ['verifyToken'];
        endpoint.reasoning = 'Default: require authentication for unknown endpoints';
      }
    });

    console.log('✓ Assessed authentication requirements\n');
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(): AuthReport {
    const report: AuthReport = {
      totalEndpoints: this.endpoints.length,
      authenticatedEndpoints: this.endpoints.filter(e => e.hasAuth).length,
      unauthenticatedEndpoints: this.endpoints.filter(e => !e.hasAuth).length,
      byCategory: {},
      byPriority: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      criticalIssues: []
    };

    // Count by category
    this.endpoints.forEach(endpoint => {
      if (!report.byCategory[endpoint.category]) {
        report.byCategory[endpoint.category] = {
          total: 0,
          authenticated: 0,
          unauthenticated: 0
        };
      }

      report.byCategory[endpoint.category].total++;
      if (endpoint.hasAuth) {
        report.byCategory[endpoint.category].authenticated++;
      } else {
        report.byCategory[endpoint.category].unauthenticated++;
      }
    });

    // Count by priority
    this.endpoints.forEach(endpoint => {
      if (!endpoint.hasAuth) {
        report.byPriority[endpoint.priority]++;
      }
    });

    // Identify critical issues
    report.criticalIssues = this.endpoints.filter(
      e => !e.hasAuth && (e.priority === 'CRITICAL' || e.priority === 'HIGH')
    );

    return report;
  }

  /**
   * Print detailed report to console
   */
  printReport(report: AuthReport): void {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('       AUTHENTICATION COVERAGE REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Overall statistics
    console.log('📊 Overall Statistics:');
    console.log(`   Total Endpoints: ${report.totalEndpoints}`);
    console.log(`   ✓ Authenticated: ${report.authenticatedEndpoints} (${Math.round(report.authenticatedEndpoints / report.totalEndpoints * 100)}%)`);
    console.log(`   ✗ Missing Auth:  ${report.unauthenticatedEndpoints} (${Math.round(report.unauthenticatedEndpoints / report.totalEndpoints * 100)}%)\n`);

    // By category
    console.log('📁 By Category:');
    Object.entries(report.byCategory)
      .sort(([, a], [, b]) => b.unauthenticated - a.unauthenticated)
      .forEach(([category, stats]) => {
        const coverage = Math.round(stats.authenticated / stats.total * 100);
        const icon = stats.unauthenticated === 0 ? '✓' : '✗';
        console.log(`   ${icon} ${category.padEnd(20)} ${stats.authenticated}/${stats.total} (${coverage}% covered)`);
      });
    console.log();

    // By priority
    console.log('🚨 Unauthenticated Endpoints by Priority:');
    console.log(`   CRITICAL: ${report.byPriority.CRITICAL}`);
    console.log(`   HIGH:     ${report.byPriority.HIGH}`);
    console.log(`   MEDIUM:   ${report.byPriority.MEDIUM}`);
    console.log(`   LOW:      ${report.byPriority.LOW}\n`);

    // Critical issues
    if (report.criticalIssues.length > 0) {
      console.log('🔴 CRITICAL & HIGH PRIORITY ISSUES:');
      console.log('   (These should be fixed immediately)\n');

      report.criticalIssues.slice(0, 20).forEach((endpoint, index) => {
        console.log(`   ${index + 1}. [${endpoint.priority}] ${endpoint.method} ${endpoint.path}`);
        console.log(`      Line: ${endpoint.lineNumber}`);
        console.log(`      Category: ${endpoint.category}`);
        console.log(`      Recommended: ${endpoint.recommendedAuth.join(', ')}`);
        console.log(`      Reason: ${endpoint.reasoning}\n`);
      });

      if (report.criticalIssues.length > 20) {
        console.log(`   ... and ${report.criticalIssues.length - 20} more critical issues\n`);
      }
    } else {
      console.log('✅ No critical authentication issues found!\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  /**
   * Generate authentication patches
   */
  generatePatches(outputPath?: string): void {
    console.log('🔧 Generating authentication patches...\n');

    const patches = this.endpoints
      .filter(e => !e.hasAuth && e.recommendedAuth.length > 0)
      .map(endpoint => ({
        line: endpoint.lineNumber,
        path: endpoint.path,
        method: endpoint.method,
        category: endpoint.category,
        priority: endpoint.priority,
        currentCode: this.getEndpointCode(endpoint.lineNumber),
        recommendedAuth: endpoint.recommendedAuth,
        suggestedCode: this.generateSuggestedCode(endpoint),
        reasoning: endpoint.reasoning
      }));

    // Write to file
    const output = outputPath || path.join(__dirname, '../AUTH_PATCHES.json');
    fs.writeFileSync(output, JSON.stringify(patches, null, 2));

    console.log(`✓ Generated ${patches.length} patches`);
    console.log(`✓ Saved to: ${output}\n`);

    // Print sample patches
    console.log('Sample patches (first 5):\n');
    patches.slice(0, 5).forEach((patch, index) => {
      console.log(`${index + 1}. [${patch.priority}] ${patch.method} ${patch.path}`);
      console.log(`   Add: ${patch.recommendedAuth.join(', ')}`);
      console.log(`   Reason: ${patch.reasoning}\n`);
    });
  }

  /**
   * Get endpoint code from file
   */
  private getEndpointCode(lineNumber: number): string {
    const lines = this.routesContent.split('\n');
    return lines[lineNumber - 1] || '';
  }

  /**
   * Generate suggested code with authentication
   */
  private generateSuggestedCode(endpoint: Endpoint): string {
    const indent = '  ';
    const middleware = endpoint.recommendedAuth.join(',\n' + indent + '  ');

    return `${indent}app.${endpoint.method.toLowerCase()}("${endpoint.path}",
${indent}  ${middleware},
${indent}  async (req: AuthRequest, res) => {`;
  }

  /**
   * Generate implementation guide
   */
  generateImplementationGuide(): void {
    console.log('📝 Generating implementation guide...\n');

    const guide = `
# Authentication Implementation Guide

## Quick Start

1. **Import Authentication Middleware**
   \`\`\`typescript
   import { verifyToken, requireRole, verifyOwnership, optionalAuth, type AuthRequest } from './middleware/auth';
   \`\`\`

2. **Apply to Endpoints**
   \`\`\`typescript
   // Before
   app.get("/api/clients/:therapistId", async (req, res) => {

   // After
   app.get("/api/clients/:therapistId",
     verifyToken,
     verifyOwnership('therapistId'),
     async (req: AuthRequest, res) => {
   \`\`\`

3. **Access User Info**
   \`\`\`typescript
   const userId = req.user?.id;
   const userRole = req.user?.role;
   const userEmail = req.user?.email;
   \`\`\`

## Implementation Order

### Phase 1: CRITICAL (Week 1)
${this.getEndpointsByPriority('CRITICAL').slice(0, 10).map((e, i) =>
  `${i + 1}. ${e.method} ${e.path}\n   → Add: ${e.recommendedAuth.join(', ')}`
).join('\n\n')}

### Phase 2: HIGH (Week 2)
${this.getEndpointsByPriority('HIGH').slice(0, 10).map((e, i) =>
  `${i + 1}. ${e.method} ${e.path}\n   → Add: ${e.recommendedAuth.join(', ')}`
).join('\n\n')}

See AUTH_IMPLEMENTATION_PLAN.md for complete details.
`;

    const outputPath = path.join(__dirname, '../IMPLEMENTATION_GUIDE.md');
    fs.writeFileSync(outputPath, guide);

    console.log(`✓ Implementation guide saved to: ${outputPath}\n`);
  }

  /**
   * Get endpoints by priority
   */
  private getEndpointsByPriority(priority: string): Endpoint[] {
    return this.endpoints.filter(e => e.priority === priority && !e.hasAuth);
  }

  /**
   * Export endpoints data
   */
  exportData(outputPath?: string): void {
    const output = outputPath || path.join(__dirname, '../AUTH_ANALYSIS.json');
    fs.writeFileSync(output, JSON.stringify(this.endpoints, null, 2));
    console.log(`✓ Exported endpoint data to: ${output}\n`);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--report';

  const analyzer = new AuthAnalyzer();

  switch (command) {
    case '--analyze':
    case '--report':
      const report = analyzer.analyze();
      analyzer.printReport(report);
      break;

    case '--generate':
      analyzer.analyze();
      analyzer.generatePatches();
      break;

    case '--guide':
      analyzer.analyze();
      analyzer.generateImplementationGuide();
      break;

    case '--export':
      analyzer.analyze();
      analyzer.exportData();
      break;

    case '--all':
      const fullReport = analyzer.analyze();
      analyzer.printReport(fullReport);
      analyzer.generatePatches();
      analyzer.generateImplementationGuide();
      analyzer.exportData();
      console.log('✅ Complete! All files generated.\n');
      break;

    default:
      console.log('Usage: ts-node apply-auth.ts [command]\n');
      console.log('Commands:');
      console.log('  --analyze    Analyze and print report (default)');
      console.log('  --generate   Generate authentication patches');
      console.log('  --guide      Generate implementation guide');
      console.log('  --export     Export endpoint data as JSON');
      console.log('  --all        Run all commands');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { AuthAnalyzer, Endpoint, AuthReport };
