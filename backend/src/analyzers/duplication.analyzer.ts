import crypto from 'crypto';

export interface DuplicationIssue {
  type: 'DUPLICATION';
  file: string;
  line: number;
  message: string;
}

interface BlockMap {
  [hash: string]: { file: string; line: number; content: string }[];
}

export class DuplicationAnalyzer {
  private blockMap: BlockMap = {};

  analyzeFiles(files: { path: string; content: string }[]): DuplicationIssue[] {
    const issues: DuplicationIssue[] = [];
    const BLOCK_SIZE = 10; // Increased to 10 lines to only catch substantial logic, not boilerplate

    for (const file of files) {
      const lines = file.content.split('\n');
      
      let skipUntil = -1; // Prevent overlapping windows
      
      for (let i = 0; i < lines.length - BLOCK_SIZE; i++) {
        if (i < skipUntil) continue;
        
        const chunk = lines.slice(i, i + BLOCK_SIZE);
        
        // Filter out imports, exports, and empty lines to avoid boilerplate matches
        const meaningfulLines = chunk.filter(l => {
          const t = l.trim();
          return t.length > 0 && !t.startsWith('import ') && !t.startsWith('export ') && t !== '}' && t !== '{' && t !== '();' && t !== '</>';
        });
        
        // If the block is mostly boilerplate, skip
        if (meaningfulLines.length < 5) continue;

        const normalizedChunk = meaningfulLines.map(l => l.trim()).join('');
        if (normalizedChunk.length < 100) continue; // Require significant logic bulk

        const hash = crypto.createHash('md5').update(normalizedChunk).digest('hex');

        if (!this.blockMap[hash]) {
           this.blockMap[hash] = [{ file: file.path, line: i + 1, content: normalizedChunk }];
        } else {
           const original = this.blockMap[hash][0];
           // Ensure it's not matching its own neighboring lines (overlap)
           if (original.file === file.path && Math.abs(original.line - (i + 1)) <= BLOCK_SIZE) {
               continue;
           }
           
           issues.push({
             type: 'DUPLICATION',
             file: file.path,
             line: i + 1,
             message: `Substantial duplicated logic block found (originally in ${original.file.split('/').pop()} at line ${original.line}). Consider extracting to a shared component/function.`,
           });
           
           skipUntil = i + BLOCK_SIZE; // Skip the rest of this matched block so it doesn't spam every sequential line
        }
      }
    }

    return issues;
  }
}
