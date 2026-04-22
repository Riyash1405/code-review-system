import ts from 'typescript';
import { detectLanguage, supportsAst, SMELL_PATTERNS, COMPLEXITY_THRESHOLDS } from './patterns.js';

export interface SmellIssue {
  type: 'SMELL';
  file: string;
  line: number;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export class SmellAnalyzer {
  analyze(fileName: string, sourceText: string): SmellIssue[] {
    const lang = detectLanguage(fileName);

    if (supportsAst(lang)) {
      return this.analyzeWithAst(fileName, sourceText);
    }
    return this.analyzeWithPatterns(fileName, sourceText, lang);
  }

  /**
   * AST-based analysis for JavaScript/TypeScript
   */
  private analyzeWithAst(fileName: string, sourceText: string): SmellIssue[] {
    const issues: SmellIssue[] = [];
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
    const thresholds = COMPLEXITY_THRESHOLDS.javascript;

    const checkFunctionSmells = (node: ts.Node) => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        const lineCount = endLine - startLine;

        if (lineCount > thresholds.maxFunctionLines) {
          issues.push({
            type: 'SMELL', file: fileName, line: startLine + 1,
            message: `Long function detected (${lineCount} lines). Function should ideally be under ${thresholds.maxFunctionLines} lines.`,
            severity: 'medium'
          });
        }

        const paramsCount = node.parameters.length;
        if (paramsCount > thresholds.maxParams) {
          issues.push({
            type: 'SMELL', file: fileName, line: startLine + 1,
            message: `Too many parameters (${paramsCount}). Consider using an options object.`,
            severity: 'low'
          });
        }

        // Deep Nesting Check
        let maxDepth = 0;
        const checkNesting = (subNode: ts.Node, currentDepth: number) => {
          if (
            ts.isIfStatement(subNode) || ts.isForStatement(subNode) ||
            ts.isWhileStatement(subNode) || ts.isSwitchStatement(subNode) || ts.isTryStatement(subNode)
          ) {
            currentDepth++;
            if (currentDepth > thresholds.maxNestingDepth && currentDepth > maxDepth) {
              issues.push({
                type: 'SMELL', file: fileName,
                line: sourceFile.getLineAndCharacterOfPosition(subNode.getStart()).line + 1,
                message: `Deeply nested code logic (depth ${currentDepth}). Extract into helper functions.`,
                severity: 'medium'
              });
              maxDepth = currentDepth;
            }
          }
          ts.forEachChild(subNode, child => checkNesting(child, currentDepth));
        };
        if (node.body) checkNesting(node.body, 0);
      }
      ts.forEachChild(node, checkFunctionSmells);
    };

    checkFunctionSmells(sourceFile);
    return issues;
  }

  /**
   * Regex-based analysis for Python, Java, C++, Go, Ruby
   */
  private analyzeWithPatterns(fileName: string, sourceText: string, lang: string): SmellIssue[] {
    const issues: SmellIssue[] = [];
    const lines = sourceText.split('\n');
    const patterns = SMELL_PATTERNS[lang as keyof typeof SMELL_PATTERNS] || [];
    const thresholds = COMPLEXITY_THRESHOLDS[lang as keyof typeof COMPLEXITY_THRESHOLDS] || COMPLEXITY_THRESHOLDS.unknown;

    // Pattern-based checks
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        if (pattern.regex.test(lines[i])) {
          issues.push({
            type: 'SMELL', file: fileName, line: i + 1,
            message: pattern.message, severity: pattern.severity,
          });
        }
      }
    }

    // Generic function length detection via indentation-based heuristic
    let funcStartLine = -1;
    let funcLineCount = 0;
    const funcRegex = lang === 'python' ? /^\s*def\s+\w+/ :
                      lang === 'java' ? /^\s*(public|private|protected|static|\s)*\s+\w+\s+\w+\s*\(/ :
                      lang === 'go' ? /^\s*func\s+/ :
                      lang === 'ruby' ? /^\s*def\s+/ :
                      /^\s*\w+.*\w+\s*\(/; // C++ generic

    for (let i = 0; i < lines.length; i++) {
      if (funcRegex.test(lines[i])) {
        if (funcStartLine >= 0 && funcLineCount > thresholds.maxFunctionLines) {
          issues.push({
            type: 'SMELL', file: fileName, line: funcStartLine + 1,
            message: `Long function detected (${funcLineCount} lines). Should be under ${thresholds.maxFunctionLines} lines.`,
            severity: 'medium',
          });
        }
        funcStartLine = i;
        funcLineCount = 0;
      }
      funcLineCount++;
    }
    // Check last function
    if (funcStartLine >= 0 && funcLineCount > thresholds.maxFunctionLines) {
      issues.push({
        type: 'SMELL', file: fileName, line: funcStartLine + 1,
        message: `Long function detected (${funcLineCount} lines). Should be under ${thresholds.maxFunctionLines} lines.`,
        severity: 'medium',
      });
    }

    return issues;
  }
}
