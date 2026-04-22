import ts from 'typescript';
import { detectLanguage, supportsAst, COMPLEXITY_THRESHOLDS } from './patterns.js';

export interface ComplexityIssue {
  type: 'COMPLEXITY';
  file: string;
  line: number;
  message: string;
  score: number;
}

export class ComplexityAnalyzer {
  analyze(fileName: string, sourceText: string): ComplexityIssue[] {
    const lang = detectLanguage(fileName);

    if (supportsAst(lang)) {
      return this.analyzeWithAst(fileName, sourceText);
    }
    return this.analyzeWithHeuristics(fileName, sourceText, lang);
  }

  /**
   * AST-based cyclomatic complexity for JavaScript/TypeScript
   */
  private analyzeWithAst(fileName: string, sourceText: string): ComplexityIssue[] {
    const issues: ComplexityIssue[] = [];
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);

    const calculateCyclomaticComplexity = (node: ts.Node): number => {
      let complexity = 1;
      const visit = (n: ts.Node) => {
        switch (n.kind) {
          case ts.SyntaxKind.IfStatement:
          case ts.SyntaxKind.WhileStatement:
          case ts.SyntaxKind.DoStatement:
          case ts.SyntaxKind.ForStatement:
          case ts.SyntaxKind.ForInStatement:
          case ts.SyntaxKind.ForOfStatement:
          case ts.SyntaxKind.CaseClause:
          case ts.SyntaxKind.ConditionalExpression:
          case ts.SyntaxKind.CatchClause:
            complexity++;
            break;
          case ts.SyntaxKind.BinaryExpression:
            const binExp = n as ts.BinaryExpression;
            if (binExp.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || 
                binExp.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
              complexity++;
            }
            break;
        }
        ts.forEachChild(n, visit);
      };
      ts.forEachChild(node, visit);
      return complexity;
    };

    const checkFunctions = (node: ts.Node) => {
      if (
        ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) || ts.isFunctionExpression(node)
      ) {
        const complexity = calculateCyclomaticComplexity(node.body ? node.body : node);
        if (complexity > 5) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            type: 'COMPLEXITY', file: fileName, line: line + 1,
            message: `Function is complex (Cyclomatic complexity of ${complexity}). Recommended < 5.`,
            score: complexity,
          });
        }
      }
      ts.forEachChild(node, checkFunctions);
    };

    checkFunctions(sourceFile);
    return issues;
  }

  /**
   * Heuristic-based complexity for non-JS languages
   * Counts branching keywords in detected function bodies
   */
  private analyzeWithHeuristics(fileName: string, sourceText: string, lang: string): ComplexityIssue[] {
    const issues: ComplexityIssue[] = [];
    const lines = sourceText.split('\n');
    const thresholds = COMPLEXITY_THRESHOLDS[lang as keyof typeof COMPLEXITY_THRESHOLDS] || COMPLEXITY_THRESHOLDS.unknown;

    // Language-specific function start pattern
    const funcRegex = lang === 'python' ? /^\s*def\s+(\w+)/ :
                      lang === 'java' ? /^\s*(public|private|protected|static|\s)*\s+\w+\s+(\w+)\s*\(/ :
                      lang === 'go' ? /^\s*func\s+(\w+)/ :
                      lang === 'ruby' ? /^\s*def\s+(\w+)/ :
                      /^\s*\w+.*\s+(\w+)\s*\(/; // C++ generic

    // Branching keywords by language
    const branchKeywords = lang === 'python' ? /\b(if|elif|for|while|except|and|or)\b/g :
                           lang === 'java' ? /\b(if|else\s+if|for|while|catch|case|\&\&|\|\|)\b/g :
                           lang === 'go' ? /\b(if|for|select|case|\&\&|\|\|)\b/g :
                           lang === 'ruby' ? /\b(if|elsif|unless|while|until|when|rescue)\b/g :
                           /\b(if|else\s+if|for|while|switch|case|catch|\&\&|\|\|)\b/g; // C++

    let currentFunc = '';
    let funcStartLine = -1;
    let complexity = 1;

    for (let i = 0; i < lines.length; i++) {
      const funcMatch = funcRegex.exec(lines[i]);
      if (funcMatch) {
        // Score previous function
        if (currentFunc && complexity > 5) {
          issues.push({
            type: 'COMPLEXITY', file: fileName, line: funcStartLine + 1,
            message: `Function "${currentFunc}" is complex (estimated complexity: ${complexity}). Recommended < 5.`,
            score: complexity,
          });
        }
        currentFunc = funcMatch[1] || funcMatch[2] || 'anonymous';
        funcStartLine = i;
        complexity = 1;
      }

      // Count branching keywords
      const matches = lines[i].match(branchKeywords);
      if (matches) {
        complexity += matches.length;
      }
    }

    // Check last function
    if (currentFunc && complexity > 5) {
      issues.push({
        type: 'COMPLEXITY', file: fileName, line: funcStartLine + 1,
        message: `Function "${currentFunc}" is complex (estimated complexity: ${complexity}). Recommended < 5.`,
        score: complexity,
      });
    }

    return issues;
  }
}
