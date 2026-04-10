import ts from 'typescript';

export interface SmellIssue {
  type: 'SMELL';
  file: string;
  line: number;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export class SmellAnalyzer {
  analyze(fileName: string, sourceText: string): SmellIssue[] {
    const issues: SmellIssue[] = [];
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

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
        
        if (lineCount > 25) {
          issues.push({
            type: 'SMELL',
            file: fileName,
            line: startLine + 1,
            message: `Long function detected (${lineCount} lines). Function should ideally be under 25 lines.`,
            severity: 'medium'
          });
        }

        const paramsCount = node.parameters.length;
        if (paramsCount > 3) {
          issues.push({
            type: 'SMELL',
            file: fileName,
            line: startLine + 1,
            message: `Too many parameters (${paramsCount}). Consider using an options object.`,
            severity: 'low'
          });
        }

        // Deep Nesting Check for this function
        let maxDepth = 0;
        const checkNesting = (subNode: ts.Node, currentDepth: number) => {
          if (
            ts.isIfStatement(subNode) ||
            ts.isForStatement(subNode) ||
            ts.isWhileStatement(subNode) ||
            ts.isSwitchStatement(subNode) ||
            ts.isTryStatement(subNode)
          ) {
            currentDepth++;
            if (currentDepth > 2 && currentDepth > maxDepth) {
              issues.push({
                type: 'SMELL',
                file: fileName,
                line: sourceFile.getLineAndCharacterOfPosition(subNode.getStart()).line + 1,
                message: `Deeply nested code logic (depth ${currentDepth}). Extracted into helper variables or functions.`,
                severity: 'medium'
              });
              maxDepth = currentDepth; // Prevents spamming every line inside the deep block
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
}
