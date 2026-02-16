/**
 * Mock PE Accounting adapter.
 *
 * Simulates the PE Accounting REST API v1:
 *   - Auth: API Token via X-Token header
 *   - Endpoint: POST /api/v1/company/{companyId}/timeregistration
 *   - Body: XML (user-id, date, hours, project-id, activity-id, comment, invoiceable)
 *
 * PE Accounting uses XML, but for the mock we just log the fields.
 * The real adapter will need to build XML request bodies.
 *
 * Swap this file for the real implementation when API credentials are available.
 */

import {
  IntegrationAdapter,
  ProviderConfig,
  PEAccountingConfig,
  SyncTimeEntry,
  SyncResult,
  TestResult,
} from "../types.js";

function isPEConfig(c: ProviderConfig): c is PEAccountingConfig {
  return "apiToken" in c && "companyId" in c;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class PEAccountingMockAdapter implements IntegrationAdapter {
  readonly provider = "pe_accounting" as const;

  async testConnection(config: ProviderConfig): Promise<TestResult> {
    if (!isPEConfig(config)) {
      return { success: false, message: "Invalid PE Accounting configuration" };
    }
    if (!config.apiToken) {
      return { success: false, message: "API Token is required" };
    }
    if (!config.companyId) {
      return { success: false, message: "Company ID is required" };
    }

    // Simulate GET /api/v1/company/{companyId} with X-Token header
    await delay(500);

    console.log(
      `[PE Accounting Mock] GET /api/v1/company/${config.companyId} → X-Token: ${config.apiToken.slice(0, 8)}...`
    );

    return {
      success: true,
      message: `Connected to PE Accounting company ${config.companyId} (mock). API token valid.`,
    };
  }

  async syncTimeEntries(config: ProviderConfig, entries: SyncTimeEntry[]): Promise<SyncResult> {
    if (!isPEConfig(config)) {
      return { success: false, entriesSynced: 0, message: "Invalid PE Accounting configuration" };
    }
    if (!config.apiToken) {
      return { success: false, entriesSynced: 0, message: "Missing API token" };
    }
    if (entries.length === 0) {
      return { success: true, entriesSynced: 0, message: "No entries to sync" };
    }

    // Simulate POST /api/v1/company/{companyId}/timeregistration (XML body)
    const failedEntryIds: string[] = [];
    let synced = 0;

    for (const entry of entries) {
      await delay(120);

      if (Math.random() < 0.05) {
        failedEntryIds.push(entry.projectId);
        console.log(
          `[PE Accounting Mock] FAILED to sync entry: ${entry.date} ${entry.hours}h "${entry.projectName}"`
        );
        continue;
      }

      // Log the XML-like payload we'd send
      console.log(
        `[PE Accounting Mock] POST /api/v1/company/${config.companyId}/timeregistration → ` +
          `<user-id>${entry.externalEmployeeId}</user-id> ` +
          `<date>${entry.date}</date> ` +
          `<hours>${entry.hours}</hours> ` +
          `<comment>${entry.note || ""}</comment>`
      );
      synced++;
    }

    const allOk = failedEntryIds.length === 0;
    return {
      success: allOk,
      entriesSynced: synced,
      message: allOk
        ? `Synced ${synced} entries to PE Accounting (mock)`
        : `Synced ${synced}/${entries.length} entries — ${failedEntryIds.length} failed`,
      failedEntryIds: failedEntryIds.length > 0 ? failedEntryIds : undefined,
    };
  }
}
