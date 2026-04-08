import type { TaskType } from '../types.js';

export interface FewShotExample {
  input: string;
  output: string;
  description?: string;
}

/** Few-shot example library keyed by task type */
export const exampleLibrary: Partial<Record<TaskType, FewShotExample[]>> = {
  code_generation: [
    {
      description: 'Function implementation',
      input: 'Write a function that checks if a string is a palindrome',
      output: `function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}`,
    },
    {
      description: 'API endpoint',
      input: 'Create a REST endpoint that returns paginated users',
      output: `app.get('/api/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;
  const [users, total] = await Promise.all([
    db.users.findMany({ skip: offset, take: limit }),
    db.users.count(),
  ]);
  res.json({ data: users, page, limit, total, pages: Math.ceil(total / limit) });
});`,
    },
    {
      description: 'Class design',
      input: 'Create a class for a simple event emitter',
      output: `class EventEmitter {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, fn: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: string, fn: Function): void {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const fn of this.listeners.get(event) ?? []) fn(...args);
  }
}`,
    },
  ],

  creative_writing: [
    {
      description: 'Short story opening',
      input: 'Write an opening paragraph for a mystery set in a lighthouse',
      output: 'The beam swept across the fog like a slow, searching eye. Mara stood at the base of the Ashford Lighthouse, her boots sinking into the wet gravel, and stared at the door that should have been locked. It hung open just enough to reveal a sliver of darkness inside — and the faint, copper smell of something she wished she did not recognize.',
    },
    {
      description: 'Poem',
      input: 'Write a short poem about the passage of time',
      output: `The clock forgets no second spent,
each tick a seed, each tock a rent
in silence where the hours went —
yet mornings rise, indifferent.`,
    },
  ],

  extraction: [
    {
      description: 'Entity extraction from paragraph',
      input: 'Extract key entities: "On March 15, 2024, Acme Corp announced that CEO Jane Smith would step down. The board appointed Michael Chen as interim CEO effective April 1."',
      output: `| Entity | Type | Value |
|--------|------|-------|
| Acme Corp | Organization | Announcing company |
| Jane Smith | Person | Outgoing CEO |
| Michael Chen | Person | Interim CEO |
| March 15, 2024 | Date | Announcement date |
| April 1 | Date | Effective date |`,
    },
    {
      description: 'Data from table',
      input: 'Extract total revenue and growth rate from the quarterly report table',
      output: `{
  "total_revenue": "$4.2B",
  "growth_rate_yoy": "12.3%",
  "quarter": "Q3 2024",
  "source": "Table 2, Row 1"
}`,
    },
  ],

  classification: [
    {
      description: 'Sentiment classification',
      input: 'Classify sentiment: "The product works fine but the customer service was terrible and I waited 3 hours on hold."',
      output: `Classification: Mixed (leaning negative)
- Product quality: Neutral ("works fine")
- Customer service: Negative ("terrible", "waited 3 hours")
- Overall: Negative (service experience dominates)
- Confidence: 0.85`,
    },
    {
      description: 'Topic classification',
      input: 'Classify this article: "New CRISPR technique enables single-base editing in plant genomes, opening doors for drought-resistant crops."',
      output: `Primary topic: Biotechnology
Secondary topics: Agriculture, Genetics
Sub-category: Gene editing / CRISPR
Audience: Scientific community, Agricultural industry
Confidence: 0.92`,
    },
  ],

  structured_generation: [
    {
      description: 'JSON schema generation',
      input: 'Generate a JSON schema for a user profile with name, email, age, and preferences',
      output: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 },
    "preferences": {
      "type": "object",
      "properties": {
        "theme": { "type": "string", "enum": ["light", "dark", "system"] },
        "notifications": { "type": "boolean" }
      }
    }
  },
  "required": ["name", "email"]
}`,
    },
    {
      description: 'Table generation',
      input: 'Generate a comparison table of three cloud providers',
      output: `| Feature | AWS | Azure | GCP |
|---------|-----|-------|-----|
| Compute | EC2 | Virtual Machines | Compute Engine |
| Storage | S3 | Blob Storage | Cloud Storage |
| Database | RDS, DynamoDB | SQL Database, CosmosDB | Cloud SQL, Firestore |
| Serverless | Lambda | Functions | Cloud Functions |
| Free Tier | 12 months | 12 months | Always Free + 90-day |`,
    },
  ],
};
