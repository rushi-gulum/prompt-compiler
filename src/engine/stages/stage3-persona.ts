import type { PersonaResult, IntentResult, DomainResult, DomainType, TaskType } from '../types.js';
import { domainBasePersonas, taskModifiers, generalistPersona } from '../data/personas.js';

let cachedLibrary: Partial<Record<DomainType, Partial<Record<TaskType, PersonaResult>>>> | null = null;

async function getLibrary(): Promise<Partial<Record<DomainType, Partial<Record<TaskType, PersonaResult>>>>> {
  if (cachedLibrary) return cachedLibrary;

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const url = chrome.runtime.getURL('data/personas.json');
      const res = await fetch(url);
      cachedLibrary = await res.json();
    } else {
      // Node fallback for tests
      // @ts-ignore
      const fs = await import('fs');
      // @ts-ignore
      const path = await import('path');
      // @ts-ignore
      const data = fs.readFileSync(path.resolve(process.cwd(), 'src/engine/data/personas.json'), 'utf-8');
      cachedLibrary = JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load persona library:', error);
    cachedLibrary = {}; // Fallback empty
  }
  return cachedLibrary!;
}

/** Stage 3: Map the best expert persona based on domain × task_type */
export async function mapPersona(intent: IntentResult, domain: DomainResult): Promise<PersonaResult> {
  const d = domain.primary_domain;
  const t = intent.task_type;

  const library = await getLibrary();

  // 1. Direct lookup in persona library
  const libraryHit = library[d]?.[t];
  if (libraryHit) {
    return libraryHit;
  }

  // 2. Domain is 'general' → return generalist persona
  if (d === 'general') {
    return generalistPersona;
  }

  // 3. Compose: domain base + task modifier
  const base = domainBasePersonas[d];
  const modifier = taskModifiers[t];

  return {
    role_title: base.role_title,
    role_definition: base.role_definition,
    expertise_areas: [...base.expertise_areas],
    methodology: modifier.methodology,
    communication_style: modifier.communication_style,
    experience_years: base.experience_years,
  };
}
