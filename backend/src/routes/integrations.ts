/**
 * Admin routes for managing integrations.
 *
 * All routes are protected by authMiddleware + adminMiddleware (mounted in index.ts).
 */

import { Router } from "express";
import { prisma } from "../db.js";
import { getAdapter, PROVIDERS, getConfigFields } from "../integrations/registry.js";
import { ProviderKey, ProviderConfig, SyncTimeEntry } from "../integrations/types.js";

export const integrationRouter = Router();

// ─── Providers metadata (what the admin UI uses to render forms) ───
integrationRouter.get("/providers", (_req, res) => {
  const providers = PROVIDERS.map((p) => ({
    ...p,
    configFields: getConfigFields(p.key),
  }));
  res.json(providers);
});

// ─── List all integrations ───
integrationRouter.get("/", async (_req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      include: {
        users: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
          },
        },
        _count: { select: { syncLogs: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Strip sensitive config values for the listing
    const safe = integrations.map((i: typeof integrations[number]) => ({
      ...i,
      config: maskConfig(i.config as Record<string, unknown>),
      users: i.users.map((ui: typeof i.users[number]) => ({
        id: ui.id,
        externalId: ui.externalId,
        user: ui.user,
      })),
    }));

    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch integrations" });
  }
});

// ─── Get single integration (full config for editing) ───
integrationRouter.get("/:id", async (req, res) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    });

    if (!integration) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }

    res.json({
      ...integration,
      users: integration.users.map((ui: typeof integration.users[number]) => ({
        id: ui.id,
        externalId: ui.externalId,
        user: ui.user,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch integration" });
  }
});

// ─── Create integration ───
integrationRouter.post("/", async (req, res) => {
  try {
    const { provider, name, config } = req.body;

    if (!provider || !name || !config) {
      res.status(400).json({ error: "Provider, name, and config are required" });
      return;
    }

    if (!PROVIDERS.find((p) => p.key === provider)) {
      res.status(400).json({ error: `Unknown provider: ${provider}` });
      return;
    }

    const integration = await prisma.integration.create({
      data: { provider, name, config },
    });

    res.status(201).json(integration);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create integration" });
  }
});

// ─── Update integration ───
integrationRouter.put("/:id", async (req, res) => {
  try {
    const { name, config, enabled } = req.body;

    const existing = await prisma.integration.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (config !== undefined) data.config = config;
    if (enabled !== undefined) data.enabled = enabled;

    const updated = await prisma.integration.update({
      where: { id: req.params.id },
      data,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update integration" });
  }
});

// ─── Delete integration ───
integrationRouter.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.integration.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }

    await prisma.integration.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete integration" });
  }
});

// ─── Test connection ───
integrationRouter.post("/:id/test", async (req, res) => {
  try {
    const integration = await prisma.integration.findUnique({ where: { id: req.params.id } });
    if (!integration) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }

    const adapter = getAdapter(integration.provider as ProviderKey);
    const result = await adapter.testConnection(integration.config as unknown as ProviderConfig);

    // Log the test
    await prisma.syncLog.create({
      data: {
        integrationId: integration.id,
        status: result.success ? "success" : "error",
        message: `Connection test: ${result.message}`,
      },
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to test connection" });
  }
});

// ─── Assign users to integration ───
integrationRouter.post("/:id/users", async (req, res) => {
  try {
    const { userId, externalId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const integration = await prisma.integration.findUnique({ where: { id: req.params.id } });
    if (!integration) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }

    const assignment = await prisma.userIntegration.upsert({
      where: {
        userId_integrationId: { userId, integrationId: req.params.id },
      },
      create: {
        userId,
        integrationId: req.params.id,
        externalId: externalId || null,
      },
      update: {
        externalId: externalId || null,
      },
      include: {
        user: { select: { id: true, displayName: true, username: true } },
      },
    });

    res.json({
      id: assignment.id,
      externalId: assignment.externalId,
      user: assignment.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to assign user" });
  }
});

// ─── Remove user from integration ───
integrationRouter.delete("/:id/users/:userId", async (req, res) => {
  try {
    await prisma.userIntegration.delete({
      where: {
        userId_integrationId: {
          userId: req.params.userId,
          integrationId: req.params.id,
        },
      },
    });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove user assignment" });
  }
});

// ─── Sync time entries for a specific user ───
integrationRouter.post("/:id/sync", async (req, res) => {
  try {
    const { userId, from, to } = req.body;

    if (!userId || !from || !to) {
      res.status(400).json({ error: "userId, from, and to dates are required" });
      return;
    }

    const integration = await prisma.integration.findUnique({ where: { id: req.params.id } });
    if (!integration) {
      res.status(404).json({ error: "Integration not found" });
      return;
    }

    // Get the user's external ID for this integration
    const userIntegration = await prisma.userIntegration.findUnique({
      where: {
        userId_integrationId: { userId, integrationId: req.params.id },
      },
    });
    if (!userIntegration) {
      res.status(400).json({ error: "User is not assigned to this integration" });
      return;
    }
    if (!userIntegration.externalId) {
      res.status(400).json({ error: "User has no external ID configured for this integration" });
      return;
    }

    // Fetch time entries
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: { project: true },
      orderBy: { date: "asc" },
    });

    // Map to sync format
    const syncEntries: SyncTimeEntry[] = entries.map((e: typeof entries[number]) => ({
      date: new Date(e.date).toISOString().split("T")[0],
      hours: Number(e.hours),
      projectName: e.project.name,
      projectId: e.projectId,
      note: e.note,
      externalEmployeeId: userIntegration.externalId!,
    }));

    // Execute sync
    const adapter = getAdapter(integration.provider as ProviderKey);
    const result = await adapter.syncTimeEntries(
      integration.config as unknown as ProviderConfig,
      syncEntries
    );

    // Log result
    await prisma.syncLog.create({
      data: {
        integrationId: integration.id,
        userId,
        status: result.success ? "success" : result.entriesSynced > 0 ? "partial" : "error",
        message: result.message || null,
        entriesSynced: result.entriesSynced,
      },
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync entries" });
  }
});

// ─── Get sync logs for an integration ───
integrationRouter.get("/:id/logs", async (req, res) => {
  try {
    const logs = await prisma.syncLog.findMany({
      where: { integrationId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sync logs" });
  }
});

// ─── Helpers ───

/** Mask sensitive values in config for listing responses. */
function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["clientSecret", "accessToken", "refreshToken", "apiToken"];
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (sensitiveKeys.includes(key) && typeof value === "string" && value.length > 0) {
      masked[key] = value.slice(0, 4) + "••••••••";
    } else {
      masked[key] = value;
    }
  }
  return masked;
}
