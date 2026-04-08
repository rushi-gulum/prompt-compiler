import type { CompiledPrompt, CompilationError, AudienceLevel, DomainType } from '../../engine/types.js';

// ─── Action Types ─────────────────────────────────────────────────────────────

export type MessageAction =
  | 'compile'
  | 'get_settings'
  | 'update_settings'
  | 'get_history'
  | 'search_history'
  | 'toggle_star_history'
  | 'clear_history'
  | 'insert_prompt'
  | 'compile_context_menu'
  | 'test_groq_connection'
  | 'export_data'
  | 'submit_feedback'
  | 'log_error';

// ─── History Types ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  input: string;
  result: CompiledPrompt;
  timestamp: number;
  starred: boolean;
}

// ─── Feedback Types ───────────────────────────────────────────────────────────

export interface FeedbackEntry {
  historyId: string;
  isPositive: boolean;
  timestamp: number;
}

// ─── Request Types ────────────────────────────────────────────────────────────

export interface CompileRequest {
  action: 'compile';
  payload: { rawIdea: string };
}

export interface GetSettingsRequest {
  action: 'get_settings';
}

export interface UpdateSettingsRequest {
  action: 'update_settings';
  payload: Partial<UserSettings>;
}

export interface GetHistoryRequest {
  action: 'get_history';
}

export interface SearchHistoryRequest {
  action: 'search_history';
  payload: { query: string; domain?: DomainType; starredOnly?: boolean };
}

export interface ToggleStarHistoryRequest {
  action: 'toggle_star_history';
  payload: { id: string };
}

export interface ClearHistoryRequest {
  action: 'clear_history';
}

export interface InsertPromptRequest {
  action: 'insert_prompt';
  payload: { text: string; submit?: boolean };
}

export interface CompileContextMenuRequest {
  action: 'compile_context_menu';
  payload: { text: string };
}

export interface TestGroqConnectionRequest {
  action: 'test_groq_connection';
}

export interface ExportDataRequest {
  action: 'export_data';
}


export interface SubmitFeedbackRequest {
  action: 'submit_feedback';
  payload: { historyId: string; isPositive: boolean };
}

export interface LogErrorRequest {
  action: 'log_error';
  payload: { source: string; code: string; message: string; context?: Record<string, unknown> };
}

export type ExtensionRequest =
  | CompileRequest
  | GetSettingsRequest
  | UpdateSettingsRequest
  | GetHistoryRequest
  | SearchHistoryRequest
  | ToggleStarHistoryRequest
  | ClearHistoryRequest
  | InsertPromptRequest
  | CompileContextMenuRequest
  | TestGroqConnectionRequest
  | ExportDataRequest
  | SubmitFeedbackRequest
  | LogErrorRequest;

// ─── Response Types ───────────────────────────────────────────────────────────

export interface CompileSuccessResponse {
  success: true;
  data: CompiledPrompt;
}

export interface CompileErrorResponse {
  success: false;
  error: { code: string; message: string };
}

export interface SettingsResponse {
  success: true;
  settings: UserSettings;
}

export interface HistoryResponse {
  success: true;
  history: HistoryEntry[];
}

export interface GenericSuccessResponse {
  success: true;
}

export interface TestConnectionResponse {
  success: true;
  connected: boolean;
}

export interface ExportDataResponse {
  success: true;
  data: string;
}


export type ExtensionResponse =
  | CompileSuccessResponse
  | CompileErrorResponse
  | SettingsResponse
  | HistoryResponse
  | GenericSuccessResponse
  | TestConnectionResponse
  | ExportDataResponse;

// ─── Settings Type ────────────────────────────────────────────────────────────

export interface UserSettings {
  defaultAudienceLevel: AudienceLevel;
  preferredDomain: DomainType | null;
  theme: 'light' | 'dark' | 'system';
  enableContentScript: boolean;
  keyboardShortcut: string;
  onboardingComplete: boolean;
  enableContextMenu: boolean;
  enableSidePanel: boolean;
  groqApiKey: string;
  llmEnabled: boolean;
  llmModel: string;
  compileTimeoutMs: number;
}
