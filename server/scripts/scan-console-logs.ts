#!/usr/bin/env node
/**
 * Console Log Scanner
 *
 * Scans all TypeScript files in the project to identify console.log, console.error,
 * and console.warn statements. Generates a comprehensive report with categorization
 * and priority recommendations.
 *
 * Usage:
 *   npx tsx server/scripts/scan-console-logs.ts
 *   npx tsx server/scripts/scan-console-logs.ts --json (for JSON output)
 *   npx tsx server/scripts/scan-console-logs.ts --file=output.json (save to file)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConsoleLogInstance {
  file: string;
  line: number;
  column: number;
  method: 'log' | 'error' | 'warn' | 'info' | 'debug';
  code: string;
  context: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
}

interface ScanResult {
  timestamp: string;
  totalFiles: number;
  filesScanned: number;
  totalInstances: number;
  byMethod: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  instances: ConsoleLogInstance[];
  summary: {
    highPriority: ConsoleLogInstance[];
    mediumPriority: ConsoleLogInstance[];
    lowPriority: ConsoleLogInstance[];
  };
}

class ConsoleLogScanner {
  private projectRoot: string;
  private instances: ConsoleLogInstance[] = [];
  private excludePatterns: RegExp[] = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /\.next/,
    /coverage/,
    /\.turbo/,
  ];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Main scan function
   */
  async scan(): Promise<ScanResult> {
    console.log('Starting console.log scan...\n');

    const files = this.getTypeScriptFiles(this.projectRoot);
    console.log(`Found ${files.length} TypeScript files to scan\n`);

    for (const file of files) {
      this.scanFile(file);
    }

    return this.generateReport(files.length);
  }

  /**
   * Recursively get all TypeScript files
   */
  private getTypeScriptFiles(dir: string, files: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip excluded patterns
      if (this.excludePatterns.some(pattern => pattern.test(fullPath))) {
        continue;
      }

      if (entry.isDirectory()) {
        this.getTypeScriptFiles(fullPath, files);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Scan a single file for console statements
   */
  private scanFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Regex patterns for console methods
    const consolePattern = /console\.(log|error|warn|info|debug)\s*\(/g;

    lines.forEach((line, index) => {
      const matches = [...line.matchAll(consolePattern)];

      for (const match of matches) {
        const method = match[1] as 'log' | 'error' | 'warn' | 'info' | 'debug';
        const column = match.index || 0;

        // Extract the full console statement (may span multiple lines)
        const code = this.extractConsoleStatement(lines, index, column);

        // Get surrounding context
        const context = this.getContext(lines, index);

        // Determine priority and category
        const priority = this.determinePriority(filePath, method, code);
        const category = this.determineCategory(filePath, code);

        this.instances.push({
          file: path.relative(this.projectRoot, filePath),
          line: index + 1,
          column,
          method,
          code,
          context,
          priority,
          category,
        });
      }
    });
  }

  /**
   * Extract the full console statement (handles multi-line)
   */
  private extractConsoleStatement(lines: string[], startLine: number, column: number): string {
    let statement = lines[startLine].substring(column);
    let openParens = 0;
    let inString = false;
    let stringChar = '';

    // Count parentheses to find the end
    for (let i = 0; i < statement.length; i++) {
      const char = statement[i];

      if ((char === '"' || char === "'" || char === '`') && statement[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(') openParens++;
        if (char === ')') {
          openParens--;
          if (openParens === 0) {
            return statement.substring(0, i + 1).trim();
          }
        }
      }
    }

    // If not closed on same line, check next lines
    let currentLine = startLine + 1;
    while (currentLine < lines.length && openParens > 0) {
      const line = lines[currentLine];
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        statement += char;

        if ((char === '"' || char === "'" || char === '`') && line[i - 1] !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
        }

        if (!inString) {
          if (char === '(') openParens++;
          if (char === ')') {
            openParens--;
            if (openParens === 0) {
              return statement.trim();
            }
          }
        }
      }
      currentLine++;
    }

    return statement.trim();
  }

  /**
   * Get surrounding code context
   */
  private getContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - 2);
    const end = Math.min(lines.length, lineIndex + 3);
    return lines.slice(start, end).join('\n').trim();
  }

  /**
   * Determine priority based on file location and usage
   */
  private determinePriority(filePath: string, method: string, code: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const relativePath = path.relative(this.projectRoot, filePath);

    // HIGH PRIORITY: Server-side code, especially routes and services
    if (relativePath.includes('server/routes') ||
        relativePath.includes('server/services') ||
        relativePath === 'server/routes.ts' ||
        relativePath === 'server/storage.ts' ||
        relativePath === 'server/index.ts') {
      return 'HIGH';
    }

    // LOW PRIORITY: Scripts, tests, and development files
    if (relativePath.includes('/scripts/') ||
        relativePath.includes('/test/') ||
        relativePath.includes('.test.') ||
        relativePath.includes('.spec.') ||
        relativePath.includes('/examples/')) {
      return 'LOW';
    }

    // MEDIUM PRIORITY: Client-side code and other server files
    if (relativePath.includes('client/') || relativePath.includes('mobile/')) {
      return 'MEDIUM';
    }

    // Default to HIGH for server code, MEDIUM for others
    return relativePath.includes('server/') ? 'HIGH' : 'MEDIUM';
  }

  /**
   * Determine log category based on context
   */
  private determineCategory(filePath: string, code: string): string {
    const lowerCode = code.toLowerCase();
    const relativePath = path.relative(this.projectRoot, filePath);

    // Check code content for category hints
    if (lowerCode.includes('auth') || lowerCode.includes('login') || lowerCode.includes('token')) {
      return 'auth';
    }
    if (lowerCode.includes('error') || lowerCode.includes('exception')) {
      return 'error';
    }
    if (lowerCode.includes('database') || lowerCode.includes('query') || lowerCode.includes('sql')) {
      return 'database';
    }
    if (lowerCode.includes('request') || lowerCode.includes('response') || lowerCode.includes('req.') || lowerCode.includes('res.')) {
      return 'request';
    }
    if (lowerCode.includes('ai') || lowerCode.includes('openai') || lowerCode.includes('analysis')) {
      return 'ai';
    }
    if (lowerCode.includes('security') || lowerCode.includes('rate limit')) {
      return 'security';
    }

    // Check file path for category hints
    if (relativePath.includes('auth')) return 'auth';
    if (relativePath.includes('services/')) return 'service';
    if (relativePath.includes('middleware/')) return 'middleware';
    if (relativePath.includes('routes')) return 'routes';

    return 'general';
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(totalFiles: number): ScanResult {
    const byMethod: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.instances.forEach(instance => {
      byMethod[instance.method] = (byMethod[instance.method] || 0) + 1;
      byPriority[instance.priority] = (byPriority[instance.priority] || 0) + 1;
      byCategory[instance.category] = (byCategory[instance.category] || 0) + 1;
    });

    return {
      timestamp: new Date().toISOString(),
      totalFiles,
      filesScanned: new Set(this.instances.map(i => i.file)).size,
      totalInstances: this.instances.length,
      byMethod,
      byPriority,
      byCategory,
      instances: this.instances,
      summary: {
        highPriority: this.instances.filter(i => i.priority === 'HIGH'),
        mediumPriority: this.instances.filter(i => i.priority === 'MEDIUM'),
        lowPriority: this.instances.filter(i => i.priority === 'LOW'),
      },
    };
  }
}

/**
 * Format report for console output
 */
function formatReport(result: ScanResult): string {
  let output = '\n';
  output += '='.repeat(80) + '\n';
  output += '  CONSOLE.LOG SCAN REPORT\n';
  output += '='.repeat(80) + '\n\n';

  output += `Scan Date: ${new Date(result.timestamp).toLocaleString()}\n`;
  output += `Total Files: ${result.totalFiles}\n`;
  output += `Files with Console Logs: ${result.filesScanned}\n`;
  output += `Total Console Statements: ${result.totalInstances}\n\n`;

  output += '-'.repeat(80) + '\n';
  output += '  BY METHOD\n';
  output += '-'.repeat(80) + '\n';
  Object.entries(result.byMethod)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      output += `  console.${method.padEnd(8)} : ${count}\n`;
    });

  output += '\n' + '-'.repeat(80) + '\n';
  output += '  BY PRIORITY\n';
  output += '-'.repeat(80) + '\n';
  Object.entries(result.byPriority)
    .sort((a, b) => {
      const order = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return order[a[0] as keyof typeof order] - order[b[0] as keyof typeof order];
    })
    .forEach(([priority, count]) => {
      const icon = priority === 'HIGH' ? '⚠️ ' : priority === 'MEDIUM' ? '⚡' : '📝';
      output += `  ${icon} ${priority.padEnd(10)} : ${count}\n`;
    });

  output += '\n' + '-'.repeat(80) + '\n';
  output += '  BY CATEGORY\n';
  output += '-'.repeat(80) + '\n';
  Object.entries(result.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      output += `  ${category.padEnd(15)} : ${count}\n`;
    });

  // HIGH PRIORITY FILES
  output += '\n' + '='.repeat(80) + '\n';
  output += '  HIGH PRIORITY FILES (Replace These First)\n';
  output += '='.repeat(80) + '\n\n';

  const highPriorityByFile = new Map<string, ConsoleLogInstance[]>();
  result.summary.highPriority.forEach(instance => {
    if (!highPriorityByFile.has(instance.file)) {
      highPriorityByFile.set(instance.file, []);
    }
    highPriorityByFile.get(instance.file)!.push(instance);
  });

  Array.from(highPriorityByFile.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([file, instances]) => {
      output += `📁 ${file} (${instances.length} instances)\n`;
      instances.forEach(instance => {
        output += `   Line ${instance.line}: console.${instance.method}() [${instance.category}]\n`;
        output += `   ${instance.code.substring(0, 80)}${instance.code.length > 80 ? '...' : ''}\n\n`;
      });
    });

  // TOP 10 FILES
  output += '\n' + '='.repeat(80) + '\n';
  output += '  TOP 10 FILES BY CONSOLE STATEMENT COUNT\n';
  output += '='.repeat(80) + '\n\n';

  const fileGroups = new Map<string, ConsoleLogInstance[]>();
  result.instances.forEach(instance => {
    if (!fileGroups.has(instance.file)) {
      fileGroups.set(instance.file, []);
    }
    fileGroups.get(instance.file)!.push(instance);
  });

  Array.from(fileGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([file, instances], index) => {
      const priority = instances[0].priority;
      const icon = priority === 'HIGH' ? '⚠️ ' : priority === 'MEDIUM' ? '⚡' : '📝';
      output += `${(index + 1).toString().padStart(2)}. ${icon} ${file} (${instances.length} instances)\n`;
    });

  output += '\n' + '='.repeat(80) + '\n';
  output += '  NEXT STEPS\n';
  output += '='.repeat(80) + '\n\n';
  output += '1. Review LOGGING_MIGRATION.md for migration guidelines\n';
  output += '2. Start with HIGH priority files (server/routes.ts, server/storage.ts)\n';
  output += '3. Use generate-log-replacements.ts to create replacement patches\n';
  output += '4. Review examples/logging-patterns.ts for common patterns\n';
  output += '5. Run verify-logging.ts after making changes\n\n';

  return output;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const fileOutput = args.find(arg => arg.startsWith('--file='))?.split('=')[1];

  const projectRoot = path.resolve(__dirname, '../..');
  const scanner = new ConsoleLogScanner(projectRoot);

  const result = await scanner.scan();

  if (jsonOutput || fileOutput) {
    const json = JSON.stringify(result, null, 2);

    if (fileOutput) {
      const outputPath = path.resolve(projectRoot, fileOutput);
      fs.writeFileSync(outputPath, json, 'utf-8');
      console.log(`\nReport saved to: ${outputPath}`);
    } else {
      console.log(json);
    }
  } else {
    console.log(formatReport(result));
  }

  // Also save a JSON copy for other scripts to use
  const jsonPath = path.join(projectRoot, 'logs', 'console-log-scan.json');
  const logsDir = path.dirname(jsonPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\nDetailed JSON report saved to: ${jsonPath}`);
}

// Run the scanner
main().catch(console.error);
