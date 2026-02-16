/**
 * Mock Fortnox adapter.
 *
 * Simulates the Fortnox REST API v3:
 *   - Auth: OAuth 2.0 (access + refresh tokens)
 *   - Endpoint: POST /3/timereportings
 *   - Fields: EmployeeId, Date, Hours, ProjectId, CostCenter, ActivityCode
 *
 * The mock validates config shape and simulates realistic latency + responses.
 * Swap this file for the real implementation when API credentials are available.
 */

import {
  IntegrationAdapter,
  ProviderConfig,
  FortnoxConfig,
  SyncTimeEntry,
  SyncResult,
  TestResult,
} from "../types.js";

function isFortnoxConfig(c: ProviderConfig): c is FortnoxConfig {
  return "clientId" in c && "clientSecret" in c && !("companyId" in c) && !("targetApi" in c);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class FortnoxMockAdapter implements IntegrationAdapter {
  readonly provider = "fortnox" as const;

  async testConnection(config: ProviderConfig): Promise<TestResult> {
    if (!isFortnoxConfig(config)) {
      return { success: false, message: "Invalid Fortnox configuration" };
    }
    if (!config.clientId || !config.clientSecret) {
      return { success: false, message: "Client ID and Client Secret are required" };
    }

    // Simulate OAuth token validation
    await delay(600);

    // Mock: if accessToken is missing, pretend we need to re-auth
    if (!config.accessToken) {
      return {
        success: false,
        message: "No access token — user needs to re-authorize with Fortnox",
      };
    }

    // Simulate a GET /3/companyinformation call to verify the token
    await delay(400);

    return {
      success: true,
      message: `Connected to Fortnox — company verified (mock). Token valid.`,
    };
  }

  async syncTimeEntries(config: ProviderConfig, entries: SyncTimeEntry[]): Promise<SyncResult> {
    if (!isFortnoxConfig(config)) {
      return { success: false, entriesSynced: 0, message: "Invalid Fortnox configuration" };
    }
    if (!config.accessToken) {
      return { success: false, entriesSynced: 0, message: "Missing access token" };
    }
    if (entries.length === 0) {
      return { success: true, entriesSynced: 0, message: "No entries to sync" };
    }

    // Simulate POST /3/timereportings for each entry
    const failedEntryIds: string[] = [];
    let synced = 0;

    for (const entry of entries) {
      await delay(150); // Simulate network call per entry

      // Mock: ~5% random failure rate to simulate real-world errors
      if (Math.random() < 0.05) {
        failedEntryIds.push(entry.projectId);
        console.log(
          `[Fortnox Mock] FAILED to sync entry: ${entry.date} ${entry.hours}h "${entry.projectName}"`
        );
        continue;
      }

      console.log(
        `[Fortnox Mock] POST /3/timereportings → EmployeeId=${entry.externalEmployeeId}, ` +
          `Date=${entry.date}, Hours=${entry.hours}, Project="${entry.projectName}"`
      );
      synced++;
    }

    const allOk = failedEntryIds.length === 0;
    return {
      success: allOk,
      entriesSynced: synced,
      message: allOk
        ? `Synced ${synced} entries to Fortnox (mock)`
        : `Synced ${synced}/${entries.length} entries — ${failedEntryIds.length} failed`,
      failedEntryIds: failedEntryIds.length > 0 ? failedEntryIds : undefined,
    };
  }
}
