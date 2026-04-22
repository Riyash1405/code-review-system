/**
 * Centralized language detection and pattern registry.
 * Used by all analyzers to apply language-specific rules.
 */

export type Language = 'javascript' | 'python' | 'java' | 'cpp' | 'go' | 'ruby' | 'unknown';

/**
 * Detect the programming language of a file based on its extension
 */
export function detectLanguage(filePath: string): Language {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, Language> = {
    'js': 'javascript', 'jsx': 'javascript', 'ts': 'javascript', 'tsx': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript',
    'vue': 'javascript', 'svelte': 'javascript',
    'py': 'python', 'pyw': 'python',
    'java': 'java', 'kt': 'java', 'scala': 'java', 'gradle': 'java',  // JVM family
    'cpp': 'cpp', 'cc': 'cpp', 'cxx': 'cpp', 'c': 'cpp', 'h': 'cpp', 'hpp': 'cpp', 'cs': 'cpp',
    'go': 'go',
    'rb': 'ruby', 'rake': 'ruby',
    // These map to 'unknown' but are still valid code files that the LLM can analyze
    'sql': 'unknown', 'html': 'unknown', 'htm': 'unknown', 'css': 'unknown',
    'scss': 'unknown', 'sass': 'unknown', 'less': 'unknown',
    'xml': 'unknown', 'yaml': 'unknown', 'yml': 'unknown', 'json': 'unknown',
    'sh': 'unknown', 'bash': 'unknown', 'ps1': 'unknown', 'bat': 'unknown',
    'php': 'unknown', 'rs': 'unknown', 'swift': 'unknown', 'dart': 'unknown',
  };
  return map[ext] || 'unknown';
}

/**
 * Check if the language supports TypeScript AST parsing
 */
export function supportsAst(lang: Language): boolean {
  return lang === 'javascript';
}

// ─── Security Patterns ──────────────────────────────────────────────

export interface SecurityPattern {
  regex: RegExp;
  severity: 'high' | 'critical';
  message: string;
}

export const SECURITY_PATTERNS: Record<Language, SecurityPattern[]> = {
  javascript: [
    { regex: /(password|secret|token|api_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
    { regex: /eval\s*\(/i, severity: 'critical', message: 'Usage of eval() is a major security risk.' },
    { regex: /dangerouslySetInnerHTML/i, severity: 'high', message: 'Usage of dangerouslySetInnerHTML can lead to XSS vulnerabilities.' },
    { regex: /child_process/i, severity: 'high', message: 'Direct usage of child_process can be a security risk. Validate inputs.' },
  ],
  python: [
    { regex: /(password|secret|token|api_key)\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
    { regex: /\beval\s*\(/i, severity: 'critical', message: 'Usage of eval() is a major security risk in Python.' },
    { regex: /\bexec\s*\(/i, severity: 'critical', message: 'Usage of exec() allows arbitrary code execution.' },
    { regex: /subprocess\.call\(.*shell\s*=\s*True/i, severity: 'critical', message: 'subprocess.call with shell=True is vulnerable to shell injection.' },
    { regex: /pickle\.loads?\s*\(/i, severity: 'high', message: 'pickle.load/loads is unsafe with untrusted data (arbitrary code execution).' },
    { regex: /os\.system\s*\(/i, severity: 'high', message: 'os.system() is vulnerable to shell injection. Use subprocess with shell=False.' },
    { regex: /input\s*\(/i, severity: 'high', message: 'Python 2 input() executes user input. Use raw_input() or ensure Python 3.' },
  ],
  java: [
    { regex: /(password|secret|token|apiKey)\s*=\s*"[a-zA-Z0-9_\-]{8,}"/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
    { regex: /Runtime\.getRuntime\(\)\.exec/i, severity: 'critical', message: 'Runtime.exec() can be vulnerable to command injection.' },
    { regex: /new\s+ObjectInputStream/i, severity: 'high', message: 'ObjectInputStream deserialization can lead to remote code execution.' },
    { regex: /Statement\s*.*execute(Query|Update)?\s*\(.*\+/i, severity: 'critical', message: 'SQL query built with string concatenation — vulnerable to SQL injection. Use PreparedStatement.' },
    { regex: /\.getParameter\s*\(/i, severity: 'high', message: 'Unsanitized request parameter usage. Validate and sanitize input.' },
  ],
  cpp: [
    { regex: /(password|secret|token|api_key)\s*=\s*"[a-zA-Z0-9_\-]{8,}"/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
    { regex: /\bsystem\s*\(/i, severity: 'critical', message: 'system() is vulnerable to command injection. Use exec() family instead.' },
    { regex: /\bgets\s*\(/i, severity: 'critical', message: 'gets() has no bounds checking — guaranteed buffer overflow. Use fgets().' },
    { regex: /\bstrcpy\s*\(/i, severity: 'high', message: 'strcpy() has no bounds checking. Use strncpy() or strlcpy().' },
    { regex: /\bstrcat\s*\(/i, severity: 'high', message: 'strcat() has no bounds checking. Use strncat() or strlcat().' },
    { regex: /\bsprintf\s*\(/i, severity: 'high', message: 'sprintf() can overflow. Use snprintf() instead.' },
    { regex: /\bscanf\s*\(\s*"%s"/i, severity: 'high', message: 'scanf with %s has no bounds checking. Specify field width.' },
  ],
  go: [
    { regex: /(password|secret|token|apiKey)\s*[:=]\s*"[a-zA-Z0-9_\-]{8,}"/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
    { regex: /exec\.Command\s*\(/i, severity: 'high', message: 'exec.Command can be vulnerable to command injection. Validate inputs.' },
    { regex: /fmt\.Sprintf\s*\(.*%s.*\+/i, severity: 'high', message: 'String formatting with user input may enable injection attacks.' },
  ],
  ruby: [
    { regex: /(password|secret|token|api_key)\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
    { regex: /\beval\s*\(/i, severity: 'critical', message: 'eval() executes arbitrary Ruby code. Major security risk.' },
    { regex: /\bsystem\s*\(/i, severity: 'high', message: 'system() is vulnerable to command injection. Use IO.popen or Open3.' },
    { regex: /`.*#{.*}`/i, severity: 'high', message: 'Backtick command with interpolation can be exploited for shell injection.' },
  ],
  unknown: [
    { regex: /(password|secret|token|api_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/i, severity: 'high', message: 'Possible hardcoded secret or token detected.' },
  ],
};

// ─── Smell Patterns (regex-based for non-JS languages) ──────────────

export interface SmellPattern {
  regex: RegExp;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export const SMELL_PATTERNS: Record<Language, SmellPattern[]> = {
  javascript: [], // Handled by AST-based analyzer
  python: [
    { regex: /except\s*:\s*$/m, severity: 'high', message: 'Bare except clause catches all exceptions silently. Specify the exception type.' },
    { regex: /except\s*.*:\s*pass\s*$/m, severity: 'high', message: '"except: pass" swallows errors silently. Handle or log the exception.' },
    { regex: /\bglobal\s+\w+/i, severity: 'medium', message: 'Usage of "global" keyword reduces code clarity. Pass values as parameters instead.' },
    { regex: /print\s*\(/i, severity: 'low', message: 'print() statement found. Use proper logging (logging module) in production code.' },
    { regex: /import\s+\*/i, severity: 'medium', message: 'Wildcard import (import *) pollutes namespace. Import specific names.' },
  ],
  java: [
    { regex: /catch\s*\(.*\)\s*\{[\s\n]*\}/m, severity: 'high', message: 'Empty catch block swallows exceptions silently. Handle or log the exception.' },
    { regex: /System\.exit\s*\(/i, severity: 'medium', message: 'System.exit() terminates the JVM abruptly. Throw an exception instead.' },
    { regex: /System\.out\.print/i, severity: 'low', message: 'System.out.println found. Use a logging framework (SLF4J, Log4j) instead.' },
    { regex: /instanceof\s+\w+.*instanceof\s+\w+/i, severity: 'medium', message: 'Multiple instanceof checks suggest a missing polymorphism pattern.' },
    { regex: /\bnew\s+Thread\s*\(/i, severity: 'medium', message: 'Direct Thread creation. Consider using ExecutorService for better thread management.' },
  ],
  cpp: [
    { regex: /\bnew\s+\w+[^(]*;/i, severity: 'medium', message: 'Raw new without smart pointer. Use std::unique_ptr or std::shared_ptr.' },
    { regex: /\bdelete\s+/i, severity: 'medium', message: 'Manual delete detected. Prefer RAII and smart pointers.' },
    { regex: /\busing\s+namespace\s+std\s*;/i, severity: 'low', message: '"using namespace std" pollutes the global namespace. Use specific std:: prefixes.' },
    { regex: /\bprintf\s*\(/i, severity: 'low', message: 'printf found. Consider std::cout or fmt::format for type safety.' },
    { regex: /\bgoto\s+/i, severity: 'high', message: 'goto statement detected. Restructure control flow with loops or functions.' },
  ],
  go: [
    { regex: /\bpanic\s*\(/i, severity: 'medium', message: 'panic() should only be used for unrecoverable errors. Return errors instead.' },
    { regex: /fmt\.Print/i, severity: 'low', message: 'fmt.Print found. Use a structured logger (zap, zerolog) in production.' },
    { regex: /\b_\s*=\s*\w+/i, severity: 'low', message: 'Ignored error value. Handle errors explicitly.' },
  ],
  ruby: [
    { regex: /rescue\s*=>\s*e\s*$/m, severity: 'medium', message: 'Generic rescue block. Rescue specific exception types.' },
    { regex: /\bputs\s+/i, severity: 'low', message: 'puts found. Use a logger (Logger class) in production code.' },
  ],
  unknown: [],
};

// ─── Style Patterns (regex-based for non-JS languages) ──────────────

export interface StylePattern {
  regex: RegExp;
  message: string;
}

export const STYLE_PATTERNS: Record<Language, StylePattern[]> = {
  javascript: [], // Handled by AST-based analyzer
  python: [
    { regex: /^.{80,}$/m, message: 'Line exceeds 79 characters (PEP 8). Consider breaking the line.' },
    { regex: /\bclass\s+[a-z]/m, message: 'Class names should use PascalCase (PEP 8).' },
    { regex: /\bdef\s+[A-Z]/m, message: 'Function names should use snake_case (PEP 8).' },
    { regex: /\t/m, message: 'Tab character found. PEP 8 recommends 4 spaces for indentation.' },
  ],
  java: [
    { regex: /\bclass\s+[a-z]/m, message: 'Class names should use PascalCase in Java.' },
    { regex: /\b(public|private|protected)\s+\w+\s+[A-Z][A-Z_]+\s*[=(]/m, message: 'Method names should use camelCase in Java.' },
    { regex: /^.{121,}$/m, message: 'Line exceeds 120 characters. Consider breaking the line.' },
  ],
  cpp: [
    { regex: /^.{121,}$/m, message: 'Line exceeds 120 characters. Consider breaking the line.' },
    { regex: /#ifndef\s+\w+_H\b/i, message: 'Consider using #pragma once instead of traditional include guards.' },
  ],
  go: [
    { regex: /^.{121,}$/m, message: 'Line exceeds 120 characters. Consider breaking the line.' },
  ],
  ruby: [
    { regex: /^.{81,}$/m, message: 'Line exceeds 80 characters. Consider breaking the line.' },
    { regex: /\bclass\s+[a-z]/m, message: 'Class names should use PascalCase in Ruby.' },
  ],
  unknown: [],
};

// ─── Complexity thresholds per language ──────────────────────────────

export interface ComplexityThresholds {
  maxFunctionLines: number;
  maxNestingDepth: number;
  maxParams: number;
}

export const COMPLEXITY_THRESHOLDS: Record<Language, ComplexityThresholds> = {
  javascript: { maxFunctionLines: 25, maxNestingDepth: 3, maxParams: 3 },
  python:     { maxFunctionLines: 50, maxNestingDepth: 3, maxParams: 5 },
  java:       { maxFunctionLines: 40, maxNestingDepth: 3, maxParams: 4 },
  cpp:        { maxFunctionLines: 60, maxNestingDepth: 4, maxParams: 5 },
  go:         { maxFunctionLines: 50, maxNestingDepth: 3, maxParams: 4 },
  ruby:       { maxFunctionLines: 30, maxNestingDepth: 3, maxParams: 3 },
  unknown:    { maxFunctionLines: 40, maxNestingDepth: 3, maxParams: 4 },
};
