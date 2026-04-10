import { ComplexityAnalyzer } from './complexity.analyzer.js';
import { SmellAnalyzer } from './smell.analyzer.js';
import { DuplicationAnalyzer } from './duplication.analyzer.js';
import { StyleAnalyzer } from './style.analyzer.js';
import { SecurityAnalyzer } from './security.analyzer.js';
import { ScoringService, Issue } from './scoring.service.js';
import { LlmAnalyzer } from './llm.analyzer.js';

export class CodeAnalyzer {
  private complexityAnalyzer = new ComplexityAnalyzer();
  private smellAnalyzer = new SmellAnalyzer();
  private duplicationAnalyzer = new DuplicationAnalyzer();
  private styleAnalyzer = new StyleAnalyzer();
  private securityAnalyzer = new SecurityAnalyzer();
  private scoringService = new ScoringService();

  async analyze(files: { path: string; content: string }[], options: { useLlm: boolean; apiKey?: string } = { useLlm: false }) {
    // If LLM is enabled, try it first — but fall back to rule-based on failure
    if (options.useLlm && options.apiKey) {
      try {
        const llmAnalyzer = new LlmAnalyzer(options.apiKey);
        console.log('Routing analysis to GenAI Engine (with automatic fallback)...');
        return await llmAnalyzer.analyze(files);
      } catch (llmError: any) {
        console.warn(`⚠️ LLM analysis failed: ${llmError.message}`);
        console.warn('⚡ Falling back to rule-based static analyzer...');
        // Continue to rule-based analysis below
      }
    }

    // Rule-based static analysis (always works, no API dependency)
    const allIssues: Issue[] = [];

    for (const file of files) {
      if (!file.content) continue;
      
      const compIssues = this.complexityAnalyzer.analyze(file.path, file.content);
      const smellIssues = this.smellAnalyzer.analyze(file.path, file.content);
      const styleIssues = this.styleAnalyzer.analyze(file.path, file.content);
      const secIssues = this.securityAnalyzer.analyze(file.path, file.content);

      allIssues.push(...compIssues, ...smellIssues, ...styleIssues, ...secIssues);
    }

    // Run inter-file analysis for duplication
    const dupIssues = this.duplicationAnalyzer.analyzeFiles(files);
    allIssues.push(...dupIssues as Issue[]);

    // Calculate Final Score
    const { score, summary } = this.scoringService.calculateScore(allIssues);

    return {
      score,
      summary: options.useLlm 
        ? `[Fallback] AI was rate-limited, used static analysis instead. ${summary}` 
        : summary,
      issues: allIssues,
    };
  }
}
