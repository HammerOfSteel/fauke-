/**
 * Integration adapter interface and shared types.
 *
 * Every external system (Fortnox, Visma, PE Accounting) implements
 * `IntegrationAdapter`. During development we use mock adapters that
 * simulate the real API responses, making the switch to production
 * a matter of swapping the adapter implementation.
 */

export type ProviderKey = "fortnox" | "visma" | "pe_accounting";

/** Configuration stored per-provider in `Integration.config` (JSON column). */
export interface FortnoxConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  /** Fortnox scopes the integration needs */
  scopes?: string[];
}

export interface VismaConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  /** "payroll" or "bookkeeping" target flow */
  targetApi: "payroll" | "bookkeeping";
}

export interface PEAccountingConfig {
  apiToken: string;
  companyId: string;
}

export type ProviderConfig = FortnoxConfig | VismaConfig | PEAccountingConfig;

/** Normalised time-entry payload sent to adapters for syncing. */
export interface SyncTimeEntry {
  date: string;          // YYYY-MM-DD
  hours: number;
  projectName: string;
  projectId: string;
  note: string | null;
  externalEmployeeId: string;  // The user's ID in the external system
}

/** Result of a single sync batch. */
export interface SyncResult {
  success: boolean;
  entriesSynced: number;
  message?: string;
  /** IDs of entries that failed (for partial syncs). */
  failedEntryIds?: string[];
}

/** Result of a connection test. */
export interface TestResult {
  success: boolean;
  message: string;
}

/**
 * Every integration provider must implement this interface.
 * The `config` parameter is the provider-specific JSON from the DB.
 */
export interface IntegrationAdapter {
  readonly provider: ProviderKey;

  /** Verify that the stored credentials / tokens work. */
  testConnection(config: ProviderConfig): Promise<TestResult>;

  /** Push a batch of time entries to the external system. */
  syncTimeEntries(config: ProviderConfig, entries: SyncTimeEntry[]): Promise<SyncResult>;
}
