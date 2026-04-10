import ts from 'typescript';

export interface StyleIssue {
  type: 'STYLE';
  file: string;
  line: number;
  message: string;
}

export class StyleAnalyzer {
  analyze(fileName: string, sourceText: string): StyleIssue[] {
    const issues: StyleIssue[] = [];
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const checkStyle = (node: ts.Node) => {
      // Check variable/function naming styles (camelCase)
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        // Simple heuristic: variables shouldn't start with uppercase unless they are components or classes
        // but we'll flag completely uppercase identifiers not at top level (consts)
        if (name === name.toUpperCase() && name.includes('_') && node.parent.parent.kind !== ts.SyntaxKind.VariableStatement) {
           // Not entirely accurate without full type tree, keep simple for this analyzer
        } else if (/^[A-Z][a-z0-9]/.test(name)) {
           // Might be a React component, class or PascalCase, ignore to prevent false positives.
        } else if (name.includes('-')) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            type: 'STYLE',
            file: fileName,
            line: line + 1,
            message: `Variable '${name}' uses kebab-case. Prefer camelCase for JavaScript variables.`,
          });
        }
      }

      // Check for console.log
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'console' &&
        node.expression.name.text === 'log'
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
          type: 'STYLE',
          file: fileName,
          line: line + 1,
          message: `Avoid using console.log in production code.`,
        });
      }

      // Check for explicit 'any' type usage
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
          type: 'STYLE',
          file: fileName,
          line: line + 1,
          message: `Avoid using 'any' type. Define specific types or use 'unknown'.`,
        });
      }

      ts.forEachChild(node, checkStyle);
    };

    // Check for TODOs in comments safely using a simple string scan
    const lines = sourceText.split('\n');
    lines.forEach((lineText, idx) => {
      if (lineText.includes('//') || lineText.includes('/*') || lineText.includes('*')) {
        if (lineText.includes('TODO') || lineText.includes('FIXME')) {
          issues.push({
            type: 'STYLE',
            file: fileName,
            line: idx + 1,
            message: `Unresolved TODO or FIXME found in comments.`,
          });
        }
      }
    });

    checkStyle(sourceFile);
    return issues;
  }
}
