// ─── Enumerations ───────────────────────────────────────────────────────────

/** 87 task types — comprehensive coverage */
export type TaskType =
  // ── Code & Development ──
  | 'code_generation'
  | 'code_review'
  | 'debugging'
  | 'code_explanation'
  | 'code_translation'
  | 'code_documentation'
  | 'architecture_design'
  | 'unit_test_generation'
  | 'test_case_generation'
  | 'test_case_review'
  | 'api_generation'
  | 'api_documentation'
  // ── SQL & Database ──
  | 'sql_generation'
  | 'sql_analysis'
  | 'query_optimization'
  | 'database_design'
  // ── Writing & Content ──
  | 'creative_writing'
  | 'content_writing'
  | 'paraphrasing'
  | 'summarization'
  | 'translation'
  | 'persuasion'
  | 'text_editing'
  | 'style_transfer'
  // ── Document ──
  | 'document_generation'
  | 'document_analysis'
  // ── Conversation & Interaction ──
  | 'conversation'
  | 'instruction_following'
  | 'negotiation_support'
  // ── Data & Analysis ──
  | 'data_analysis'
  | 'classification'
  | 'extraction'
  | 'structured_generation'
  | 'dataset_generation'
  | 'dataset_cleaning'
  | 'data_transformation'
  | 'data_validation'
  // ── NLP & Text Analysis ──
  | 'sentiment_analysis'
  | 'topic_extraction'
  | 'keyword_extraction'
  | 'entity_linking'
  // ── Retrieval & QA ──
  | 'qa_rag'
  | 'information_retrieval'
  | 'fact_checking'
  // ── Evaluation & Review ──
  | 'evaluation'
  | 'critique'
  | 'feedback_analysis'
  // ── Planning & Strategy ──
  | 'planning'
  | 'reasoning'
  | 'decision_support'
  | 'prioritization'
  | 'forecasting'
  | 'risk_analysis'
  | 'simulation'
  // ── Compliance & Legal/Finance Analysis ──
  | 'compliance_analysis'
  | 'legal_analysis'
  | 'financial_analysis'
  | 'contract_review'
  // ── Requirements & Specs ──
  | 'requirement_analysis'
  | 'specification_generation'
  // ── Education & Research ──
  | 'education'
  | 'research'
  | 'question_generation'
  | 'quiz_generation'
  | 'experiment_design'
  | 'hypothesis_generation'
  | 'survey_generation'
  // ── Creative & Ideation ──
  | 'brainstorming'
  | 'ideation'
  // ── Media Generation ──
  | 'image_generation'
  | 'video_generation'
  | 'audio_generation'
  | 'image_analysis'
  | 'video_analysis'
  | 'audio_analysis'
  // ── Prompt & Automation ──
  | 'prompt_generation'
  | 'prompt_optimization'
  | 'tool_usage'
  | 'automation'
  | 'task_execution'
  // ── Structured Output ──
  | 'table_generation'
  | 'form_generation'
  | 'schema_generation'
  // ── Design & Workflow ──
  | 'workflow_design'
  | 'pipeline_design'
  // ── Recommendations ──
  | 'recommendation_generation'
  | 'general';

/** Runtime array of all task types for iteration */
export const ALL_TASK_TYPES: readonly TaskType[] = [
  // Code & Development
  'code_generation', 'code_review', 'debugging', 'code_explanation',
  'code_translation', 'code_documentation', 'architecture_design',
  'unit_test_generation', 'test_case_generation', 'test_case_review',
  'api_generation', 'api_documentation',
  // SQL & Database
  'sql_generation', 'sql_analysis', 'query_optimization', 'database_design',
  // Writing & Content
  'creative_writing', 'content_writing', 'paraphrasing', 'summarization',
  'translation', 'persuasion', 'text_editing', 'style_transfer',
  // Document
  'document_generation', 'document_analysis',
  // Conversation & Interaction
  'conversation', 'instruction_following', 'negotiation_support',
  // Data & Analysis
  'data_analysis', 'classification', 'extraction', 'structured_generation',
  'dataset_generation', 'dataset_cleaning', 'data_transformation', 'data_validation',
  // NLP & Text Analysis
  'sentiment_analysis', 'topic_extraction', 'keyword_extraction', 'entity_linking',
  // Retrieval & QA
  'qa_rag', 'information_retrieval', 'fact_checking',
  // Evaluation & Review
  'evaluation', 'critique', 'feedback_analysis',
  // Planning & Strategy
  'planning', 'reasoning', 'decision_support', 'prioritization',
  'forecasting', 'risk_analysis', 'simulation',
  // Compliance & Legal/Finance Analysis
  'compliance_analysis', 'legal_analysis', 'financial_analysis', 'contract_review',
  // Requirements & Specs
  'requirement_analysis', 'specification_generation',
  // Education & Research
  'education', 'research', 'question_generation', 'quiz_generation',
  'experiment_design', 'hypothesis_generation', 'survey_generation',
  // Creative & Ideation
  'brainstorming', 'ideation',
  // Media Generation
  'image_generation', 'video_generation', 'audio_generation',
  'image_analysis', 'video_analysis', 'audio_analysis',
  // Prompt & Automation
  'prompt_generation', 'prompt_optimization',
  'tool_usage', 'automation', 'task_execution',
  // Structured Output
  'table_generation', 'form_generation', 'schema_generation',
  // Design & Workflow
  'workflow_design', 'pipeline_design',
  // Recommendations
  'recommendation_generation', 'general',
] as const;

/** 16 domain types (from requirements.md authoritative source) */
export type DomainType =
  | 'software'
  | 'data_science'
  | 'artificial_intelligence'
  | 'cybersecurity'
  | 'creative'
  | 'business'
  | 'finance'
  | 'legal'
  | 'medical'
  | 'education'
  | 'marketing'
  | 'science'
  | 'engineering'
  | 'product_management'
  | 'operations'
  | 'media_production'
  | 'general';

/** Runtime array of all domain types for iteration */
export const ALL_DOMAIN_TYPES: readonly DomainType[] = [
  'software', 'data_science', 'artificial_intelligence', 'cybersecurity',
  'creative', 'business', 'finance', 'legal', 'medical', 'education',
  'marketing', 'science', 'engineering', 'product_management', 'operations',
  'media_production', 'general',
] as const;

export type OutputFormat =
  | 'prose' | 'json' | 'markdown' | 'code' | 'table' | 'xml' | 'list' | 'mixed';

export type AudienceLevel = 'child' | 'general' | 'student' | 'professional' | 'expert';

export type PromptSection =
  | 'role' | 'mission' | 'behavioral_rules' | 'context'
  | 'reasoning' | 'instructions' | 'output_format' | 'quality_standard';

export const ALL_PROMPT_SECTIONS: readonly PromptSection[] = [
  'role', 'mission', 'behavioral_rules', 'context',
  'reasoning', 'instructions', 'output_format', 'quality_standard',
] as const;

export type QualityCriterion =
  | 'role_persona' | 'task_specificity' | 'context' | 'reasoning_guidance'
  | 'instructions' | 'output_format' | 'constraints' | 'examples'
  | 'audience' | 'anti_hallucination' | 'security' | 'structural_clarity';

export const ALL_QUALITY_CRITERIA: readonly QualityCriterion[] = [
  'role_persona', 'task_specificity', 'context', 'reasoning_guidance',
  'instructions', 'output_format', 'constraints', 'examples',
  'audience', 'anti_hallucination', 'security', 'structural_clarity',
] as const;

export type Complexity = 'simple' | 'moderate' | 'complex';
export type DepthLevel = 'none' | 'standard' | 'deep';
export type ThinkingBudget = 'minimal' | 'light' | 'standard' | 'deep' | 'maximum';
export type QualityLabel = 'poor' | 'acceptable' | 'good' | 'excellent';

// ─── Stage Result Interfaces ─────────────────────────────────────────────────

export interface IntentResult {
  intent: string;
  task_type: TaskType;
  complexity: Complexity;
  key_entities: string[];
  secondary_types: TaskType[];
  confidence: number;
}

export interface DomainResult {
  primary_domain: DomainType;
  sub_domains: DomainType[];
  confidence: number;
  ambiguous: boolean;
}

export interface PersonaResult {
  role_title: string;
  role_definition: string;
  expertise_areas: string[];
  methodology: string;
  communication_style: string;
  experience_years: number;
}

export interface ReasoningResult {
  reasoning_approach: string;
  depth_level: DepthLevel;
  verification_needed: boolean;
  thinking_budget: ThinkingBudget;
}

export interface StructureResult {
  instructions: string[];
  positive_constraints: string[];
  negative_constraints: string[];
  examples_needed: boolean;
  output_format: OutputFormat;
  audience_level: AudienceLevel;
}

// ─── LLM Types ───────────────────────────────────────────────────────────────

export interface LLMConfig {
  apiKey: string;
  model?: string;          // default: 'llama-3.3-70b-versatile'
  timeoutMs?: number;      // default: 4000
  enabled: boolean;
}

export interface LLMIntentResult {
  task_type: TaskType;
  domain: DomainType;
  complexity: Complexity;
  key_entities: string[];
  refined_intent: string;
  suggested_persona_focus: string;
  confidence: number;
}

// ─── Pipeline Context ────────────────────────────────────────────────────────

export interface PipelineContext {
  raw_input: string;
  intent?: IntentResult;
  domain?: DomainResult;
  persona?: PersonaResult;
  reasoning?: ReasoningResult;
  structure?: StructureResult;
  result?: CompiledPrompt;
  llm_intent?: LLMIntentResult;
}

// ─── Final Output ─────────────────────────────────────────────────────────────

export interface CompiledPrompt {
  prompt: string;
  assembled_prompt: string;
  sections: Record<PromptSection, string>;
  quality_score: number;
  quality_label: QualityLabel;
  quality_breakdown: Record<QualityCriterion, number>;
  metadata: {
    task_type: TaskType;
    domain: DomainType;
    complexity: Complexity;
    processing_time_ms: number;
    warnings: string[];
    enhanced: boolean;
    hybrid_mode: boolean;
    llm_confidence?: number;
  };
}

// ─── Error & Result Types ────────────────────────────────────────────────────

export type ErrorCode =
  | 'INPUT_EMPTY' | 'INPUT_TOO_LONG' | 'STAGE_TIMEOUT'
  | 'PERSONA_NOT_FOUND' | 'SYNTHESIS_FAILED' | 'QUALITY_BELOW_THRESHOLD'
  | 'UNKNOWN_ERROR';

export interface CompilationError {
  stage: number;
  code: ErrorCode;
  message: string;
  recoverable: boolean;
}

export type CompilationResult =
  | { success: true; data: CompiledPrompt }
  | { success: false; error: CompilationError };
