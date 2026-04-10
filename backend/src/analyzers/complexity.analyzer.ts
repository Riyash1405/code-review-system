import ts from 'typescript';

export interface ComplexityIssue {
  type: 'COMPLEXITY';
  file: string;
  line: number;
  message: string;
  score: number;
}

export class ComplexityAnalyzer {
  analyze(fileName: string, sourceText: string): ComplexityIssue[] {
    const issues: ComplexityIssue[] = [];
    
    // Parse the file safely
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    // Function to calculate complexity of a single function or block
    const calculateCycolmaticComplexity = (node: ts.Node): number => {
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

    // Traverse AST to find functions
    const checkFunctions = (node: ts.Node) => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        const complexity = calculateCycolmaticComplexity(node.body ? node.body : node);
        if (complexity > 5) { // Lowered threshold for more accurate reviews
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            type: 'COMPLEXITY',
            file: fileName,
            line: line + 1,
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
}
