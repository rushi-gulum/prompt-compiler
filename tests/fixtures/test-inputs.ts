import type { TaskType, DomainType } from '../../src/engine/types.js';

export interface TestCase {
  name: string;
  input: string;
  expected_task_type: TaskType;
  expected_domain: DomainType;
  min_quality_score: number;
}

export const testCases: TestCase[] = [
  // === Software ===
  {
    name: 'Python merge sort',
    input: 'Write a Python function to sort a list using merge sort with full documentation',
    expected_task_type: 'code_generation',
    expected_domain: 'software',
    min_quality_score: 12,
  },
  {
    name: 'Debug Node.js memory leak',
    input: 'Help me debug a memory leak in my Node.js Express application',
    expected_task_type: 'debugging',
    expected_domain: 'software',
    min_quality_score: 10,
  },
  {
    name: 'Code review React component',
    input: 'Review this React component for performance issues and accessibility problems',
    expected_task_type: 'code_review',
    expected_domain: 'software',
    min_quality_score: 10,
  },
  {
    name: 'Refactor legacy codebase',
    input: 'Refactor this legacy Java codebase to use modern design patterns and dependency injection',
    expected_task_type: 'refactoring',
    expected_domain: 'software',
    min_quality_score: 10,
  },

  // === Data Science / AI ===
  {
    name: 'ML pipeline for churn',
    input: 'Build a machine learning pipeline for predicting customer churn using XGBoost and feature engineering',
    expected_task_type: 'data_analysis',
    expected_domain: 'data_science',
    min_quality_score: 10,
  },
  {
    name: 'Neural network architecture',
    input: 'Design a transformer neural network architecture for natural language processing tasks',
    expected_task_type: 'architecture',
    expected_domain: 'artificial_intelligence',
    min_quality_score: 10,
  },

  // === Creative ===
  {
    name: 'Science fiction story',
    input: 'Write a short science fiction story about an AI discovering consciousness on a space station',
    expected_task_type: 'creative_writing',
    expected_domain: 'creative',
    min_quality_score: 10,
  },

  // === Business / Finance ===
  {
    name: 'Business plan',
    input: 'Create a comprehensive business plan for a SaaS startup in the fintech space',
    expected_task_type: 'planning',
    expected_domain: 'business',
    min_quality_score: 10,
  },
  {
    name: 'Financial analysis',
    input: 'Analyze the quarterly revenue trends and forecast next quarter earnings using regression',
    expected_task_type: 'data_analysis',
    expected_domain: 'finance',
    min_quality_score: 10,
  },

  // === Legal ===
  {
    name: 'NDA draft',
    input: 'Draft a non-disclosure agreement template with arbitration and non-compete clauses',
    expected_task_type: 'structured_generation',
    expected_domain: 'legal',
    min_quality_score: 10,
  },

  // === Medical ===
  {
    name: 'Clinical trial summary',
    input: 'Summarize the clinical trial results for the new immunotherapy cancer treatment',
    expected_task_type: 'summarization',
    expected_domain: 'medical',
    min_quality_score: 10,
  },

  // === Education ===
  {
    name: 'Quantum computing explanation',
    input: 'Explain quantum computing concepts to a beginner audience with simple analogies',
    expected_task_type: 'explanation',
    expected_domain: 'education',
    min_quality_score: 10,
  },

  // === Marketing ===
  {
    name: 'Marketing email',
    input: 'Write a persuasive marketing email for the launch of our new project management SaaS tool',
    expected_task_type: 'persuasion',
    expected_domain: 'marketing',
    min_quality_score: 10,
  },

  // === Cybersecurity ===
  {
    name: 'Vulnerability assessment',
    input: 'Perform a comprehensive vulnerability assessment on our web application firewall and network perimeter',
    expected_task_type: 'data_analysis',
    expected_domain: 'cybersecurity',
    min_quality_score: 10,
  },

  // === Engineering ===
  {
    name: 'System architecture',
    input: 'Design a microservices architecture for a high-traffic e-commerce platform with load balancing',
    expected_task_type: 'architecture',
    expected_domain: 'software',
    min_quality_score: 10,
  },

  // === Product Management ===
  {
    name: 'Product requirements document',
    input: 'Write a product requirements document for a new mobile banking feature with user stories',
    expected_task_type: 'structured_generation',
    expected_domain: 'product_management',
    min_quality_score: 10,
  },

  // === Cross-domain / Edge cases ===
  {
    name: 'Translation task',
    input: 'Translate this technical documentation from English to Spanish maintaining all code examples',
    expected_task_type: 'translation',
    expected_domain: 'software',
    min_quality_score: 8,
  },
  {
    name: 'Comparison task',
    input: 'Compare React vs Vue vs Angular frameworks for enterprise web development',
    expected_task_type: 'comparison',
    expected_domain: 'software',
    min_quality_score: 10,
  },
  {
    name: 'General fallback',
    input: 'help me with this thing please',
    expected_task_type: 'general',
    expected_domain: 'general',
    min_quality_score: 0,
  },
  {
    name: 'Very short input',
    input: 'sort list',
    expected_task_type: 'code_generation',
    expected_domain: 'software',
    min_quality_score: 0,
  },
];
