import { detectLanguage, supportsAst, SECURITY_PATTERNS } from './patterns.js';
import type { SecurityPattern } from './patterns.js';

export interface SecurityIssue {
  type: 'SECURITY';
  file: string;
  line: number;
  message: string;
  severity: 'high' | 'critical';
}

export class SecurityAnalyzer {
  analyze(fileName: string, sourceText: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = sourceText.split('\n');
    const lang = detectLanguage(fileName);
    const patterns = SECURITY_PATTERNS[lang] || SECURITY_PATTERNS.unknown;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comment lines (basic heuristic for all languages)
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        continue;
      }

      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            type: 'SECURITY',
            file: fileName,
            line: i + 1,
            message: pattern.message,
            severity: pattern.severity,
          });
        }
      }
    }

    return issues;
  }
}
