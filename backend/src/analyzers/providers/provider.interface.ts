import { Issue } from '../scoring.service.js';

/**
 * Unified interface that all AI providers must implement.
 * Every provider returns the same format regardless of the underlying model.
 */
export interface LlmProvider {
  readonly name: string;
  analyze(files: { path: string; content: string }[]): Promise<{
    score: number;
    summary: string;
    issues: Issue[];
  }>;
}

/**
 * The shared system prompt used by all providers.
 */
export const CODE_REVIEW_PROMPT = `You are a Principal Software Engineer and Security Auditor performing a thorough, industry-grade code review.

Analyze the provided codebase and respond STRICTLY in valid JSON format without any markdown wrappers, code fences, or preamble.

The JSON must follow this exact schema:
{
  "score": number,
  "summary": string,
  "issues": [
    {
      "type": "COMPLEXITY" | "SMELL" | "STYLE" | "SECURITY" | "PERFORMANCE",
      "severity": "critical" | "high" | "medium" | "low",
      "file": string,
      "line": number,
      "message": string,
      "suggestion": string
    }
  ]
}

SCORING RULES (score out of 100):
- Start at 100 and deduct based on real problems found
- critical issues: -15 each, high: -8 each, medium: -3 each, low: -1 each
- Floor at 0. Do not penalize reasonable function length (under 80 lines is fine)

WHAT TO LOOK FOR:
1. SECURITY: Hardcoded secrets, SQL injection, XSS, eval(), insecure crypto, missing input validation, exposed API keys, CORS misconfig
2. PERFORMANCE: O(n²) or worse algorithms where O(n log n) or O(n) exists, memory leaks, unnecessary re-renders, missing indexes, N+1 queries
3. COMPLEXITY: Deeply nested logic (4+ levels), cyclomatic complexity > 10, god functions doing too many things
4. SMELL: Dead code, copy-pasted blocks, magic numbers, poor naming, missing error handling, swallowed exceptions
5. STYLE: Inconsistent naming conventions, missing types in TypeScript, deprecated API usage

FOR EACH ISSUE:
- "message": Explain WHY this is a problem. Reference Time/Space complexity if relevant (e.g. "This nested loop is O(n²) but could be O(n) with a Set lookup")
- "suggestion": Provide a concrete, actionable fix — show the improved code snippet or describe the exact refactoring step
- "severity": Rate honestly — only use "critical" for security vulnerabilities or data-loss risks

IN THE SUMMARY:
- Give a 2-3 sentence overview mentioning the most impactful findings
- Include counts: e.g. "Found 2 critical security issues, 3 performance bottlenecks, and 5 code smells"

Return ONLY the JSON object. No additional text.`;

/**
 * Build the code context string from files, capped to a max character limit.
 */
export function buildCodeContext(files: { path: string; content: string }[], maxChars: number = 100000): string {
  let codeContext = 'Here is the codebase to review:\n\n';
  let currentCharCount = 0;

  // Support ALL common source/config file types for fullstack projects
  const codeExtensions = /\.(ts|tsx|js|jsx|mjs|cjs|py|java|go|rs|cpp|c|cs|rb|php|swift|kt|scala|vue|svelte|sql|html|htm|css|scss|sass|less|xml|yaml|yml|json|toml|ini|env|properties|gradle|pom|sh|bash|zsh|bat|ps1|dockerfile|tf|hcl|graphql|gql|proto|prisma|ejs|hbs|pug|jade|astro|mdx|lua|r|pl|pm|ex|exs|erl|hs|ml|clj|dart|v|zig|nim|svelte)$/i;
  const sortedFiles = files
    .filter(f => f && f.content && f.content.trim().length > 0 && codeExtensions.test(f.path))
    .sort((a, b) => a.content.length - b.content.length);

  for (const file of sortedFiles) {
    const fileString = `### File: ${file.path} ###\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
    if (currentCharCount + fileString.length > maxChars) {
      break;
    }
    codeContext += fileString;
    currentCharCount += fileString.length;
  }

  if (currentCharCount === 0) {
    throw new Error('No readable source code files found in this repository to analyze.');
  }

  return codeContext;
}

/**
 * Parse a JSON response from an LLM, handling markdown wrappers and carrying all fields
 */
export function parseProviderResponse(responseText: string): { score: number; summary: string; issues: Issue[] } {
  const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const result = JSON.parse(cleaned);
  return {
    score: Math.max(0, Math.min(100, result.score ?? 80)),
    summary: result.summary || 'AI Review completed successfully.',
    issues: Array.isArray(result.issues) ? result.issues.map((issue: any) => ({
      type: issue.type || 'SMELL',
      file: issue.file || 'unknown',
      line: issue.line || 0,
      message: issue.message || '',
      severity: issue.severity || 'medium',
      suggestion: issue.suggestion || '',
    })) : [],
  };
}

