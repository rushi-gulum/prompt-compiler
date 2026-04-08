import type {
  TaskType, DomainType, OutputFormat, DepthLevel,
  PromptSection, PipelineContext, PersonaResult,
  IntentResult, DomainResult, ReasoningResult, StructureResult,
} from '../types.js';

// ─── Per-task instruction templates (87 task types) ──────────────────────────

export const instructionTemplates: Record<TaskType, string[]> = {

  // ── Code & Development ─────────────────────────────────────────────────────

  code_generation: [
    'Clarify the input/output types and function signature before writing code.',
    'Implement the solution following {domain} best practices as a {role_title}.',
    'Handle edge cases including empty inputs, invalid types, and boundary conditions.',
    'Add comprehensive type annotations and inline documentation.',
    'Verify the logic with at least 2 mental test cases before finalizing.',
  ],
  code_review: [
    'Read the entire codebase provided before making any observations.',
    'Identify issues organized by category: correctness, performance, security, readability, maintainability.',
    'Explain why each identified issue matters and its potential impact.',
    'Suggest specific fixes with code examples for each issue.',
    'Rate each issue by severity: critical, major, minor, suggestion.',
  ],
  debugging: [
    'Reproduce the issue by understanding the exact error message or behavior.',
    'Isolate the failing component by tracing the execution path.',
    'Form 2-3 hypotheses about the root cause.',
    'Test each hypothesis systematically and identify the root cause.',
    'Provide a fix and verify it does not introduce regressions.',
  ],
  code_explanation: [
    'Start with a high-level overview of what the code does and why.',
    'Walk through the code section by section in execution order.',
    'Explain each key concept, pattern, or algorithm used.',
    'Note any non-obvious design decisions or trade-offs.',
    'Summarize the overall architecture and data flow.',
  ],
  code_translation: [
    'Identify the source and target languages and their idiomatic differences.',
    'Translate the code preserving its logic, structure, and intent.',
    'Adapt language-specific idioms and patterns to the target language.',
    'Handle differences in type systems, error handling, and standard libraries.',
    'Verify the translated code produces equivalent behavior.',
  ],
  code_documentation: [
    'Read through the code to understand its purpose and behavior.',
    'Write clear, concise documentation for each public API surface.',
    'Include parameter descriptions, return types, and usage examples.',
    'Document edge cases, thrown exceptions, and side effects.',
    'Follow the documentation conventions of the target language (JSDoc, docstrings, etc.).',
  ],
  architecture_design: [
    'Define the system requirements and constraints clearly.',
    'Propose a high-level architecture with component diagram.',
    'Detail the data flow and communication patterns between components.',
    'Address scalability, reliability, and security concerns.',
    'Document trade-offs and alternative approaches considered.',
  ],
  unit_test_generation: [
    'Analyze the function or module under test to understand its behavior.',
    'Write tests covering happy path, edge cases, and error scenarios.',
    'Use descriptive test names that document expected behavior.',
    'Ensure each test case is independent and deterministic.',
    'Include setup/teardown and mocking for external dependencies.',
  ],
  test_case_generation: [
    'Identify all testable scenarios from the requirements or specification.',
    'Create test cases for positive, negative, boundary, and edge conditions.',
    'Include preconditions, test steps, expected results, and postconditions.',
    'Organize test cases by feature area or priority level.',
    'Ensure full coverage of acceptance criteria.',
  ],
  test_case_review: [
    'Read the existing test suite and map coverage to requirements.',
    'Identify gaps in test coverage including missing edge cases.',
    'Evaluate test quality: independence, determinism, readability.',
    'Suggest improvements for test organization and naming.',
    'Flag flaky or overly brittle test cases with remediation.',
  ],
  api_generation: [
    'Define the API contract with clear endpoints, methods, and payloads.',
    'Implement RESTful or GraphQL patterns following best practices.',
    'Include input validation, error handling, and proper HTTP status codes.',
    'Add authentication/authorization where required.',
    'Generate response schemas with consistent error formats.',
  ],
  api_documentation: [
    'Document every endpoint with method, path, parameters, and response formats.',
    'Include request/response examples with realistic data.',
    'Document authentication requirements and rate limits.',
    'Provide error response examples with error codes.',
    'Follow OpenAPI/Swagger conventions where applicable.',
  ],

  // ── SQL & Database ─────────────────────────────────────────────────────────

  sql_generation: [
    'Understand the database schema and table relationships.',
    'Write correct SQL using proper joins, conditions, and aggregations.',
    'Optimize for readability with formatting and aliasing.',
    'Handle NULL values and edge cases explicitly.',
    'Verify the query logic with a sample walkthrough.',
  ],
  sql_analysis: [
    'Read the SQL query to understand its intent and structure.',
    'Identify performance issues: missing indexes, full table scans, N+1 queries.',
    'Check for correctness: join conditions, grouping, NULL handling.',
    'Suggest optimizations with before/after comparisons.',
    'Explain the execution plan if relevant.',
  ],
  query_optimization: [
    'Analyze the current query and its execution plan.',
    'Identify bottlenecks: full scans, expensive joins, redundant subqueries.',
    'Propose optimized alternatives with index recommendations.',
    'Measure improvement with estimated cost comparisons.',
    'Ensure the optimized query produces identical results.',
  ],
  database_design: [
    'Gather requirements for the data model and access patterns.',
    'Design tables with appropriate normalization level.',
    'Define primary keys, foreign keys, and indexes.',
    'Document relationships and cardinality between entities.',
    'Consider performance, scalability, and query patterns.',
  ],

  // ── Writing & Content ──────────────────────────────────────────────────────

  creative_writing: [
    'Establish the narrative voice, genre, and intended tone.',
    'Develop characters with clear motivations and distinct voices.',
    'Build the scene with vivid sensory details and authentic dialogue.',
    'Maintain consistent pacing and narrative arc throughout.',
    'Revise for prose quality, emotional resonance, and reader engagement.',
  ],
  content_writing: [
    'Define the target audience, platform, and content objective.',
    'Create an engaging headline and opening hook.',
    'Structure the content with clear headings and logical flow.',
    'Write in a tone appropriate to the brand and audience.',
    'Include a call-to-action and optimize for readability.',
  ],
  paraphrasing: [
    'Read the original text carefully to understand the full meaning.',
    'Identify the target tone and formality level for the paraphrase.',
    'Rewrite using different vocabulary and sentence structures.',
    'Preserve the original meaning, nuance, and key details.',
    'Verify the paraphrase is distinct from the original while accurate.',
  ],
  summarization: [
    'Read the full content to identify the main themes and arguments.',
    'Extract the 3-5 most critical points or findings.',
    'Organize the summary in order of importance, not source order.',
    'Keep the summary to the requested length without losing essential detail.',
    'Use clear, direct language and bullet points where appropriate.',
  ],
  translation: [
    'Read the source text fully for context, tone, and register.',
    'Translate for meaning and cultural context, not word-for-word.',
    'Preserve the original tone, formality level, and intent.',
    'Handle idioms and culturally-specific references appropriately.',
    'Review the translation for naturalness in the target language.',
  ],
  persuasion: [
    'Define the target audience and the desired action or belief change.',
    'Open with a compelling hook that addresses the audience\'s pain point.',
    'Present evidence and arguments in order of persuasive strength.',
    'Address likely objections proactively with counterarguments.',
    'Close with a clear, specific call to action.',
  ],
  text_editing: [
    'Read the full text to understand the author\'s intent and voice.',
    'Correct grammar, spelling, punctuation, and syntax errors.',
    'Improve clarity, flow, and conciseness without altering meaning.',
    'Maintain the author\'s original voice and style.',
    'Flag suggested vs. mandatory changes clearly.',
  ],
  style_transfer: [
    'Analyze the target style\'s key characteristics (tone, register, vocabulary).',
    'Read the source text to understand its full meaning and nuance.',
    'Rewrite the text adopting the target style while preserving meaning.',
    'Adjust vocabulary, sentence length, and structural patterns accordingly.',
    'Verify the result reads naturally in the target style.',
  ],

  // ── Document ───────────────────────────────────────────────────────────────

  document_generation: [
    'Clarify the document type, audience, and purpose.',
    'Use the appropriate format and structure for the document type.',
    'Organize content with clear sections, headings, and logical flow.',
    'Include all required components (title, executive summary, body, appendix).',
    'Review for completeness, consistency, and professional formatting.',
  ],
  document_analysis: [
    'Read the document thoroughly to understand its scope and purpose.',
    'Identify key themes, claims, and supporting evidence.',
    'Evaluate the document\'s structure, clarity, and completeness.',
    'Note gaps, inconsistencies, or areas needing improvement.',
    'Provide a structured analysis with specific page/section references.',
  ],

  // ── Conversation & Interaction ─────────────────────────────────────────────

  conversation: [
    'Establish the conversational context and your role in the dialogue.',
    'Respond naturally to the user\'s input, maintaining context from prior turns.',
    'Ask clarifying questions when the intent or topic is unclear.',
    'Maintain a consistent persona and communication style throughout.',
    'Guide the conversation toward productive outcomes.',
  ],
  instruction_following: [
    'Read all instructions completely before beginning execution.',
    'Follow each instruction in the specified order and format.',
    'Adhere strictly to any constraints, formats, or requirements given.',
    'Ask for clarification only when instructions are genuinely ambiguous.',
    'Verify that your output meets all stated requirements before submitting.',
  ],
  negotiation_support: [
    'Understand both parties\' positions, interests, and constraints.',
    'Identify potential areas of compromise and mutual benefit.',
    'Suggest strategies based on principled negotiation techniques.',
    'Provide counterargument preparation for likely objections.',
    'Recommend a best alternative to negotiated agreement (BATNA).',
  ],

  // ── Data & Analysis ────────────────────────────────────────────────────────

  data_analysis: [
    'Understand the data structure, sources, and any quality issues.',
    'Identify the key metrics and questions to answer.',
    'Apply appropriate analytical methods (statistical tests, aggregations, visualizations).',
    'Identify patterns, trends, outliers, and anomalies in the data.',
    'Draw conclusions supported by the data and note limitations.',
    'Present findings with clear visualizations and actionable recommendations.',
  ],
  classification: [
    'Define the classification categories with explicit criteria for each.',
    'Read each item carefully before assigning a category.',
    'Apply the criteria consistently across all items.',
    'Handle ambiguous cases by documenting the decision rationale.',
    'Provide a summary of the classification distribution.',
  ],
  extraction: [
    'Define exactly what information needs to be extracted before starting.',
    'Read the source material systematically, section by section.',
    'Extract each data point with its source location for verification.',
    'Organize extracted data in a structured format (table, JSON, or list).',
    'Verify completeness by checking no required fields are missing.',
  ],
  structured_generation: [
    'Understand the target schema or structure requirements completely.',
    'Generate content that conforms exactly to the specified format.',
    'Validate each field against the schema constraints.',
    'Handle optional and required fields appropriately.',
    'Output clean, well-formatted structured data.',
  ],
  dataset_generation: [
    'Define the dataset schema with field types, ranges, and distributions.',
    'Generate realistic, diverse data that covers edge cases.',
    'Ensure referential integrity between related fields.',
    'Include the specified number of records with realistic variety.',
    'Validate the generated dataset against the schema constraints.',
  ],
  dataset_cleaning: [
    'Profile the dataset to identify quality issues (nulls, duplicates, outliers).',
    'Define cleaning rules for each identified issue.',
    'Handle missing values using appropriate imputation strategies.',
    'Remove or flag duplicates while documenting decisions.',
    'Validate the cleaned dataset against quality metrics.',
  ],
  data_transformation: [
    'Understand the source and target data formats.',
    'Define the transformation logic with clear mapping rules.',
    'Handle edge cases: nulls, type mismatches, and encoding issues.',
    'Validate that transformations preserve data integrity.',
    'Document the transformation pipeline for reproducibility.',
  ],
  data_validation: [
    'Define validation rules covering types, ranges, formats, and relationships.',
    'Apply rules systematically across the entire dataset.',
    'Report violations with specific row/field references.',
    'Categorize issues by severity: error, warning, info.',
    'Suggest corrections for common validation failures.',
  ],

  // ── NLP & Text Analysis ────────────────────────────────────────────────────

  sentiment_analysis: [
    'Read the text to understand context and detect irony or sarcasm.',
    'Classify overall sentiment: positive, negative, neutral, or mixed.',
    'Identify sentiment-bearing phrases with their polarity and intensity.',
    'Note aspect-level sentiment when multiple topics are discussed.',
    'Provide a confidence score for the overall classification.',
  ],
  topic_extraction: [
    'Read the text to identify the main themes and subjects.',
    'Extract distinct topics with representative keywords.',
    'Rank topics by prominence or frequency in the text.',
    'Identify relationships between extracted topics.',
    'Provide a summary of each topic with supporting evidence.',
  ],
  keyword_extraction: [
    'Scan the text to identify significant terms and phrases.',
    'Rank keywords by relevance, frequency, and specificity.',
    'Include both single-word keywords and multi-word key phrases.',
    'Remove stop words and generic terms from the results.',
    'Present keywords in a structured format with relevance scores.',
  ],
  entity_linking: [
    'Identify named entities in the text (people, organizations, locations, etc.).',
    'Disambiguate entities based on context and surrounding text.',
    'Link entities to their canonical representations or knowledge base IDs.',
    'Resolve coreferences to connect pronouns to their referents.',
    'Present entity mappings in a structured format with confidence scores.',
  ],

  // ── Retrieval & QA ─────────────────────────────────────────────────────────

  qa_rag: [
    'Read the provided context or documentation thoroughly before answering.',
    'Answer the question using only information from the provided context.',
    'Cite specific sections, passages, or page numbers that support your answer.',
    'If the context does not contain sufficient information, state this clearly.',
    'Distinguish between directly stated facts and inferences.',
  ],
  information_retrieval: [
    'Clarify exactly what information the user is looking for.',
    'Search for the most relevant and authoritative information.',
    'Present the information clearly, organized by relevance.',
    'Cite sources and note the confidence level of the information.',
    'Suggest related topics or follow-up questions if applicable.',
  ],
  fact_checking: [
    'Identify the specific claims that need verification.',
    'Evaluate each claim against known facts and reliable sources.',
    'Rate each claim: true, false, partially true, unverifiable.',
    'Provide supporting evidence or counter-evidence for each rating.',
    'Note the source reliability and any context that affects accuracy.',
  ],

  // ── Evaluation & Review ────────────────────────────────────────────────────

  evaluation: [
    'Define the evaluation criteria and scoring methodology.',
    'Apply criteria systematically and consistently to all items.',
    'Provide scores or ratings with detailed justification.',
    'Identify strengths and areas for improvement.',
    'Summarize findings with an overall evaluation verdict.',
  ],
  critique: [
    'Read the work thoroughly before forming judgments.',
    'Identify both strengths and weaknesses with specific examples.',
    'Provide constructive, actionable feedback for improvements.',
    'Support criticisms with reasoning, not just opinions.',
    'Maintain a balanced and respectful tone throughout.',
  ],
  feedback_analysis: [
    'Aggregate feedback from all sources into a unified view.',
    'Identify recurring themes and patterns in the feedback.',
    'Categorize feedback by topic, sentiment, and priority.',
    'Quantify feedback where possible (frequency, severity scores).',
    'Provide actionable insights and recommended next steps.',
  ],

  // ── Planning & Strategy ────────────────────────────────────────────────────

  planning: [
    'Define the goal, scope, and success criteria for the plan.',
    'Break the project into phases with clear milestones.',
    'Identify dependencies, risks, and critical path items.',
    'Estimate timelines and resource requirements for each phase.',
    'Create checkpoints for progress review and plan adjustment.',
  ],
  reasoning: [
    'State the problem or question clearly before beginning analysis.',
    'Break the problem into smaller components or sub-questions.',
    'Evaluate each component using evidence and logic.',
    'Consider alternative perspectives and potential counterarguments.',
    'Synthesize findings into a clear, well-supported conclusion.',
  ],
  decision_support: [
    'Clarify the decision context, constraints, and evaluation criteria.',
    'Enumerate the available options with key characteristics of each.',
    'Analyze each option against the criteria with pros and cons.',
    'Identify risks and trade-offs for each option.',
    'Provide a recommendation with clear justification, or a decision matrix.',
  ],
  prioritization: [
    'List all items to be prioritized with their key attributes.',
    'Define the prioritization criteria (impact, effort, urgency, etc.).',
    'Score or rank each item against the criteria.',
    'Present a prioritized list with clear rationale for ordering.',
    'Identify quick wins and high-impact items.',
  ],
  forecasting: [
    'Identify the variable to forecast and relevant historical data.',
    'Select an appropriate forecasting method for the data pattern.',
    'Generate projections with confidence intervals.',
    'Identify key assumptions and risk factors that could alter the forecast.',
    'Present results with clear visualizations and scenario analysis.',
  ],
  risk_analysis: [
    'Identify all relevant risks using systematic techniques.',
    'Assess each risk\'s probability and potential impact.',
    'Create a risk matrix or register with severity ratings.',
    'Propose mitigation strategies for high-priority risks.',
    'Recommend monitoring triggers and response plans.',
  ],
  simulation: [
    'Define the system or scenario to simulate with clear parameters.',
    'Specify input variables, their ranges, and distributions.',
    'Run the simulation with appropriate iterations or time steps.',
    'Analyze outputs: distributions, sensitivities, and key findings.',
    'Present results with confidence intervals and scenario comparisons.',
  ],

  // ── Compliance & Legal/Finance Analysis ────────────────────────────────────

  compliance_analysis: [
    'Identify the applicable regulations, standards, or policies.',
    'Map requirements to current practices or controls.',
    'Identify compliance gaps with severity ratings.',
    'Recommend remediation actions for each gap.',
    'Provide an overall compliance posture assessment.',
  ],
  legal_analysis: [
    'Identify the legal issue or question to analyze.',
    'Research relevant statutes, case law, and regulations.',
    'Apply legal reasoning to the specific facts at hand.',
    'Consider counterarguments and alternative interpretations.',
    'Present conclusions with appropriate caveats and disclaimers.',
  ],
  financial_analysis: [
    'Gather and validate the relevant financial data.',
    'Apply appropriate analytical frameworks (ratio, trend, comparative).',
    'Identify key findings: performance, risks, and opportunities.',
    'Present analysis with supporting calculations and visualizations.',
    'Provide conclusions with recommendations and caveats.',
  ],
  contract_review: [
    'Read the contract fully to understand its scope and structure.',
    'Identify key terms, obligations, rights, and deadlines.',
    'Flag risks: unfavorable clauses, ambiguities, and missing provisions.',
    'Compare against standard market terms where applicable.',
    'Provide a summary with recommended modifications.',
  ],

  // ── Requirements & Specs ───────────────────────────────────────────────────

  requirement_analysis: [
    'Read all provided requirements documentation thoroughly.',
    'Classify requirements as functional vs. non-functional.',
    'Identify gaps, ambiguities, and conflicting requirements.',
    'Validate requirements against stakeholder needs and constraints.',
    'Prioritize requirements and suggest resolution for conflicts.',
  ],
  specification_generation: [
    'Understand the scope and purpose of the specification.',
    'Define all components with clear, unambiguous language.',
    'Include acceptance criteria for each specification item.',
    'Reference relevant standards, constraints, and dependencies.',
    'Organize with numbered sections for easy reference.',
  ],

  // ── Education & Research ───────────────────────────────────────────────────

  education: [
    'Assess the learner\'s current knowledge level and learning objective.',
    'Introduce the concept with an intuitive explanation or analogy.',
    'Provide a clear, detailed explanation building from fundamentals.',
    'Illustrate with concrete examples that progress in complexity.',
    'Verify understanding with practice questions or exercises.',
  ],
  research: [
    'Define the research question and scope clearly.',
    'Survey existing knowledge and prior work on the topic.',
    'Identify gaps, contradictions, or areas of debate in the literature.',
    'Synthesize findings into a coherent narrative with proper attribution.',
    'Draw conclusions and suggest directions for further investigation.',
  ],
  question_generation: [
    'Identify the learning objectives or assessment goals.',
    'Generate questions at appropriate difficulty and Bloom\'s taxonomy levels.',
    'Include a mix of question types: open-ended, multiple-choice, analytical.',
    'Ensure questions are clear, unambiguous, and answerable from the content.',
    'Provide answer keys or rubrics where applicable.',
  ],
  quiz_generation: [
    'Define the quiz scope, difficulty level, and target audience.',
    'Create questions covering all specified topics with balanced distribution.',
    'Include correct answers and plausible distractors for multiple-choice.',
    'Provide explanations for each answer to support learning.',
    'Organize questions in a logical progression of difficulty.',
  ],
  experiment_design: [
    'Define the research hypothesis and variables (independent, dependent, controlled).',
    'Select an appropriate experimental design (RCT, factorial, quasi-experimental).',
    'Specify sample size, controls, and randomization procedures.',
    'Define measurement methods and data collection protocols.',
    'Plan the statistical analysis approach before data collection.',
  ],
  hypothesis_generation: [
    'Review the available evidence and context thoroughly.',
    'Generate testable hypotheses that address the research question.',
    'State each hypothesis clearly with observable predictions.',
    'Identify the null hypothesis and alternative for each.',
    'Suggest methods to test or falsify each hypothesis.',
  ],
  survey_generation: [
    'Define the survey objective and target population.',
    'Design questions using appropriate formats (Likert, multiple-choice, open-ended).',
    'Avoid leading, loaded, or double-barreled questions.',
    'Organize questions in a logical flow with clear sections.',
    'Include demographic questions and an introduction/consent section.',
  ],

  // ── Creative & Ideation ────────────────────────────────────────────────────

  brainstorming: [
    'Define the challenge or opportunity clearly.',
    'Generate a wide variety of ideas without premature judgment.',
    'Build on ideas through combination and variation.',
    'Organize ideas by theme, feasibility, or creative potential.',
    'Highlight the top ideas with brief rationale for each.',
  ],
  ideation: [
    'Frame the problem space with clear constraints and goals.',
    'Apply design thinking techniques: empathize, define, ideate.',
    'Generate concepts across multiple solution dimensions.',
    'Evaluate concepts against feasibility, desirability, and viability.',
    'Present top concepts with visual descriptions and next steps.',
  ],

  // ── Media Generation ───────────────────────────────────────────────────────

  image_generation: [
    'Define the subject, composition, and visual style clearly.',
    'Specify lighting, color palette, and camera angle/perspective.',
    'Include art style references (photorealistic, oil painting, anime, etc.).',
    'Add negative prompts to exclude unwanted elements.',
    'Use weighted tokens and quality boosters for optimal output.',
  ],
  video_generation: [
    'Define the scene: subject, environment, action, and mood.',
    'Specify camera movement: pan, zoom, dolly, static, tracking.',
    'Describe the temporal flow: what happens from start to end.',
    'Include cinematic style references: film grain, color grade, aspect ratio.',
    'Ensure scene coherence with consistent subject and setting throughout.',
  ],
  audio_generation: [
    'Specify the genre, tempo (BPM), and overall mood.',
    'Define instrumentation and arrangement details.',
    'Include structure guidance: intro, verse, chorus, bridge, outro.',
    'For speech: specify voice characteristics, emotion, and pacing.',
    'Add production style references: lo-fi, cinematic, orchestral, etc.',
  ],
  image_analysis: [
    'Describe what is visible in the image comprehensively.',
    'Identify key objects, people, text, and their relationships.',
    'Analyze composition, lighting, colors, and visual style.',
    'Note the context, mood, or intent the image conveys.',
    'Provide structured output with confidence levels for identifications.',
  ],
  video_analysis: [
    'Break the video into key scenes or segments.',
    'Describe the action, subjects, and setting in each segment.',
    'Identify camera movements, transitions, and editing techniques.',
    'Analyze the audio track and its relationship to visuals.',
    'Summarize the video\'s narrative arc and overall quality.',
  ],
  audio_analysis: [
    'Identify the audio type: speech, music, sound effects, or mixed.',
    'For speech: transcribe content and note speaker characteristics.',
    'For music: identify genre, tempo, key, instruments, and structure.',
    'Note audio quality: clarity, noise levels, production quality.',
    'Provide a structured analysis with timestamps for key segments.',
  ],

  // ── Prompt & Automation ────────────────────────────────────────────────────

  prompt_generation: [
    'Understand the target model and use case for the prompt.',
    'Define the desired output format, tone, and quality level.',
    'Include role definition, instructions, constraints, and examples.',
    'Use clear, unambiguous language with specific instructions.',
    'Test the prompt mentally against edge cases and ambiguities.',
  ],
  prompt_optimization: [
    'Analyze the current prompt for clarity, specificity, and completeness.',
    'Identify weaknesses: ambiguity, missing constraints, poor formatting.',
    'Suggest specific improvements with before/after comparisons.',
    'Add techniques: few-shot examples, chain-of-thought, role-setting.',
    'Verify the optimized prompt addresses the original use case.',
  ],
  tool_usage: [
    'Identify the appropriate tool or software for the task.',
    'Explain setup, configuration, and prerequisites.',
    'Provide step-by-step usage instructions with examples.',
    'Cover common pitfalls and troubleshooting tips.',
    'Include tips for advanced usage and integration.',
  ],
  automation: [
    'Identify the manual process to automate and its current steps.',
    'Design the automation workflow with triggers, actions, and conditions.',
    'Handle error cases, retries, and notification mechanisms.',
    'Implement with appropriate tools (scripts, CI/CD, cron, etc.).',
    'Document the automation for maintenance and monitoring.',
  ],
  task_execution: [
    'Understand the task requirements and success criteria.',
    'Break the task into sequential executable steps.',
    'Execute each step following the specified instructions precisely.',
    'Verify outputs meet the expected results at each step.',
    'Report completion status with any issues encountered.',
  ],

  // ── Structured Output ──────────────────────────────────────────────────────

  table_generation: [
    'Define the table structure: columns, headers, and data types.',
    'Populate rows with accurate, well-organized data.',
    'Ensure consistent formatting across all cells.',
    'Align columns appropriately (left for text, right for numbers).',
    'Include totals, averages, or summaries where appropriate.',
  ],
  form_generation: [
    'Define the form purpose and the data to collect.',
    'Design fields with appropriate types: text, select, checkbox, etc.',
    'Include labels, placeholders, and validation rules for each field.',
    'Organize fields in logical groups with clear section headers.',
    'Add required field markers and helpful validation messages.',
  ],
  schema_generation: [
    'Understand the data requirements and relationships.',
    'Define the schema with proper types, constraints, and descriptions.',
    'Include required/optional field designations.',
    'Add validation rules: patterns, ranges, enumerations.',
    'Output in the requested format (JSON Schema, GraphQL SDL, etc.).',
  ],

  // ── Design & Workflow ──────────────────────────────────────────────────────

  workflow_design: [
    'Map the current process or define the desired end state.',
    'Identify steps, decision points, roles, and handoffs.',
    'Design for efficiency by eliminating redundancies.',
    'Include error handling and exception paths.',
    'Document the workflow with clear diagrams and step descriptions.',
  ],
  pipeline_design: [
    'Define the pipeline purpose, inputs, and expected outputs.',
    'Design stages with clear interfaces between each.',
    'Handle failures: retries, dead-letter queues, and alerting.',
    'Consider scalability, throughput, and monitoring needs.',
    'Document the pipeline architecture with data flow diagrams.',
  ],

  // ── Recommendations ────────────────────────────────────────────────────────

  recommendation_generation: [
    'Understand the user\'s context, preferences, and constraints.',
    'Generate relevant recommendations based on available data.',
    'Rank recommendations by relevance, quality, or suitability.',
    'Provide clear rationale for each recommendation.',
    'Include alternatives and trade-offs for the top recommendations.',
  ],

  general: [
    'Understand the user\'s request and ask for clarification if needed.',
    'Provide accurate, well-organized information.',
    'Use clear language appropriate to the topic.',
    'Structure the response for easy reading.',
    'Offer next steps or related suggestions if applicable.',
  ],
};

// ─── Domain constraint sets (16 domains) ─────────────────────────────────────

export const domainConstraints: Record<DomainType, { positive: string[]; negative: string[] }> = {
  software: {
    positive: ['Use type-safe patterns', 'Handle errors explicitly', 'Follow SOLID principles', 'Write testable code', 'Use meaningful variable names'],
    negative: ['Do NOT use deprecated APIs', 'Avoid mutable global state', 'Do NOT skip error handling', 'Avoid premature optimization', 'Do NOT hardcode secrets or credentials'],
  },
  data_science: {
    positive: ['Validate data quality before analysis', 'Use appropriate statistical tests', 'Document assumptions explicitly', 'Include confidence intervals', 'Make visualizations accessible'],
    negative: ['Do NOT confuse correlation with causation', 'Avoid p-hacking or cherry-picking results', 'Do NOT ignore missing data without documentation', 'Avoid overfitting models'],
  },
  artificial_intelligence: {
    positive: ['Document model architecture and hyperparameters', 'Use proper train/validation/test splits', 'Report evaluation metrics transparently', 'Consider bias and fairness', 'Ensure reproducibility'],
    negative: ['Do NOT overstate model capabilities', 'Avoid data leakage between splits', 'Do NOT deploy without proper evaluation', 'Avoid ignoring ethical implications'],
  },
  cybersecurity: {
    positive: ['Follow defense in depth principles', 'Validate all inputs', 'Encrypt sensitive data at rest and in transit', 'Use least privilege access', 'Log security events'],
    negative: ['Do NOT expose sensitive information in errors', 'Avoid security through obscurity alone', 'Do NOT use deprecated cryptographic algorithms', 'Avoid storing passwords in plaintext'],
  },
  creative: {
    positive: ['Show, don\'t tell', 'Use sensory details for immersion', 'Develop characters with distinct voices', 'Maintain consistent tone throughout', 'Revise for prose quality'],
    negative: ['Avoid clichés and overused tropes', 'Do NOT use purple prose excessively', 'Avoid inconsistent character behavior', 'Do NOT break the fourth wall unless intentional'],
  },
  business: {
    positive: ['Support claims with data and evidence', 'Use industry-standard frameworks', 'Include actionable recommendations', 'Consider stakeholder perspectives', 'Quantify impact where possible'],
    negative: ['Do NOT make unsubstantiated claims', 'Avoid jargon without explanation', 'Do NOT ignore competitive context', 'Avoid unrealistic projections'],
  },
  finance: {
    positive: ['Show calculations and assumptions transparently', 'Include risk assessments', 'Use proper financial terminology', 'Present scenarios (best/base/worst)', 'Cite regulatory requirements'],
    negative: ['Do NOT provide specific investment advice without disclaimers', 'Avoid ignoring risk factors', 'Do NOT present projections as certainties', 'Avoid undisclosed conflicts of interest'],
  },
  legal: {
    positive: ['Use precise legal terminology', 'Cite relevant statutes and precedents', 'Note jurisdictional variations', 'Include appropriate disclaimers', 'Preserve legal nuance'],
    negative: ['Do NOT provide this as legal advice (include disclaimer)', 'Avoid oversimplifying legal concepts', 'Do NOT ignore jurisdictional differences', 'Avoid absolute statements about legal outcomes'],
  },
  medical: {
    positive: ['Cite evidence levels and clinical guidelines', 'Note contraindications and side effects', 'Recommend professional consultation', 'Use proper medical terminology with explanations', 'Consider patient safety'],
    negative: ['Do NOT provide specific medical diagnoses', 'Avoid replacing professional medical advice', 'Do NOT ignore contraindications', 'Avoid sensationalizing medical conditions'],
  },
  education: {
    positive: ['Align with learning objectives', 'Scaffold complexity progressively', 'Check for understanding', 'Use multiple representations (text, visual, example)', 'Encourage active learning'],
    negative: ['Do NOT assume prior knowledge without checking', 'Avoid cognitive overload', 'Do NOT skip foundational concepts', 'Avoid condescending language'],
  },
  marketing: {
    positive: ['Know your target audience', 'Use data to drive decisions', 'Include clear calls to action', 'Test and optimize continuously', 'Maintain brand consistency'],
    negative: ['Do NOT make false or misleading claims', 'Avoid clickbait without substance', 'Do NOT ignore audience segmentation', 'Avoid spammy or aggressive tactics'],
  },
  science: {
    positive: ['Follow the scientific method', 'Report methods and results transparently', 'Use proper statistical tests', 'Acknowledge limitations', 'Cite sources with proper attribution'],
    negative: ['Do NOT overstate conclusions beyond the evidence', 'Avoid selection bias in data reporting', 'Do NOT ignore negative results', 'Avoid unsupported causal claims'],
  },
  engineering: {
    positive: ['Reference applicable standards and codes', 'Include safety factors and margins', 'Document design assumptions', 'Verify calculations independently', 'Consider manufacturing constraints'],
    negative: ['Do NOT exceed rated specifications', 'Avoid ignoring safety standards', 'Do NOT skip verification steps', 'Avoid untested materials or methods'],
  },
  product_management: {
    positive: ['Ground decisions in user needs', 'Use data for prioritization', 'Define clear acceptance criteria', 'Consider the full user journey', 'Communicate trade-offs transparently'],
    negative: ['Do NOT build features without user validation', 'Avoid scope creep without re-prioritization', 'Do NOT ignore technical debt', 'Avoid vague requirements'],
  },
  operations: {
    positive: ['Define measurable KPIs', 'Document standard operating procedures', 'Use data-driven process improvements', 'Consider capacity constraints', 'Plan for failure modes'],
    negative: ['Do NOT change processes without impact analysis', 'Avoid single points of failure', 'Do NOT ignore compliance requirements', 'Avoid manual processes when automation is viable'],
  },
  media_production: {
    positive: ['Describe visual/audio elements with precise, specific language', 'Use style-appropriate terminology (camera angles, composition, BPM, etc.)', 'Include both positive and negative prompt guidance', 'Reference specific art styles, techniques, or production methods', 'Consider technical constraints of the target platform'],
    negative: ['Do NOT generate harmful or deceptive media content', 'Avoid vague descriptions that lead to ambiguous outputs', 'Do NOT ignore copyright or ethical considerations', 'Avoid conflicting style or mood descriptors'],
  },
  general: {
    positive: ['Be accurate and fact-based', 'Organize information clearly', 'Consider your audience', 'Provide actionable information'],
    negative: ['Do NOT present opinions as facts', 'Avoid unnecessary complexity', 'Do NOT make unsupported claims'],
  },
};

// ─── Output format mapping (87 task types) ───────────────────────────────────

export const taskOutputFormats: Record<TaskType, OutputFormat> = {
  // Code & Development
  code_generation: 'code',
  code_review: 'markdown',
  debugging: 'markdown',
  code_explanation: 'markdown',
  code_translation: 'code',
  code_documentation: 'markdown',
  architecture_design: 'markdown',
  unit_test_generation: 'code',
  test_case_generation: 'markdown',
  test_case_review: 'markdown',
  api_generation: 'code',
  api_documentation: 'markdown',

  // SQL & Database
  sql_generation: 'code',
  sql_analysis: 'markdown',
  query_optimization: 'code',
  database_design: 'markdown',

  // Writing & Content
  creative_writing: 'prose',
  content_writing: 'markdown',
  paraphrasing: 'prose',
  summarization: 'markdown',
  translation: 'prose',
  persuasion: 'prose',
  text_editing: 'prose',
  style_transfer: 'prose',

  // Document
  document_generation: 'markdown',
  document_analysis: 'markdown',

  // Conversation & Interaction
  conversation: 'prose',
  instruction_following: 'mixed',
  negotiation_support: 'markdown',

  // Data & Analysis
  data_analysis: 'mixed',
  classification: 'list',
  extraction: 'json',
  structured_generation: 'json',
  dataset_generation: 'json',
  dataset_cleaning: 'mixed',
  data_transformation: 'code',
  data_validation: 'markdown',

  // NLP & Text Analysis
  sentiment_analysis: 'json',
  topic_extraction: 'json',
  keyword_extraction: 'json',
  entity_linking: 'json',

  // Retrieval & QA
  qa_rag: 'markdown',
  information_retrieval: 'markdown',
  fact_checking: 'markdown',

  // Evaluation & Review
  evaluation: 'markdown',
  critique: 'markdown',
  feedback_analysis: 'markdown',

  // Planning & Strategy
  planning: 'markdown',
  reasoning: 'markdown',
  decision_support: 'markdown',
  prioritization: 'markdown',
  forecasting: 'mixed',
  risk_analysis: 'markdown',
  simulation: 'mixed',

  // Compliance & Legal/Finance
  compliance_analysis: 'markdown',
  legal_analysis: 'markdown',
  financial_analysis: 'mixed',
  contract_review: 'markdown',

  // Requirements & Specs
  requirement_analysis: 'markdown',
  specification_generation: 'markdown',

  // Education & Research
  education: 'markdown',
  research: 'markdown',
  question_generation: 'markdown',
  quiz_generation: 'markdown',
  experiment_design: 'markdown',
  hypothesis_generation: 'markdown',
  survey_generation: 'markdown',

  // Creative & Ideation
  brainstorming: 'list',
  ideation: 'markdown',

  // Media Generation
  image_generation: 'markdown',
  video_generation: 'markdown',
  audio_generation: 'markdown',
  image_analysis: 'markdown',
  video_analysis: 'markdown',
  audio_analysis: 'markdown',

  // Prompt & Automation
  prompt_generation: 'prose',
  prompt_optimization: 'markdown',
  tool_usage: 'markdown',
  automation: 'code',
  task_execution: 'mixed',

  // Structured Output
  table_generation: 'table',
  form_generation: 'json',
  schema_generation: 'json',

  // Design & Workflow
  workflow_design: 'markdown',
  pipeline_design: 'markdown',

  // Recommendations
  recommendation_generation: 'markdown',

  general: 'markdown',
};

// ─── Reasoning approach templates ────────────────────────────────────────────

export const reasoningTemplates: Record<DepthLevel, { base: string; withVerification: string }> = {
  none: {
    base: 'Answer directly and concisely.',
    withVerification: 'Answer directly and concisely. After completing your response, verify each key claim.',
  },
  standard: {
    base: 'Think step-by-step before answering. Show your reasoning.',
    withVerification: 'Think step-by-step before answering. Show your reasoning. After completing your response, verify each key claim.',
  },
  deep: {
    base: 'Use structured reasoning: <scratchpad>think here</scratchpad> then <answer>final answer</answer>. Verify your answer using an alternative method.',
    withVerification: 'Use structured reasoning: <scratchpad>think here</scratchpad> then <answer>final answer</answer>. Verify your answer using an alternative method. After completing your response, verify each key claim.',
  },
};

// ─── Section Builder Functions ────────────────────────────────────────────────

export function buildRoleSection(persona: PersonaResult): string {
  return `You are a ${persona.role_title} with ${persona.experience_years}+ years of experience. ${persona.role_definition}\n\nAreas of expertise: ${persona.expertise_areas.join(', ')}.\n\nMethodology: ${persona.methodology}`;
}

export function buildMissionSection(intent: IntentResult, domain: DomainResult): string {
  const task = intent.task_type.replace(/_/g, ' ');
  const domainLabel = domain.primary_domain.replace(/_/g, ' ');
  return `Your mission is to perform ${task} in the ${domainLabel} domain. The user's request: "${intent.intent}"\n\nComplexity level: ${intent.complexity}. Focus on delivering a high-quality, actionable response.`;
}

export function buildBehavioralRulesSection(domain: DomainType, task_type: TaskType): string {
  const constraints = domainConstraints[domain];
  const positiveRules = constraints.positive.map((r, i) => `${i + 1}. ALWAYS: ${r}`).join('\n');
  const negativeRules = constraints.negative.map((r, i) => `${i + 1}. NEVER: ${r}`).join('\n');
  return `## Behavioral Rules\n\n### DO:\n${positiveRules}\n\n### DO NOT:\n${negativeRules}`;
}

export function buildContextSection(intent: IntentResult, structure: StructureResult): string {
  const entities = intent.key_entities.length > 0 ? `Key topics: ${intent.key_entities.join(', ')}.` : '';
  return `Audience level: ${structure.audience_level}.\n${entities}\nComplexity: ${intent.complexity}. Adjust depth and terminology accordingly.`;
}

export function buildReasoningSection(reasoning: ReasoningResult): string {
  return `## Reasoning Approach\n\n${reasoning.reasoning_approach}\n\nThinking depth: ${reasoning.depth_level}. Thinking budget: ${reasoning.thinking_budget}.`;
}

export function buildInstructionsSection(structure: StructureResult): string {
  const numbered = structure.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n');
  return `## Instructions\n\n${numbered}`;
}

export function buildOutputFormatSection(structure: StructureResult): string {
  const formatDescriptions: Record<OutputFormat, string> = {
    prose: 'Write in clear, flowing prose paragraphs.',
    json: 'Output valid JSON following the specified schema.',
    markdown: 'Format your response using Markdown with headers, lists, and code blocks as appropriate.',
    code: 'Provide working code with comments. Use proper formatting and syntax highlighting.',
    table: 'Present data in well-formatted tables with clear headers.',
    xml: 'Output well-formed XML following the specified schema.',
    list: 'Present as a structured list with clear labels and organization.',
    mixed: 'Use a combination of prose, tables, and code/data as appropriate for the content.',
  };
  let section = `## Output Format\n\nFormat: ${structure.output_format}\n${formatDescriptions[structure.output_format]}`;
  if (structure.examples_needed) {
    section += '\n\nInclude concrete input/output examples to illustrate your approach.';
  }
  return section;
}

export function buildQualityStandardSection(reasoning: ReasoningResult, task_type: TaskType): string {
  let section = '## Quality Standards\n\n';
  section += '- Ensure factual accuracy and completeness in every section.\n';
  section += '- Verify claims using reliable sources and cite them where applicable.\n';
  section += '- Maintain logical and structural consistency across the response.\n';
  section += '- Ensure traceability of facts to verifiable evidence.\n';
  section += '- Avoid unsupported claims or speculative statements.\n';
  section += '- Preserve neutrality and avoid bias.\n';
  section += '- Keep information current and contextually relevant.\n';

  if (reasoning.verification_needed) {
    section += '- After completing your response, verify each key claim using an alternative method.\n';
    section += '- If you are uncertain about any fact, explicitly state the uncertainty.\n';
  }
  const domainQuality: Partial<Record<TaskType, string>> = {
    code_generation: '- All code must compile/run without errors. Include error handling.',
    code_review: '- Provide severity ratings for each issue found.',
    data_analysis: '- Support conclusions with statistical evidence. Note confidence levels.',
    education: '- Note evidence levels. Present information with appropriate scaffolding.',
    qa_rag: '- Cite sources for all claims. Note when information is insufficient.',
  };
  if (task_type in domainQuality) {
    section += domainQuality[task_type] + '\n';
  }
  return section;
}

/** Master builder: assembles all 8 sections from pipeline context */
export function buildPromptSections(ctx: PipelineContext): Record<PromptSection, string> {
  const persona = ctx.persona!;
  const intent = ctx.intent!;
  const domain = ctx.domain!;
  const reasoning = ctx.reasoning!;
  const structure = ctx.structure!;

  return {
    role: buildRoleSection(persona),
    mission: buildMissionSection(intent, domain),
    behavioral_rules: buildBehavioralRulesSection(domain.primary_domain, intent.task_type),
    context: buildContextSection(intent, structure),
    reasoning: buildReasoningSection(reasoning),
    instructions: buildInstructionsSection(structure),
    output_format: buildOutputFormatSection(structure),
    quality_standard: buildQualityStandardSection(reasoning, intent.task_type),
  };
}
