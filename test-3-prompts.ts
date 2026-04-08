import { compile } from './src/engine/index.js';
import type { LLMConfig } from './src/engine/types.js';

async function runTest() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GROQ_API_KEY is not set. The deep path evaluator will fallback to rule-based.");
  }

  const llmConfig: LLMConfig = {
    enabled: true,
    apiKey: apiKey || 'fake-key',
    model: 'llama-3.3-70b-versatile',
    timeoutMs: 10000
  };

  const prompts = [
    { name: '1. Fast Path (Simple)', text: 'fix typo in this sentence' },
    { name: '2. Deep Path (Moderate)', text: 'write a python script to fetch data from an api format as json' },
    { name: '3. Deep Path (Complex)', text: 'Act as a senior database architect with 15 years of experience. Design a highly scalable distributed PostgreSQL schema for a multi-tenant SaaS application handling 100k requests per second. The schema must enforce strict isolation boundaries between tenants, use declarative partitioning strategy, output the DDL scripts exclusively in markdown, include an index strategy table, and never use triggers.' }
  ];

  for (const p of prompts) {
    console.log(`\n=================================================`);
    console.log(`Executing: ${p.name}`);
    console.log(`Input: "${p.text}"`);
    console.log(`=================================================`);
    
    const start = Date.now();
    const result = await compile(p.text, llmConfig);
    const duration = Date.now() - start;

    if (!result.success) {
      console.error(`Compilation Failed. Error: ${result.error.message}`);
      continue;
    }

    const compiled = result.data;
    console.log(`-> Processing Time: ${duration}ms`);
    console.log(`-> Computed Complexity: ${compiled.metadata.complexity}`);
    console.log(`-> Hybrid LLM Used: ${compiled.metadata.hybrid_mode}`);
    console.log(`-> Refinement Loop Triggered: ${compiled.metadata.enhanced}`);
    if (compiled.metadata.warnings.length > 0) {
      console.log(`-> Warnings/Logs: \n   - ${compiled.metadata.warnings.join('\n   - ')}`);
    }
    console.log(`\nFinal Assembled Prompt Length: ${compiled.assembled_prompt.length} chars`);
    console.log(`-------------------------------------------------`);
  }
}

runTest().catch(console.error);
