const hljs = require('highlight.js');

const languagePatterns = {
  javascript: [
    /\b(function|const|let|var|=>|console\.log|require|module\.exports)\b/,
    /\b(async|await|Promise|setTimeout)\b/,
    /\.(js|jsx|ts|tsx)$/i
  ],
  python: [
    /\b(def|import|from|print|if __name__|class|self)\b/,
    /\b(True|False|None|lambda|yield)\b/,
    /\.py$/i
  ],
  java: [
    /\b(public|private|protected|class|interface|extends|implements)\b/,
    /\b(System\.out\.println|String|int|void|static)\b/,
    /\.java$/i
  ],
  csharp: [
    /\b(using|namespace|class|public|private|static|void)\b/,
    /\b(Console\.WriteLine|string|int|bool|var)\b/,
    /\.cs$/i
  ],
  cpp: [
    /\b(#include|using namespace|cout|cin|endl|std::)\b/,
    /\b(int main|public:|private:|protected:)\b/,
    /\.(cpp|cc|cxx|h|hpp)$/i
  ],
  c: [
    /\b(#include|printf|scanf|malloc|free|main)\b/,
    /\b(int|char|float|double|void|struct)\b/,
    /\.(c|h)$/i
  ],
  php: [
    /\b(<\?php|\$[a-zA-Z_][a-zA-Z0-9_]*|echo|print|function)\b/,
    /\b(class|public|private|protected|extends)\b/,
    /\.php$/i
  ],
  ruby: [
    /\b(def|class|module|puts|print|require|include)\b/,
    /\b(end|if|else|elsif|unless|while|for)\b/,
    /\.rb$/i
  ],
  go: [
    /\b(package|import|func|var|const|type|interface)\b/,
    /\b(fmt\.Println|fmt\.Printf|make|chan|go)\b/,
    /\.go$/i
  ],
  rust: [
    /\b(fn|let|mut|struct|enum|impl|trait|use)\b/,
    /\b(println!|print!|vec!|match|if let)\b/,
    /\.rs$/i
  ],
  kotlin: [
    /\b(fun|val|var|class|object|interface|package)\b/,
    /\b(println|print|when|is|in|out)\b/,
    /\.kt$/i
  ],
  swift: [
    /\b(func|let|var|class|struct|enum|protocol|import)\b/,
    /\b(print|println|if|else|switch|case|for|while)\b/,
    /\.swift$/i
  ],
  typescript: [
    /\b(interface|type|enum|namespace|declare|export)\b/,
    /\b(function|const|let|var|=>|console\.log)\b/,
    /\.(ts|tsx)$/i
  ],
  html: [
    /<!DOCTYPE html|<html|<head|<body|<div|<span|<p>/i,
    /<\/[a-z]+>|<[a-z]+[^>]*>/i
  ],
  css: [
    /\{[^}]*\}/,
    /\.[a-zA-Z_-][a-zA-Z0-9_-]*\s*\{/,
    /#[a-zA-Z_-][a-zA-Z0-9_-]*\s*\{/
  ],
  json: [
    /^\s*\{.*\}\s*$/s,
    /^\s*\[.*\]\s*$/s,
    /\"[^\"]*\"\s*:\s*[^,}]+/
  ],
  xml: [
    /<\?xml|<[a-zA-Z][^>]*>.*<\/[a-zA-Z][^>]*>/s,
    /xmlns|<\/[a-zA-Z]+>/
  ],
  yaml: [
    /^[a-zA-Z_-]+:\s*[^#\n]+/m,
    /^---/m,
    /^\s*-\s+/m
  ],
  sql: [
    /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)\b/i,
    /\b(TABLE|DATABASE|INDEX|PRIMARY KEY|FOREIGN KEY)\b/i
  ],
  bash: [
    /^#!/,
    /\b(echo|cd|ls|grep|awk|sed|cat|chmod|sudo)\b/,
    /\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\}/
  ]
};

function detectLanguage(code, filename = '') {
  // First try filename extension
  if (filename) {
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => pattern.test(filename))) {
        return lang;
      }
    }
  }

  // Then try content patterns
  const scores = {};
  
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    scores[lang] = 0;
    patterns.forEach(pattern => {
      const matches = (code.match(pattern) || []).length;
      scores[lang] += matches;
    });
  }

  // Find the language with the highest score
  const sortedLanguages = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .filter(([,score]) => score > 0);

  if (sortedLanguages.length > 0) {
    return sortedLanguages[0][0];
  }

  // Fallback to highlight.js auto-detection
  try {
    const result = hljs.highlightAuto(code);
    return result.language || 'plaintext';
  } catch (error) {
    return 'plaintext';
  }
}

module.exports = { detectLanguage };