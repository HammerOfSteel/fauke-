/**
 * Adapter registry — maps provider keys to adapter instances.
 *
 * Currently all adapters are mocks. When real credentials are available,
 * swap e.g. `FortnoxMockAdapter` → `FortnoxAdapter` (same interface).
 */

import { IntegrationAdapter, ProviderKey } from "./types.js";
import { FortnoxMockAdapter } from "./adapters/fortnox.mock.js";
import { VismaMockAdapter } from "./adapters/visma.mock.js";
import { PEAccountingMockAdapter } from "./adapters/pe-accounting.mock.js";

const adapters: Record<ProviderKey, IntegrationAdapter> = {
  fortnox: new FortnoxMockAdapter(),
  visma: new VismaMockAdapter(),
  pe_accounting: new PEAccountingMockAdapter(),
};

export function getAdapter(provider: ProviderKey): IntegrationAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unknown integration provider: ${provider}`);
  }
  return adapter;
}

/** All supported provider keys. */
export const PROVIDERS: { key: ProviderKey; label: string; description: string }[] = [
  {
    key: "fortnox",
    label: "Fortnox",
    description: "Sweden's most popular cloud accounting platform. OAuth 2.0 auth, JSON REST API.",
  },
  {
    key: "visma",
    label: "Visma",
    description:
      "Visma eEkonomi / Lön Smart — payroll or invoicing integration. OAuth 2.0 auth, JSON REST API.",
  },
  {
    key: "pe_accounting",
    label: "PE Accounting",
    description:
      "Cloud accounting for consultancies & agencies. API token auth, XML REST API.",
  },
];

/** Returns the config field schema for a provider (used by the admin UI). */
export function getConfigFields(
  provider: ProviderKey
): { key: string; label: string; type: "text" | "password" | "select"; options?: string[]; required: boolean }[] {
  switch (provider) {
    case "fortnox":
      return [
        { key: "clientId", label: "Client ID", type: "text", required: true },
        { key: "clientSecret", label: "Client Secret", type: "password", required: true },
        { key: "accessToken", label: "Access Token", type: "password", required: false },
        { key: "refreshToken", label: "Refresh Token", type: "password", required: false },
      ];
    case "visma":
      return [
        { key: "clientId", label: "Client ID", type: "text", required: true },
        { key: "clientSecret", label: "Client Secret", type: "password", required: true },
        { key: "accessToken", label: "Access Token", type: "password", required: false },
        { key: "refreshToken", label: "Refresh Token", type: "password", required: false },
        {
          key: "targetApi",
          label: "Target API",
          type: "select",
          options: ["payroll", "bookkeeping"],
          required: true,
        },
      ];
    case "pe_accounting":
      return [
        { key: "apiToken", label: "API Token", type: "password", required: true },
        { key: "companyId", label: "Company ID", type: "text", required: true },
      ];
  }
}
