export interface Issue {
  type: string;
  file: string;
  line: number;
  message: string;
  severity?: string;
  score?: number;
}

export class ScoringService {
  calculateScore(issues: Issue[]): { score: number; summary: string } {
    let score = 100;

    // Weight configuration (Max deduction per category out of 100 base)
    // We deduct points based on issues found
    let complexityDeductions = 0;   // Max 30
    let smellDeductions = 0;        // Max 30
    let duplicationDeductions = 0;  // Max 20
    let styleDeductions = 0;        // Max 20

    issues.forEach(issue => {
      switch (issue.type) {
        case 'COMPLEXITY':
          complexityDeductions += 2; // Deduct 2 per highly complex function
          break;
        case 'SMELL':
          smellDeductions += (issue.severity === 'high' ? 3 : 1);
          break;
        case 'DUPLICATION':
          duplicationDeductions += 5; // Major penalty for duplicated logic
          break;
        case 'STYLE':
          styleDeductions += 1;
          break;
        case 'SECURITY':
          score -= (issue.severity === 'critical' ? 20 : 10); // Direct massive hit for security flaws
          break;
      }
    });

    // Cap the deductions relative to weights
    complexityDeductions = Math.min(complexityDeductions, 30);
    smellDeductions = Math.min(smellDeductions, 30);
    duplicationDeductions = Math.min(duplicationDeductions, 20);
    styleDeductions = Math.min(styleDeductions, 20);

    // Calculate final score based on capped deductions
    score -= (complexityDeductions + smellDeductions + duplicationDeductions + styleDeductions);

    // Floor score to 0
    score = Math.max(score, 0);

    let summary = 'Excellent code quality!';
    if (score < 50) {
      summary = 'Critical issues found. The code needs significant refactoring.';
    } else if (score < 75) {
      summary = 'Code smells and complexity detected. Consider breaking down large functions or cleaning up duplicates.';
    } else if (score < 90) {
      summary = 'Good code quality, but minor improvements can be made securely and stylistically.';
    }

    if (issues.some(i => i.type === 'SECURITY')) {
      summary += ' WARNING: Security vulnerabilities detected. Address them immediately.';
    }

    return { score, summary };
  }
}
