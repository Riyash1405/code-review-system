import { ComplexityAnalyzer } from './complexity.analyzer.js';
import { SmellAnalyzer } from './smell.analyzer.js';
import { DuplicationAnalyzer } from './duplication.analyzer.js';
import { StyleAnalyzer } from './style.analyzer.js';
import { SecurityAnalyzer } from './security.analyzer.js';
import { ScoringService, Issue } from './scoring.service.js';
import { LlmAnalyzer } from './llm.analyzer.js';

interface AnalysisOptions {
  useLlm: boolean;
  apiKey?: string;
  provider?: string; // 'gemini' | 'openai' | 'anthropic' | 'groq'
}

export class CodeAnalyzer {
  private complexityAnalyzer = new ComplexityAnalyzer();
  private smellAnalyzer = new SmellAnalyzer();
  private duplicationAnalyzer = new DuplicationAnalyzer();
  private styleAnalyzer = new StyleAnalyzer();
  private securityAnalyzer = new SecurityAnalyzer();
  private scoringService = new ScoringService();

  async analyze(files: { path: string; content: string }[], options: AnalysisOptions = { useLlm: false }) {
    // If LLM is enabled, try it first — but fall back to rule-based on failure
    if (options.useLlm && options.apiKey) {
      try {
        const llmAnalyzer = new LlmAnalyzer(options.apiKey, options.provider || 'gemini');
        console.log(`Routing analysis to ${options.provider || 'gemini'} AI Engine (with automatic fallback)...`);
        return await llmAnalyzer.analyze(files);
      } catch (llmError: any) {
        console.warn(`⚠️ LLM analysis failed: ${llmError.message}`);
        console.warn('⚡ Falling back to rule-based static analyzer...');
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

    const dupIssues = this.duplicationAnalyzer.analyzeFiles(files);
    allIssues.push(...dupIssues as Issue[]);

    const { score, summary } = this.scoringService.calculateScore(allIssues);

    return {
      score,
      summary: options.useLlm 
        ? `[Fallback] AI was unavailable, used static analysis instead. ${summary}` 
        : summary,
      issues: allIssues,
    };
  }
}
