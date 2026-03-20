# Gemini Workflow Skill Guide

**Version:** 1.0  
**Last Updated:** 2026-03-20

---

## Overview

The **Gemini Workflow Skill** is a specialized plugin for Echoctl that unlocks advanced Gemini capabilities:

- **Multimodal Analysis**: Process text, images, audio, and video together
- **Long-Context Processing**: Handle up to 1M tokens for large documents
- **Structured Data Extraction**: Extract data in JSON, CSV, XML, or Markdown formats
- **Vision-Based Analysis**: OCR, document layout analysis, and content extraction
- **Code Intelligence**: Review, optimize, document, and test code
- **Batch Processing**: Efficiently process multiple items concurrently
- **Conversational Workflows**: Multi-turn conversations with memory

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Core Features](#core-features)
4. [Usage Examples](#usage-examples)
5. [Advanced Workflows](#advanced-workflows)
6. [Best Practices](#best-practices)

---

## Installation

### Prerequisites

- Echoctl 1.0+
- Gemini API Key ([Get one here](https://ai.google.dev/))
- Node.js 18+

### Install the Skill

```bash
# From Echoctl registry
echoctl skill install gemini-workflow

# Or manually
cd ~/.echo/plugins
git clone https://github.com/Chieji/Echoctl.git
cp -r Echoctl/plugins/gemini-workflow-skill ./gemini-workflow
```

### Configure API Key

```bash
# Set environment variable
export GEMINI_API_KEY=your-api-key-here

# Or add to ~/.echo/config.json
{
  "gemini": {
    "apiKey": "your-api-key-here",
    "model": "gemini-2.0-flash",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

### Verify Installation

```bash
echoctl skill info gemini-workflow
echoctl list-tools | grep gemini-workflow
```

---

## Configuration

### Model Selection

```json
{
  "gemini": {
    "model": "gemini-2.0-flash",
    "maxTokens": 4096,
    "temperature": 0.7,
    "topP": 0.95,
    "topK": 40
  }
}
```

### Available Models

| Model | Context | Speed | Cost |
|---|---|---|---|
| `gemini-2.0-flash` | 1M tokens | Very Fast | Low |
| `gemini-1.5-pro` | 2M tokens | Fast | Medium |
| `gemini-1.5-flash` | 1M tokens | Very Fast | Low |

---

## Core Features

### 1. Multimodal Analysis

Analyze text, images, and audio together in a single request.

```bash
echoctl exec gemini-workflow:multimodalAnalysis \
  --text "Analyze this content" \
  --imagePath ./screenshot.png \
  --prompt "What's happening in this image?"
```

**Use Cases:**
- Screenshot analysis and documentation
- Image-based data extraction
- Audio transcription with context
- Video frame analysis

### 2. Structured Data Extraction

Extract data in your preferred format.

```bash
echoctl exec gemini-workflow:extractStructuredData \
  --content "Invoice details here..." \
  --format json \
  --extractionPrompt "Extract invoice number, date, and total amount"
```

**Supported Formats:**
- `json` - Structured JSON objects
- `csv` - Comma-separated values
- `xml` - XML markup
- `markdown` - Markdown tables

### 3. Long-Context Processing

Process documents up to 1M tokens (approximately 750,000 words).

```bash
echoctl exec gemini-workflow:processLongContext \
  --documents '["doc1.txt", "doc2.txt", "doc3.txt"]' \
  --query "Summarize the key findings across all documents"
```

**Use Cases:**
- Analyze entire codebases
- Process research papers
- Summarize long reports
- Cross-document analysis

### 4. Document Analysis

Vision-based document processing with multiple analysis types.

```bash
# OCR - Extract all text
echoctl exec gemini-workflow:analyzeDocument \
  --documentPath ./invoice.pdf \
  --analysisType ocr

# Layout Analysis
echoctl exec gemini-workflow:analyzeDocument \
  --documentPath ./report.pdf \
  --analysisType layout

# Data Extraction
echoctl exec gemini-workflow:analyzeDocument \
  --documentPath ./form.pdf \
  --analysisType extraction

# Summary
echoctl exec gemini-workflow:analyzeDocument \
  --documentPath ./document.pdf \
  --analysisType summary
```

### 5. Code Intelligence

Advanced code analysis and generation.

```bash
# Code Review
echoctl exec gemini-workflow:analyzeCode \
  --code "$(cat main.ts)" \
  --analysisType review

# Optimization Suggestions
echoctl exec gemini-workflow:analyzeCode \
  --code "$(cat function.ts)" \
  --analysisType optimize

# Generate Documentation
echoctl exec gemini-workflow:analyzeCode \
  --code "$(cat api.ts)" \
  --analysisType document

# Generate Tests
echoctl exec gemini-workflow:analyzeCode \
  --code "$(cat utils.ts)" \
  --analysisType test
```

### 6. Conversational Workflows

Multi-turn conversations with context memory.

```bash
echoctl exec gemini-workflow:conversationalWorkflow \
  --messages '[
    {"role": "user", "content": "What is machine learning?"},
    {"role": "assistant", "content": "Machine learning is..."},
    {"role": "user", "content": "How does it relate to AI?"}
  ]' \
  --systemPrompt "You are an AI education expert"
```

---

## Usage Examples

### Example 1: Document Processing Pipeline

Process a PDF, extract data, and generate a summary.

```bash
#!/bin/bash

# 1. Analyze document layout
layout=$(echoctl exec gemini-workflow:analyzeDocument \
  --documentPath invoice.pdf \
  --analysisType layout)

# 2. Extract structured data
data=$(echoctl exec gemini-workflow:extractStructuredData \
  --content "$layout" \
  --format json \
  --extractionPrompt "Extract invoice details")

# 3. Generate summary
summary=$(echoctl exec gemini-workflow:analyzeDocument \
  --documentPath invoice.pdf \
  --analysisType summary)

echo "Invoice Data: $data"
echo "Summary: $summary"
```

### Example 2: Code Review Workflow

Analyze code quality across multiple files.

```bash
#!/bin/bash

for file in src/**/*.ts; do
  echo "Reviewing $file..."
  
  review=$(echoctl exec gemini-workflow:analyzeCode \
    --code "$(cat $file)" \
    --analysisType review)
  
  echo "Review: $review"
  echo "---"
done
```

### Example 3: Multimodal Content Analysis

Analyze screenshots with context.

```bash
#!/bin/bash

# Capture screenshot
screenshot=$(gnome-screenshot -f screenshot.png)

# Analyze with context
analysis=$(echoctl exec gemini-workflow:multimodalAnalysis \
  --text "This is a user interface screenshot" \
  --imagePath screenshot.png \
  --prompt "Identify UI elements, layout issues, and accessibility concerns")

echo "$analysis"
```

### Example 4: Research Paper Analysis

Analyze long research documents.

```bash
#!/bin/bash

# Convert PDF to text
pdftotext research_paper.pdf paper.txt

# Process with long-context
analysis=$(echoctl exec gemini-workflow:processLongContext \
  --documents '["paper.txt"]' \
  --query "Summarize methodology, findings, and implications")

echo "$analysis"
```

---

## Advanced Workflows

### Workflow 1: Automated Code Documentation

```typescript
// Generate comprehensive documentation for entire codebase
const files = await readDirectory('src/');

for (const file of files) {
  const code = await readFile(file);
  
  const docs = await echoctl.exec('gemini-workflow:analyzeCode', {
    code,
    analysisType: 'document'
  });
  
  await writeFile(`docs/${file}.md`, docs);
}
```

### Workflow 2: Invoice Processing Pipeline

```typescript
// Process invoices with data extraction and validation
const invoices = await readDirectory('invoices/');

for (const invoice of invoices) {
  // 1. Extract data
  const data = await echoctl.exec('gemini-workflow:analyzeDocument', {
    documentPath: invoice,
    analysisType: 'extraction'
  });
  
  // 2. Validate with Slack notification
  await echoctl.exec('slack:sendMessage', {
    channel: '#finance',
    text: `Invoice processed: ${JSON.stringify(data)}`
  });
  
  // 3. Store in database
  await database.invoices.insert(data);
}
```

### Workflow 3: Research Synthesis

```typescript
// Analyze multiple research papers and synthesize findings
const papers = ['paper1.pdf', 'paper2.pdf', 'paper3.pdf'];

const analysis = await echoctl.exec('gemini-workflow:processLongContext', {
  documents: papers.map(p => readFileSync(p, 'utf-8')),
  query: `Synthesize findings across all papers. Identify:
    1. Common themes
    2. Contradictions
    3. Research gaps
    4. Future directions`
});

// Generate report
const report = await echoctl.exec('gemini-workflow:analyzeCode', {
  code: analysis,
  analysisType: 'document'
});
```

---

## Best Practices

### 1. Token Optimization

```typescript
// ✓ Good - Concise prompts
const prompt = "Extract invoice number and total";

// ✗ Avoid - Verbose prompts
const prompt = `Please carefully analyze this document and extract 
the invoice number and the total amount. Make sure to be very careful 
and accurate in your extraction...`;
```

### 2. Error Handling

```typescript
try {
  const result = await echoctl.exec('gemini-workflow:analyzeDocument', {
    documentPath: filePath,
    analysisType: 'extraction'
  });
  
  if (!result.success) {
    console.error('Analysis failed:', result.error);
    // Fallback logic
  }
} catch (error) {
  console.error('Execution error:', error);
}
```

### 3. Caching Results

```typescript
// Cache expensive analyses
const cache = new Map();

async function analyzeWithCache(filePath, analysisType) {
  const key = `${filePath}:${analysisType}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await echoctl.exec('gemini-workflow:analyzeDocument', {
    documentPath: filePath,
    analysisType
  });
  
  cache.set(key, result);
  return result;
}
```

### 4. Batch Processing

```typescript
// Process multiple items efficiently
const items = await readDirectory('documents/');

const results = await Promise.all(
  items.map(item =>
    echoctl.exec('gemini-workflow:analyzeDocument', {
      documentPath: item,
      analysisType: 'summary'
    })
  )
);
```

### 5. Structured Prompts

```typescript
// Use structured prompts for consistent output
const prompt = `Extract the following fields from the document:
1. Name (string)
2. Email (string)
3. Phone (string)
4. Address (string)

Return as JSON.`;
```

---

## Troubleshooting

### Issue: "API Key not found"

```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Set if missing
export GEMINI_API_KEY=your-key-here
```

### Issue: "Context window exceeded"

Use `processLongContext` instead of regular analysis for large documents.

### Issue: "Timeout on large files"

Increase timeout in config:

```json
{
  "gemini": {
    "timeout": 120000
  }
}
```

### Issue: "Poor extraction results"

Improve your extraction prompt:

```bash
# ✗ Vague
--extractionPrompt "Extract data"

# ✓ Specific
--extractionPrompt "Extract invoice number (format: INV-XXXX), 
date (YYYY-MM-DD), and total amount (USD). Return as JSON."
```

---

## Support

- **Documentation**: [Gemini API Docs](https://ai.google.dev/docs)
- **Issues**: [GitHub Issues](https://github.com/Chieji/Echoctl/issues)
- **Community**: [Discussions](https://github.com/Chieji/Echoctl/discussions)

---

**Happy Gemini workflows! 🔮**
