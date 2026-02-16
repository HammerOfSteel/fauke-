/**
 * Mock Visma adapter.
 *
 * Simulates the Visma Payroll API (Visma Lön Smart):
 *   - Auth: OAuth 2.0 (client_id + client_secret → bearer token)
 *   - Identity server: https://identity.vismaonline.com
 *   - Endpoint: POST /v2/shortcuts/hoursworked
 *   - Scopes: vls:api, offline_access
 *
 * Also partially supports the Bookkeeping & Invoicing API for invoice drafts.
 *
 * Swap this file for the real implementation when credentials are available.
 */

import {
  IntegrationAdapter,
  ProviderConfig,
  VismaConfig,
  SyncTimeEntry,
  SyncResult,
  TestResult,
} from "../types.js";

function isVismaConfig(c: ProviderConfig): c is VismaConfig {
  return "clientId" in c && "targetApi" in c;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class VismaMockAdapter implements IntegrationAdapter {
  readonly provider = "visma" as const;

  async testConnection(config: ProviderConfig): Promise<TestResult> {
    if (!isVismaConfig(config)) {
      return { success: false, message: "Invalid Visma configuration" };
    }
    if (!config.clientId || !config.clientSecret) {
      return { success: false, message: "Client ID and Client Secret are required" };
    }

    // Simulate OAuth token exchange
    await delay(700);

    if (!config.accessToken) {
      return {
        success: false,
        message: "No access token — user needs to authorize via Visma identity server",
      };
    }

    // Simulate a test call to the selected API
    await delay(400);
    const apiLabel = config.targetApi === "payroll" ? "Visma Lön Smart (Payroll)" : "Visma eEkonomi (Bookkeeping)";

    return {
      success: true,
      message: `Connected to ${apiLabel} (mock). Bearer token valid.`,
    };
  }

  async syncTimeEntries(config: ProviderConfig, entries: SyncTimeEntry[]): Promise<SyncResult> {
    if (!isVismaConfig(config)) {
      return { success: false, entriesSynced: 0, message: "Invalid Visma configuration" };
    }
    if (!config.accessToken) {
      return { success: false, entriesSynced: 0, message: "Missing access token" };
    }
    if (entries.length === 0) {
      return { success: true, entriesSynced: 0, message: "No entries to sync" };
    }

    const failedEntryIds: string[] = [];
    let synced = 0;

    if (config.targetApi === "payroll") {
      // Simulate POST /v2/shortcuts/hoursworked per entry
      for (const entry of entries) {
        await delay(180);

        if (Math.random() < 0.05) {
          failedEntryIds.push(entry.projectId);
          console.log(
            `[Visma Mock] FAILED to sync entry: ${entry.date} ${entry.hours}h "${entry.projectName}"`
          );
          continue;
        }

        console.log(
          `[Visma Mock] POST /v2/shortcuts/hoursworked → EmployeeId=${entry.externalEmployeeId}, ` +
            `Date=${entry.date}, Hours=${entry.hours}`
        );
        synced++;
      }
    } else {
      // Bookkeeping: batch into an invoice draft with time line items
      await delay(500);

      const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
      synced = entries.length;

      console.log(
        `[Visma Mock] POST /v2/customerinvoicedrafts → ${entries.length} line items, ` +
          `${totalHours}h total (mock invoice draft created)`
      );
    }

    const allOk = failedEntryIds.length === 0;
    return {
      success: allOk,
      entriesSynced: synced,
      message: allOk
        ? `Synced ${synced} entries to Visma (mock)`
        : `Synced ${synced}/${entries.length} entries — ${failedEntryIds.length} failed`,
      failedEntryIds: failedEntryIds.length > 0 ? failedEntryIds : undefined,
    };
  }
}
