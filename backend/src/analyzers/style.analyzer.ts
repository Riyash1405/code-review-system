import ts from 'typescript';
import { detectLanguage, supportsAst, STYLE_PATTERNS } from './patterns.js';

export interface StyleIssue {
  type: 'STYLE';
  file: string;
  line: number;
  message: string;
}

export class StyleAnalyzer {
  analyze(fileName: string, sourceText: string): StyleIssue[] {
    const lang = detectLanguage(fileName);
    const issues: StyleIssue[] = [];

    // Universal: check for TODO/FIXME in comments
    const lines = sourceText.split('\n');
    lines.forEach((lineText, idx) => {
      if (lineText.includes('TODO') || lineText.includes('FIXME')) {
        issues.push({
          type: 'STYLE', file: fileName, line: idx + 1,
          message: 'Unresolved TODO or FIXME found in comments.',
        });
      }
    });

    if (supportsAst(lang)) {
      issues.push(...this.analyzeWithAst(fileName, sourceText));
    } else {
      issues.push(...this.analyzeWithPatterns(fileName, sourceText, lang));
    }

    return issues;
  }

  /**
   * AST-based style analysis for JavaScript/TypeScript
   */
  private analyzeWithAst(fileName: string, sourceText: string): StyleIssue[] {
    const issues: StyleIssue[] = [];
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);

    const checkStyle = (node: ts.Node) => {
      // Variable naming — flag kebab-case
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        if (name.includes('-')) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            type: 'STYLE', file: fileName, line: line + 1,
            message: `Variable '${name}' uses kebab-case. Prefer camelCase for JavaScript variables.`,
          });
        }
      }

      // console.log check
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'console' &&
        node.expression.name.text === 'log'
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
          type: 'STYLE', file: fileName, line: line + 1,
          message: 'Avoid using console.log in production code.',
        });
      }

      // Explicit 'any' type usage
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
          type: 'STYLE', file: fileName, line: line + 1,
          message: "Avoid using 'any' type. Define specific types or use 'unknown'.",
        });
      }

      ts.forEachChild(node, checkStyle);
    };

    checkStyle(sourceFile);
    return issues;
  }

  /**
   * Regex-based style analysis for Python, Java, C++, Go, Ruby
   */
  private analyzeWithPatterns(fileName: string, sourceText: string, lang: string): StyleIssue[] {
    const issues: StyleIssue[] = [];
    const lines = sourceText.split('\n');
    const patterns = STYLE_PATTERNS[lang as keyof typeof STYLE_PATTERNS] || [];

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        if (pattern.regex.test(lines[i])) {
          issues.push({
            type: 'STYLE', file: fileName, line: i + 1,
            message: pattern.message,
          });
        }
      }
    }

    return issues;
  }
}
