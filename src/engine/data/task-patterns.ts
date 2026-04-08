import type { TaskType } from '../types.js';

/** Signal patterns for all 87 task types, used by Stage 1 intent extraction */
export const taskPatterns: Record<TaskType, Array<string | RegExp>> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Code & Development ─────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  code_generation: [
    'write code', 'write a function', 'write a class', 'write a script',
    'create a function', 'create a class', 'create a module',
    'implement', 'build a function', 'generate code', 'develop a',
    'program', 'make a function', 'make a class',
    /\bfunction\b|\bmethod\b|\bclass\b|\bmodule\b/,
    /typescript|python|javascript|java\b|rust|golang|c\+\+/,
  ],

  code_review: [
    'review', 'review code', 'code review', 'refactor', 'optimize',
    'improve code', 'clean up', 'code quality', 'best practices',
    'code smell', 'lint', 'review this',
    /performance issue|efficiency/, /maintainability|readability/,
  ],

  debugging: [
    'debug', 'fix', 'troubleshoot', 'error', 'crash', 'issue',
    'not working', 'broken', 'fails', 'exception', 'stack trace',
    /bug|defect/, /undefined|null pointer|segfault/,
  ],

  code_explanation: [
    'explain this code', 'what does this code', 'how does this work',
    'walk through', 'code walkthrough', 'understand this',
    'what is happening', 'line by line', 'annotate',
    /explain.*code/, /how.*function.*work/,
  ],

  code_translation: [
    'convert code', 'port to', 'migrate code', 'translate code',
    'rewrite in', 'convert from', 'python to javascript',
    'java to kotlin', 'javascript to typescript', 'code migration',
    /convert.*code|code.*convert/, /port.*to|migrate.*from/,
    /translate.*code|code.*translat/,
    /python.*to.*javascript|java.*to.*kotlin|js.*to.*ts/,
  ],

  code_documentation: [
    'document this code', 'add comments', 'add documentation',
    'write docstring', 'write jsdoc', 'generate docs for',
    'api docs', 'document the function', 'readme for',
    'code comments', 'inline documentation',
    /docstring|jsdoc|javadoc|tsdoc/, /document.*code|code.*document/,
  ],

  architecture_design: [
    'architecture', 'system design', 'design pattern', 'microservice',
    'scalability', 'infrastructure', 'high-level design', 'tech stack',
    'database design', 'api design', 'distributed',
    /architect|blueprint|topology/, /scale|load balanc/,
  ],

  unit_test_generation: [
    'write unit test', 'generate unit test', 'create unit test',
    'unit test for', 'test this function', 'jest test',
    'pytest', 'mocha test', 'write test cases',
    'unit testing', 'test coverage',
    /unit.?test|write.*test.*for/, /jest|pytest|mocha|vitest|junit/,
  ],

  test_case_generation: [
    'generate test cases', 'create test cases', 'test scenarios',
    'write test cases', 'test plan', 'test suite',
    'edge cases', 'boundary testing', 'test matrix',
    'integration test', 'e2e test', 'acceptance test',
    /test.?case|test.?scenario|test.?plan/, /generat.*test|creat.*test/,
  ],

  test_case_review: [
    'review test cases', 'review tests', 'test coverage review',
    'improve test', 'test quality', 'missing test cases',
    'test gaps', 'test adequacy', 'check test',
    /review.*test|test.*review/, /test.*coverage|test.*quality/,
  ],

  api_generation: [
    'generate api', 'create api', 'build api', 'design api',
    'rest api', 'graphql api', 'api endpoint', 'create endpoint',
    'api scaffold', 'api boilerplate',
    /generat.*api|creat.*api|build.*api/, /rest.*api|graphql.*api/,
  ],

  api_documentation: [
    'document api', 'api docs', 'swagger', 'openapi',
    'api reference', 'endpoint documentation', 'api spec',
    'postman collection', 'api guide',
    /swagger|openapi|api.*doc/, /document.*api|api.*reference/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── SQL & Database ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  sql_generation: [
    'write sql', 'generate sql', 'create sql', 'sql query',
    'write a query', 'select from', 'insert into', 'update table',
    'sql for', 'create table', 'alter table',
    /write.*sql|sql.*query|generat.*sql/, /\bselect\b.*\bfrom\b/,
  ],

  sql_analysis: [
    'analyze sql', 'explain query', 'query plan', 'sql performance',
    'optimize sql', 'sql review', 'slow query',
    'execution plan', 'index analysis',
    /analyz.*sql|sql.*analys/, /query.*plan|slow.*query/,
  ],

  query_optimization: [
    'optimize query', 'query performance', 'speed up query',
    'improve query', 'query tuning', 'index optimization',
    'slow query', 'query execution', 'query plan',
    /optimiz.*query|query.*optim/, /query.*performance|query.*tun/,
  ],

  database_design: [
    'database design', 'schema design', 'erd', 'entity relationship',
    'data model', 'database schema', 'table design', 'normalization',
    'database architecture', 'relational design',
    /database.*design|schema.*design/, /erd|entity.*relationship/,
    /normaliz|data.*model/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Writing & Content ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  creative_writing: [
    'write a story', 'poem', 'fiction', 'narrative', 'creative',
    'imagine', 'character', 'plot', 'scene', 'novel',
    'short story', 'screenplay', 'dialogue', 'story about',
    'science fiction', 'fairy tale', 'mythology',
    /once upon|fantasy|sci-fi|horror|romance/, /story|fiction|narrative/,
  ],

  content_writing: [
    'blog post', 'article', 'write content', 'content for',
    'website copy', 'product description', 'social media post',
    'newsletter', 'press release', 'write about',
    /blog|article|post|content/, /headline|subheading/,
  ],

  paraphrasing: [
    'paraphrase', 'rephrase', 'rewrite', 'reword', 'say differently',
    'different words', 'alternative wording', 'simplify this',
    'make it simpler', 'make it formal', 'make it casual',
    /rephrase|restate|reformulate/,
  ],

  summarization: [
    'summarize', 'summarise', 'tldr', 'key points', 'brief', 'condense',
    'overview', 'abstract', 'digest', 'highlight', 'recap',
    'main ideas', 'bullet points', 'short version', 'in a nutshell',
    /summary|synopsis|gist/, /summariz|summar/,
  ],

  translation: [
    'translate', 'translation', 'convert to', 'in spanish',
    'in french', 'in german', 'in japanese', 'in chinese',
    'in hindi', 'in arabic', 'localize', 'localization',
    /translat|language|lingo/, /spanish|french|german|japanese|chinese|korean|portuguese/,
  ],

  persuasion: [
    'persuade', 'convince', 'argue', 'argument', 'compelling',
    'landing page', 'sales', 'pitch', 'call to action',
    'motivate', 'influence', 'advocacy',
    /persuasi|compelling|cta/, /sales copy|pitch deck/,
  ],

  text_editing: [
    'edit this', 'proofread', 'grammar check', 'fix grammar',
    'correct spelling', 'fix typos', 'improve writing',
    'polish', 'revise', 'copy edit', 'line edit',
    'fix punctuation', 'tighten prose',
    /proofread|grammar|spell.*check/, /edit.*text|text.*edit/,
    /copy.?edit|line.?edit/,
  ],

  style_transfer: [
    'rewrite in the style of', 'change the tone', 'make it more formal',
    'make it more casual', 'write like', 'adapt the style',
    'change voice', 'tone shift', 'formalize', 'simplify language',
    'academic style', 'conversational style',
    /style.*transfer|transfer.*style/, /rewrite.*style|style.*of/,
    /change.*tone|tone.*shift/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Document ───────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  document_generation: [
    'generate document', 'create document', 'write report',
    'generate report', 'create report', 'draft document',
    'write whitepaper', 'create whitepaper', 'write proposal',
    'generate proposal', 'create memo', 'write memo',
    /generat.*document|document.*generat/, /creat.*report|write.*report/,
    /draft.*document|whitepaper|proposal/,
  ],

  document_analysis: [
    'analyze document', 'review document', 'parse document',
    'document review', 'analyze report', 'audit document',
    'check document', 'evaluate report', 'assess document',
    /analyz.*document|document.*analys/, /review.*document|document.*review/,
    /parse.*document|audit.*document/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Conversation & Interaction ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  conversation: [
    'chat', 'conversation', 'talk', 'discuss', 'practice speaking',
    'role play', 'roleplay', 'simulate', 'dialogue practice',
    'conversational', 'interview practice',
    /convers|chat|role.?play/, /practice.*speaking/,
  ],

  instruction_following: [
    'follow these instructions', 'do exactly', 'step by step',
    'execute these steps', 'follow the steps', 'do as told',
    'follow directions', 'complete this task', 'perform as instructed',
    /follow.*instruct|instruct.*follow/, /do.*exactly|execute.*step/,
  ],

  negotiation_support: [
    'negotiate', 'negotiation', 'counter offer', 'bargain',
    'deal terms', 'negotiation strategy', 'concession',
    'mediate', 'negotiation tactics', 'compromise',
    'term sheet', 'negotiation position',
    /negotiat|bargain|counter.?offer/, /mediat|compromis/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Data & Analysis ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  data_analysis: [
    'analyze', 'analyse', 'visualize', 'statistics', 'insights',
    'trend', 'chart', 'dashboard', 'report', 'metrics',
    'correlation', 'distribution', 'pattern',
    /dataset|dataframe/, /analyz|analys|statistic/,
  ],

  classification: [
    'classify', 'categorize', 'categorise', 'label', 'tag',
    'sort into', 'group', 'bucket', 'sentiment',
    'positive or negative', 'spam or not',
    /classif|categoriz|categori/, /label|tag|sentiment/,
  ],

  extraction: [
    'extract', 'pull out', 'find all', 'identify', 'parse',
    'scrape', 'mine', 'retrieve from', 'get the',
    'named entities', 'ner', 'key information',
    /extract|parse|scrape/, /named entit|ner/,
  ],

  structured_generation: [
    'generate json', 'generate xml', 'generate csv',
    'structured output', 'schema', 'template',
    'fill in', 'fill out form', 'structured data',
    /\bjson\b|\bxml\b|\bcsv\b|\byaml\b/, /structur.*generat|generat.*structur/,
  ],

  dataset_generation: [
    'generate dataset', 'create dataset', 'synthetic data',
    'fake data', 'sample data', 'mock data', 'test data',
    'training data', 'seed data', 'data generation',
    /generat.*dataset|dataset.*generat/, /synthetic.*data|fake.*data/,
    /mock.*data|sample.*data/,
  ],

  dataset_cleaning: [
    'clean data', 'data cleaning', 'remove duplicates',
    'handle missing', 'data wrangling', 'data preprocessing',
    'fix data', 'data quality', 'deduplicate', 'impute',
    /clean.*data|data.*clean/, /data.*wrangl|preprocess/,
    /dedup|imput|missing.*data/,
  ],

  data_transformation: [
    'transform data', 'data transformation', 'reshape data',
    'pivot', 'unpivot', 'melt', 'aggregate data',
    'data pipeline', 'etl', 'map data', 'convert format',
    /transform.*data|data.*transform/, /reshape|pivot|melt|aggregat/,
    /\betl\b|data.*pipeline/,
  ],

  data_validation: [
    'validate data', 'data validation', 'check data quality',
    'data integrity', 'data rules', 'validation rules',
    'data constraints', 'verify data', 'data audit',
    /validat.*data|data.*validat/, /data.*integrity|data.*quality/,
    /data.*rules|verify.*data/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── NLP & Text Analysis ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  sentiment_analysis: [
    'sentiment', 'sentiment analysis', 'positive or negative',
    'opinion mining', 'emotional tone', 'feeling',
    'detect sentiment', 'mood analysis', 'polarity',
    /sentiment.*analys|analyz.*sentiment/, /opinion.*min|emoti.*ton/,
    /polarity|positive.*negative/,
  ],

  topic_extraction: [
    'extract topics', 'topic modeling', 'topic detection',
    'identify topics', 'main topics', 'topic analysis',
    'theme extraction', 'subject detection', 'topic clustering',
    /topic.*extract|extract.*topic/, /topic.*model|topic.*detect/,
    /theme.*extract|subject.*detect/,
  ],

  keyword_extraction: [
    'extract keywords', 'keyword extraction', 'key terms',
    'find keywords', 'important words', 'key phrases',
    'keyword analysis', 'term extraction', 'tag extraction',
    /keyword.*extract|extract.*keyword/, /key.*term|key.*phrase/,
  ],

  entity_linking: [
    'entity linking', 'entity resolution', 'entity disambiguation',
    'link entities', 'resolve entities', 'knowledge graph',
    'named entity', 'entity matching', 'coreference',
    /entity.*link|link.*entit/, /entity.*resol|entity.*disambig/,
    /knowledge.*graph|coreference/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Retrieval & QA ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  qa_rag: [
    'answer questions', 'based on', 'according to', 'from the document',
    'from the text', 'knowledge base', 'documentation',
    'retrieval', 'lookup', 'reference',
    /answer.*question|question.*answer/, /based on.*document|from.*context/,
  ],

  information_retrieval: [
    'find information', 'look up', 'search for', 'what is',
    'tell me about', 'information about', 'details on',
    'facts about', 'definition of', 'who is', 'when did',
    /find.*info|look.*up|search.*for/, /what is|who is|when did/,
  ],

  fact_checking: [
    'fact check', 'verify claim', 'is it true', 'debunk',
    'check accuracy', 'verify statement', 'true or false',
    'misinformation', 'verify facts', 'source check',
    /fact.?check|verify.*claim/, /debunk|misinform|true.*false/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Evaluation & Review ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  evaluation: [
    'evaluate', 'assess', 'grade', 'score', 'rate',
    'benchmark', 'measure', 'appraise', 'judge',
    'performance evaluation', 'quality assessment',
    /evaluat|assess|benchmark/, /grade|score|rate|apprais/,
  ],

  critique: [
    'critique', 'critical review', 'give feedback on',
    'constructive criticism', 'strengths and weaknesses',
    'provide critique', 'peer review', 'editorial feedback',
    /critiqu|critical.*review/, /feedback.*on|strengths.*weakness/,
  ],

  feedback_analysis: [
    'analyze feedback', 'feedback analysis', 'review feedback',
    'customer feedback', 'user feedback', 'survey results',
    'nps analysis', 'feedback themes', 'feedback report',
    /analyz.*feedback|feedback.*analys/, /customer.*feedback|user.*feedback/,
    /nps.*analys|survey.*result/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Planning & Strategy ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  planning: [
    'plan', 'roadmap', 'strategy', 'steps to', 'how to achieve',
    'prioritize', 'timeline', 'milestones', 'schedule',
    'organize', 'action plan', 'project plan',
    /plan|roadmap|timeline/, /strateg|priorit|milestone/,
  ],

  reasoning: [
    'reason', 'think through', 'logic', 'deduce', 'infer',
    'why does', 'how come', 'cause and effect', 'implication',
    'evaluate', 'pros and cons', 'trade-off',
    /reason|logic|deduc/, /pros.*cons|trade.?off/,
  ],

  decision_support: [
    'decide', 'choose', 'recommend', 'which is better',
    'compare options', 'decision', 'advice', 'suggest',
    'should i', 'best option', 'alternative',
    /decid|choos|recommend/, /which.*better|best.*option/,
  ],

  prioritization: [
    'prioritize', 'rank', 'order by importance', 'triage',
    'most important', 'priority list', 'priority matrix',
    'eisenhower', 'moscow method', 'weighted scoring',
    /prioritiz|triage|rank.*import/, /priority.*matrix|eisenhower/,
  ],

  forecasting: [
    'forecast', 'predict', 'projection', 'future trend',
    'estimate future', 'outlook', 'prediction model',
    'growth projection', 'demand forecast', 'trend prediction',
    /forecast|predict|project/, /future.*trend|growth.*project/,
  ],

  risk_analysis: [
    'risk analysis', 'risk assessment', 'identify risks',
    'risk matrix', 'risk mitigation', 'threat assessment',
    'vulnerability assessment', 'risk register', 'probability impact',
    /risk.*analys|risk.*assess/, /risk.*matrix|risk.*mitig/,
    /threat.*assess|vulnerab.*assess/,
  ],

  simulation: [
    'simulate', 'simulation', 'monte carlo', 'scenario modeling',
    'what if analysis', 'stress test', 'model scenario',
    'run simulation', 'agent simulation', 'system dynamics',
    /simulat|monte.?carlo/, /what.?if.*analys|scenario.*model/,
    /stress.*test|system.*dynamic/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Compliance & Legal/Finance Analysis ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  compliance_analysis: [
    'compliance check', 'regulatory compliance', 'audit',
    'compliance review', 'policy compliance', 'gdpr',
    'hipaa compliance', 'sox compliance', 'compliance gap',
    /complianc.*analys|complianc.*check/, /regulat.*complianc|gdpr|hipaa/,
    /sox.*complianc|complianc.*gap/,
  ],

  legal_analysis: [
    'legal analysis', 'legal review', 'analyze clause',
    'legal interpretation', 'statutory analysis', 'case analysis',
    'legal risk', 'liability analysis', 'legal opinion',
    /legal.*analys|analyz.*legal/, /legal.*review|legal.*interpret/,
    /statutory.*analys|case.*analys/,
  ],

  financial_analysis: [
    'financial analysis', 'analyze financials', 'financial review',
    'ratio analysis', 'financial modeling', 'valuation',
    'dcf analysis', 'balance sheet analysis', 'p&l analysis',
    /financial.*analys|analyz.*financ/, /ratio.*analys|financial.*model/,
    /dcf|valuation|balance.*sheet/,
  ],

  contract_review: [
    'review contract', 'contract review', 'analyze contract',
    'contract analysis', 'check contract', 'contract terms',
    'contract risks', 'redline', 'contract clause',
    /contract.*review|review.*contract/, /contract.*analys|analyz.*contract/,
    /redline|contract.*clause/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Requirements & Specs ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  requirement_analysis: [
    'analyze requirements', 'requirement analysis', 'review requirements',
    'functional requirements', 'non-functional requirements', 'user requirements',
    'requirement gaps', 'requirement validation', 'brd',
    /requirement.*analys|analyz.*requirement/, /functional.*req|non.?functional/,
    /brd|user.*requirement|requirement.*gap/,
  ],

  specification_generation: [
    'generate specification', 'create spec', 'write specification',
    'technical spec', 'functional spec', 'design spec',
    'specification document', 'spec sheet', 'product spec',
    /generat.*spec|creat.*spec/, /technical.*spec|functional.*spec/,
    /spec.*document|spec.*sheet/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Education & Research ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  education: [
    'teach', 'learn', 'tutorial', 'explain', 'understand',
    'education', 'lesson', 'example', 'step by step',
    'beginner', 'how does', 'concept',
    /teach|tutor|lesson/, /explain.*concept|learn.*about/,
  ],

  research: [
    'research', 'investigate', 'study', 'literature review',
    'survey', 'compare', 'state of the art',
    'academic', 'paper', 'systematic review',
    /research|investigat|literature/, /survey|state of the art/,
  ],

  question_generation: [
    'generate questions', 'create questions', 'write questions',
    'question bank', 'interview questions', 'comprehension questions',
    'discussion questions', 'study questions',
    /generat.*question|creat.*question/, /question.*bank|interview.*question/,
  ],

  quiz_generation: [
    'generate quiz', 'create quiz', 'make a quiz',
    'quiz questions', 'multiple choice', 'true false questions',
    'trivia', 'assessment questions', 'exam questions',
    /generat.*quiz|creat.*quiz/, /quiz.*question|multiple.*choice/,
    /trivia|exam.*question/,
  ],

  experiment_design: [
    'design experiment', 'experimental design', 'research design',
    'control group', 'hypothesis testing', 'a/b test design',
    'study design', 'clinical trial design', 'methodology design',
    /experiment.*design|design.*experiment/, /research.*design|study.*design/,
    /a.?b.*test.*design|control.*group/,
  ],

  hypothesis_generation: [
    'generate hypothesis', 'formulate hypothesis', 'propose hypothesis',
    'research question', 'what if', 'hypothesize',
    'testable prediction', 'null hypothesis', 'theory formation',
    /generat.*hypothes|formulat.*hypothes/, /hypothes.*generat|propos.*hypothes/,
    /research.*question|null.*hypothes/,
  ],

  survey_generation: [
    'generate survey', 'create survey', 'design survey',
    'survey questions', 'questionnaire', 'poll', 'likert scale',
    'survey design', 'feedback form', 'customer survey',
    /generat.*survey|creat.*survey/, /survey.*question|questionnair/,
    /likert|feedback.*form/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Creative & Ideation ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  brainstorming: [
    'brainstorm', 'brainstorming', 'generate ideas', 'idea generation',
    'think of ideas', 'list ideas', 'come up with',
    'creative ideas', 'explore possibilities', 'mind map',
    /brainstorm|generat.*idea|idea.*generat/, /come.*up.*with|mind.*map/,
  ],

  ideation: [
    'ideate', 'ideation', 'concept development', 'design thinking',
    'innovation', 'new concepts', 'creative exploration',
    'blue sky thinking', 'divergent thinking', 'concept generation',
    /ideat|concept.*develop/, /design.*think|innovat|divergent/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Media Generation ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  image_generation: [
    'generate an image', 'create an image', 'draw', 'illustration',
    'generate a picture', 'create a picture', 'image prompt',
    'visual', 'render', 'digital art', 'concept art', 'photo',
    'painting', 'sketch', 'portrait', 'landscape image',
    'stable diffusion', 'midjourney', 'dall-e', 'dalle',
    'text to image', 'text-to-image', 'image of',
    'generate art', 'create art', 'artwork',
    'photorealistic', 'stylized', 'anime style', 'oil painting',
    'watercolor', 'pixel art', 'vector art', '3d render',
    /generat.*image|image.*generat/, /create.*art|art.*creat/,
    /dall.?e|midjourney|stable.?diffusion|sdxl/,
    /\bimage\b.*prompt|\bprompt\b.*image/,
    /concept.?art|digital.?art|pixel.?art|fan.?art/,
  ],

  video_generation: [
    'generate a video', 'create a video', 'video prompt',
    'animate', 'animation', 'motion', 'footage',
    'text to video', 'text-to-video', 'video of',
    'sora', 'runway', 'pika', 'gen-2', 'kling',
    'video clip', 'short film', 'movie scene',
    'cinematic', 'timelapse', 'slow motion',
    'storyboard', 'motion graphics', 'vfx',
    'video generation', 'ai video', 'generate video',
    /generat.*video|video.*generat/, /creat.*video|video.*creat/,
    /text.?to.?video|sora|runway|pika|kling/,
    /animat|motion.?graphic|cinemat/,
  ],

  audio_generation: [
    'generate audio', 'create audio', 'audio prompt',
    'generate music', 'create music', 'compose music',
    'sound effect', 'sound design', 'soundscape',
    'text to speech', 'text-to-speech', 'tts',
    'text to audio', 'text-to-audio', 'voice',
    'suno', 'udio', 'musicgen', 'bark', 'elevenlabs',
    'audio generation', 'music generation', 'song',
    'beat', 'melody', 'synthesize', 'voiceover',
    'podcast', 'jingle', 'soundtrack', 'audio of',
    /generat.*audio|audio.*generat/, /generat.*music|music.*generat/,
    /text.?to.?speech|text.?to.?audio|tts\b/,
    /suno|udio|musicgen|elevenlabs|bark/,
    /compose|sound.?design|sound.?effect/,
  ],

  image_analysis: [
    'analyze image', 'describe image', 'what is in this image',
    'image recognition', 'image classification', 'object detection',
    'image description', 'visual analysis', 'image review',
    /analyz.*image|image.*analys/, /image.*recogn|object.*detect/,
    /describe.*image|image.*classif/,
  ],

  video_analysis: [
    'analyze video', 'video analysis', 'describe video',
    'video review', 'scene detection', 'video content',
    'motion analysis', 'video summary', 'frame analysis',
    /analyz.*video|video.*analys/, /video.*review|scene.*detect/,
    /frame.*analys|motion.*analys/,
  ],

  audio_analysis: [
    'analyze audio', 'audio analysis', 'transcribe',
    'speech recognition', 'audio review', 'music analysis',
    'sound analysis', 'audio classification', 'speaker identification',
    /analyz.*audio|audio.*analys/, /transcrib|speech.*recogn/,
    /music.*analys|sound.*analys/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Prompt & Automation ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  prompt_generation: [
    'generate prompt', 'create prompt', 'write prompt',
    'prompt template', 'craft prompt', 'prompt for',
    'system prompt', 'prompt design', 'prompt craft',
    /generat.*prompt|creat.*prompt/, /write.*prompt|craft.*prompt/,
    /prompt.*template|prompt.*design/,
  ],

  prompt_optimization: [
    'optimize prompt', 'improve prompt', 'refine prompt',
    'prompt engineering', 'better prompt', 'prompt tuning',
    'enhance prompt', 'prompt iteration', 'prompt quality',
    /optimiz.*prompt|improv.*prompt/, /prompt.*engineer|prompt.*tun/,
    /refin.*prompt|enhanc.*prompt/,
  ],

  tool_usage: [
    'use tool', 'tool usage', 'how to use', 'tool tutorial',
    'tool guide', 'software tutorial', 'tool configuration',
    'setup tool', 'configure tool', 'tool integration',
    /tool.*usage|use.*tool/, /tool.*tutori|tool.*guide/,
    /tool.*config|setup.*tool/,
  ],

  automation: [
    'automate', 'automation', 'workflow automation', 'script automation',
    'auto-generate', 'batch process', 'scheduled task',
    'cron job', 'ci/cd', 'pipeline automation',
    /automat|auto.?generat/, /batch.*process|cron.*job|ci.?cd/,
    /workflow.*automat|pipeline.*automat/,
  ],

  task_execution: [
    'execute task', 'run task', 'perform task', 'complete task',
    'task runner', 'job execution', 'process execution',
    'run this', 'execute this', 'carry out',
    /execut.*task|task.*execut/, /run.*task|perform.*task/,
    /job.*execut|carry.*out/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Structured Output ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  table_generation: [
    'generate table', 'create table', 'make a table',
    'comparison table', 'data table', 'table format',
    'tabular', 'spreadsheet', 'csv table',
    /generat.*table|creat.*table/, /comparison.*table|data.*table/,
    /tabular|spreadsheet/,
  ],

  form_generation: [
    'generate form', 'create form', 'design form',
    'form builder', 'input form', 'registration form',
    'contact form', 'form fields', 'form layout',
    /generat.*form|creat.*form/, /form.*build|form.*field/,
    /design.*form|form.*layout/,
  ],

  schema_generation: [
    'generate schema', 'create schema', 'design schema',
    'json schema', 'database schema', 'data schema',
    'schema definition', 'type schema', 'graphql schema',
    /generat.*schema|creat.*schema/, /json.*schema|data.*schema/,
    /schema.*defin|graphql.*schema/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Design & Workflow ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  workflow_design: [
    'design workflow', 'workflow design', 'process design',
    'workflow diagram', 'business process', 'flow chart',
    'workflow optimization', 'process flow', 'bpmn',
    /workflow.*design|design.*workflow/, /process.*design|flow.*chart/,
    /bpmn|workflow.*diagram/,
  ],

  pipeline_design: [
    'design pipeline', 'pipeline design', 'data pipeline',
    'ci/cd pipeline', 'ml pipeline', 'processing pipeline',
    'pipeline architecture', 'etl pipeline', 'stream pipeline',
    /pipeline.*design|design.*pipeline/, /data.*pipeline|ci.?cd.*pipeline/,
    /ml.*pipeline|etl.*pipeline/,
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ── Recommendations ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  recommendation_generation: [
    'recommend', 'suggestion', 'what should i', 'best practice',
    'recommendation', 'advise', 'prescribe', 'top picks',
    'curated list', 'personalized recommendation',
    /recommend|suggest|advise/, /best.*practice|top.*pick/,
    /personali.*recommend|curat.*list/,
  ],

  general: [
    'help me', 'hello', 'hey', 'thanks', 'please help',
    'can you', 'tell me', 'what is', 'how to', 'how do',
    /^help$|^hi$|^hey$|^hello$/,
  ],
};
