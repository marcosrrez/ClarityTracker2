#!/usr/bin/env node
/**
 * Log Replacement Generator
 *
 * Analyzes console.log statements and generates suggested replacements
 * using Winston logger with appropriate methods and context.
 *
 * Usage:
 *   npx tsx server/scripts/generate-log-replacements.ts
 *   npx tsx server/scripts/generate-log-replacements.ts --file=server/routes.ts
 *   npx tsx server/scripts/generate-log-replacements.ts --apply (auto-apply changes)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Replacement {
  file: string;
  line: number;
  original: string;
  replacement: string;
  method: 'log' | 'error' | 'warn' | 'info' | 'debug';
  suggestedLoggerMethod: string;
  suggestedCategory: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  requiresLoggerImport: boolean;
}

interface ReplacementReport {
  timestamp: string;
  totalReplacements: number;
  byConfidence: Record<string, number>;
  replacements: Replacement[];
}

class LogReplacementGenerator {
  private projectRoot: string;
  private scanData: any;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.loadScanData();
  }

  /**
   * Load scan data from previous scan
   */
  private loadScanData(): void {
    const scanPath = path.join(this.projectRoot, 'logs', 'console-log-scan.json');
    if (!fs.existsSync(scanPath)) {
      throw new Error(
        'No scan data found. Please run scan-console-logs.ts first.'
      );
    }
    this.scanData = JSON.parse(fs.readFileSync(scanPath, 'utf-8'));
  }

  /**
   * Generate replacements for all or specific file
   */
  generateReplacements(targetFile?: string): ReplacementReport {
    const instances = targetFile
      ? this.scanData.instances.filter((i: any) => i.file === targetFile)
      : this.scanData.instances;

    const replacements: Replacement[] = [];

    for (const instance of instances) {
      const replacement = this.generateReplacement(instance);
      if (replacement) {
        replacements.push(replacement);
      }
    }

    const byConfidence: Record<string, number> = {};
    replacements.forEach(r => {
      byConfidence[r.confidence] = (byConfidence[r.confidence] || 0) + 1;
    });

    return {
      timestamp: new Date().toISOString(),
      totalReplacements: replacements.length,
      byConfidence,
      replacements,
    };
  }

  /**
   * Generate a single replacement
   */
  private generateReplacement(instance: any): Replacement | null {
    const filePath = path.join(this.projectRoot, instance.file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const hasLoggerImport = fileContent.includes('from "./lib/logger"') ||
                           fileContent.includes('from "../lib/logger"') ||
                           fileContent.includes('from "../../lib/logger"');

    // Analyze the console statement
    const analysis = this.analyzeConsoleStatement(instance);

    // Generate the replacement code
    const replacement = this.generateReplacementCode(instance, analysis);

    return {
      file: instance.file,
      line: instance.line,
      original: instance.code,
      replacement,
      method: instance.method,
      suggestedLoggerMethod: analysis.method,
      suggestedCategory: analysis.category,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      requiresLoggerImport: !hasLoggerImport,
    };
  }

  /**
   * Analyze console statement to determine best logger method and category
   */
  private analyzeConsoleStatement(instance: any): {
    method: string;
    category: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    extractedData: any;
  } {
    const code = instance.code.toLowerCase();
    const context = instance.context.toLowerCase();
    const category = instance.category;

    // Error handling
    if (instance.method === 'error' || code.includes('error') || code.includes('exception')) {
      return {
        method: 'logger.error',
        category: category === 'general' ? 'error' : category,
        confidence: 'high',
        reasoning: 'Console.error indicates error condition',
        extractedData: this.extractErrorData(instance.code),
      };
    }

    // Warning
    if (instance.method === 'warn' || code.includes('warning') || code.includes('deprecated')) {
      return {
        method: 'logger.warn',
        category: category,
        confidence: 'high',
        reasoning: 'Console.warn indicates warning condition',
        extractedData: this.extractSimpleData(instance.code),
      };
    }

    // Debug statements
    if (code.includes('debug') || code.includes('trace') || code.includes('verbose')) {
      return {
        method: 'logger.debug',
        category: category,
        confidence: 'high',
        reasoning: 'Explicit debug indicator',
        extractedData: this.extractSimpleData(instance.code),
      };
    }

    // Request/Response logging (should use middleware)
    if (code.includes('request:') || code.includes('req.method') || code.includes('res.status')) {
      return {
        method: 'REMOVE',
        category: 'request',
        confidence: 'high',
        reasoning: 'Request logging handled by middleware',
        extractedData: null,
      };
    }

    // Authentication events
    if (category === 'auth' || code.includes('login') || code.includes('token') || code.includes('auth')) {
      return {
        method: 'logger.info',
        category: 'auth',
        confidence: 'high',
        reasoning: 'Authentication event should use logger.info',
        extractedData: this.extractAuthData(instance.code),
      };
    }

    // Database operations
    if (category === 'database' || code.includes('query') || code.includes('database')) {
      return {
        method: 'logger.debug',
        category: 'database',
        confidence: 'medium',
        reasoning: 'Database operations typically logged at debug level',
        extractedData: this.extractSimpleData(instance.code),
      };
    }

    // AI/API calls
    if (category === 'ai' || code.includes('openai') || code.includes('anthropic') || code.includes('gemini')) {
      return {
        method: 'logger.info',
        category: 'ai',
        confidence: 'high',
        reasoning: 'AI API calls should be logged at info level',
        extractedData: this.extractApiData(instance.code),
      };
    }

    // General info (default case)
    return {
      method: 'logger.info',
      category: category || 'general',
      confidence: 'medium',
      reasoning: 'Default mapping: console.log → logger.info',
      extractedData: this.extractSimpleData(instance.code),
    };
  }

  /**
   * Extract error data from console statement
   */
  private extractErrorData(code: string): any {
    // Try to identify error object
    const errorMatch = code.match(/error|err|e\b/i);
    const messageMatch = code.match(/['"`]([^'"`]+)['"`]/);

    return {
      hasErrorObject: !!errorMatch,
      message: messageMatch ? messageMatch[1] : null,
    };
  }

  /**
   * Extract auth-related data
   */
  private extractAuthData(code: string): any {
    const userMatch = code.match(/user|userId|username/i);
    const emailMatch = code.match(/email/i);

    return {
      hasUser: !!userMatch,
      hasEmail: !!emailMatch,
    };
  }

  /**
   * Extract API call data
   */
  private extractApiData(code: string): any {
    const modelMatch = code.match(/model|gpt|claude/i);
    const tokensMatch = code.match(/tokens|usage/i);

    return {
      hasModel: !!modelMatch,
      hasTokens: !!tokensMatch,
    };
  }

  /**
   * Extract simple data (strings, variables)
   */
  private extractSimpleData(code: string): any {
    const stringMatches = code.match(/['"`]([^'"`]+)['"`]/g) || [];
    const variableMatches = code.match(/\b\w+\b/g) || [];

    return {
      strings: stringMatches.map(s => s.replace(/['"`]/g, '')),
      variables: variableMatches.filter(v => !['console', 'log', 'error', 'warn'].includes(v)),
    };
  }

  /**
   * Generate replacement code
   */
  private generateReplacementCode(instance: any, analysis: any): string {
    if (analysis.method === 'REMOVE') {
      return '// Request logging handled by middleware - removed console.log';
    }

    const data = analysis.extractedData;

    // For errors
    if (analysis.method === 'logger.error' && data.hasErrorObject) {
      const message = data.message || 'Error occurred';
      return `logger.error('${message}', {
  category: '${analysis.category}',
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  operation: '${this.inferOperation(instance)}'
});`;
    }

    // For auth events
    if (analysis.category === 'auth') {
      const message = data.message || 'Authentication event';
      return `logger.info('${message}', {
  category: 'auth',
  userId: userId,
  // Add relevant auth context
});`;
    }

    // For AI calls
    if (analysis.category === 'ai') {
      return `logger.info('AI API call', {
  category: 'ai',
  provider: 'openai', // or 'anthropic', 'google'
  operation: '${this.inferOperation(instance)}',
  // Add model, tokens, etc.
});`;
    }

    // General case - extract message and build context
    const message = this.extractMessage(instance.code);
    const contextObj = this.buildContextObject(instance, data);

    return `${analysis.method}('${message}', ${contextObj});`;
  }

  /**
   * Extract message from console statement
   */
  private extractMessage(code: string): string {
    // Try to find first string literal
    const match = code.match(/['"`]([^'"`]+)['"`]/);
    if (match) {
      return match[1].replace(/'/g, "\\'");
    }

    // Fallback
    return 'Operation completed';
  }

  /**
   * Infer operation name from context
   */
  private inferOperation(instance: any): string {
    const context = instance.context.toLowerCase();

    if (context.includes('function ')) {
      const funcMatch = context.match(/function\s+(\w+)/);
      if (funcMatch) return funcMatch[1];
    }

    if (context.includes('const ')) {
      const constMatch = context.match(/const\s+(\w+)/);
      if (constMatch) return constMatch[1];
    }

    return 'operation';
  }

  /**
   * Build context object for logger
   */
  private buildContextObject(instance: any, data: any): string {
    const context: any = {
      category: instance.category,
    };

    // Add file info for debugging
    if (instance.priority === 'HIGH') {
      context.file = instance.file;
    }

    return JSON.stringify(context, null, 2).replace(/\n/g, '\n  ');
  }

  /**
   * Apply replacements to files
   */
  applyReplacements(report: ReplacementReport, dryRun: boolean = true): void {
    console.log(`\n${dryRun ? 'DRY RUN - ' : ''}Applying replacements...\n`);

    // Group by file
    const byFile = new Map<string, Replacement[]>();
    report.replacements.forEach(r => {
      if (!byFile.has(r.file)) {
        byFile.set(r.file, []);
      }
      byFile.get(r.file)!.push(r);
    });

    byFile.forEach((replacements, file) => {
      const filePath = path.join(this.projectRoot, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      console.log(`Processing ${file}...`);

      // Check if logger import is needed
      const needsImport = replacements.some(r => r.requiresLoggerImport);
      if (needsImport) {
        content = this.addLoggerImport(content, file);
        console.log(`  + Added logger import`);
      }

      // Apply replacements (in reverse order to maintain line numbers)
      const sorted = [...replacements].sort((a, b) => b.line - a.line);

      sorted.forEach(replacement => {
        if (replacement.confidence === 'high') {
          const lineIndex = replacement.line - 1;
          const originalLine = lines[lineIndex];

          // Simple replacement (would need more sophisticated approach for multi-line)
          lines[lineIndex] = originalLine.replace(
            replacement.original,
            replacement.replacement
          );

          console.log(`  ✓ Line ${replacement.line}: ${replacement.method} → ${replacement.suggestedLoggerMethod}`);
        } else {
          console.log(`  ⚠ Line ${replacement.line}: ${replacement.confidence} confidence - review manually`);
        }
      });

      if (!dryRun) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        console.log(`  💾 Saved changes to ${file}`);
      } else {
        console.log(`  📋 DRY RUN - no changes made`);
      }

      console.log();
    });
  }

  /**
   * Add logger import to file
   */
  private addLoggerImport(content: string, file: string): string {
    const lines = content.split('\n');

    // Find the last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
      if (lastImportIndex !== -1 && !lines[i].trim().startsWith('import ') && lines[i].trim() !== '') {
        break;
      }
    }

    // Determine relative path to logger
    const depth = file.split('/').length - 2; // -2 for server/ prefix
    const relativePath = '../'.repeat(Math.max(1, depth)) + 'lib/logger';

    const importStatement = `import { logger } from '${relativePath}';`;

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
    } else {
      lines.unshift(importStatement);
    }

    return lines.join('\n');
  }
}

/**
 * Format replacement report
 */
function formatReport(report: ReplacementReport): string {
  let output = '\n';
  output += '='.repeat(80) + '\n';
  output += '  LOG REPLACEMENT SUGGESTIONS\n';
  output += '='.repeat(80) + '\n\n';

  output += `Generated: ${new Date(report.timestamp).toLocaleString()}\n`;
  output += `Total Replacements: ${report.totalReplacements}\n\n`;

  output += 'By Confidence:\n';
  Object.entries(report.byConfidence)
    .sort((a, b) => {
      const order = { high: 1, medium: 2, low: 3 };
      return order[a[0] as keyof typeof order] - order[b[0] as keyof typeof order];
    })
    .forEach(([confidence, count]) => {
      output += `  ${confidence.toUpperCase().padEnd(10)} : ${count}\n`;
    });

  output += '\n' + '='.repeat(80) + '\n';
  output += '  HIGH CONFIDENCE REPLACEMENTS\n';
  output += '='.repeat(80) + '\n\n';

  const highConfidence = report.replacements.filter(r => r.confidence === 'high');

  const byFile = new Map<string, Replacement[]>();
  highConfidence.forEach(r => {
    if (!byFile.has(r.file)) {
      byFile.set(r.file, []);
    }
    byFile.get(r.file)!.push(r);
  });

  byFile.forEach((replacements, file) => {
    output += `\n📁 ${file}\n`;
    if (replacements[0].requiresLoggerImport) {
      output += `   ⚠️  Requires logger import\n`;
    }
    output += '\n';

    replacements.forEach(r => {
      output += `   Line ${r.line}:\n`;
      output += `   BEFORE: ${r.original}\n`;
      output += `   AFTER:  ${r.replacement.split('\n')[0]}...\n`;
      output += `   Reason: ${r.reasoning}\n\n`;
    });
  });

  output += '\n' + '='.repeat(80) + '\n';
  output += '  NEXT STEPS\n';
  output += '='.repeat(80) + '\n\n';
  output += '1. Review high confidence replacements above\n';
  output += '2. Run with --apply to automatically apply high confidence changes\n';
  output += '3. Manually review medium/low confidence replacements\n';
  output += '4. Run verify-logging.ts to check results\n\n';

  return output;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const targetFile = args.find(arg => arg.startsWith('--file='))?.split('=')[1];
  const apply = args.includes('--apply');
  const dryRun = !apply;

  const projectRoot = path.resolve(__dirname, '../..');
  const generator = new LogReplacementGenerator(projectRoot);

  const report = generator.generateReplacements(targetFile);

  console.log(formatReport(report));

  // Save report
  const reportPath = path.join(projectRoot, 'logs', 'log-replacements.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nDetailed report saved to: ${reportPath}`);

  // Apply if requested
  if (apply || args.includes('--dry-run')) {
    generator.applyReplacements(report, dryRun);
  }
}

main().catch(console.error);
