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

    const patterns = [
      { regex: /(password|secret|token|key)\s*[:=]\s*['"][a-zA-Z0-9_-]{8,}['"]/i, danger: 'high', desc: 'Possible hardcoded secret or token detected.' },
      { regex: /eval\s*\(/i, danger: 'critical', desc: 'Usage of eval() is a major security risk.' },
      { regex: /dangerouslySetInnerHTML/i, danger: 'high', desc: 'Usage of dangerouslySetInnerHTML can lead to XSS vulnerabilities.' }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          // Additional check: exclude obvious test data or non-code
          if (!line.includes('//') && !line.trim().startsWith('/*')) {
             issues.push({
              type: 'SECURITY',
              file: fileName,
              line: i + 1,
              message: pattern.desc,
              severity: pattern.danger as 'high' | 'critical'
            });
          }
        }
      }
    }

    return issues;
  }
}
