export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  note: string | null;
  projectId: string;
  project: Project;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
  projects: Pick<Project, "id" | "name" | "color">[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type ViewMode = "calendar" | "table";

// ── Integrations ──────────────────────────────────────────

export type ProviderKey = "fortnox" | "visma" | "pe_accounting";

export interface ProviderInfo {
  key: ProviderKey;
  label: string;
  description: string;
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "select";
  options?: string[];
  required: boolean;
}

export interface IntegrationUser {
  id: string;
  externalId: string | null;
  user: Pick<AdminUser, "id" | "displayName" | "username">;
}

export interface Integration {
  id: string;
  provider: ProviderKey;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  users: IntegrationUser[];
  _count?: { syncLogs: number };
}

export interface SyncLog {
  id: string;
  integrationId: string;
  userId: string | null;
  status: "success" | "error" | "partial";
  message: string | null;
  entriesSynced: number;
  createdAt: string;
}

export interface TestResult {
  success: boolean;
  message: string;
}

export interface SyncResult {
  success: boolean;
  entriesSynced: number;
  message?: string;
}
