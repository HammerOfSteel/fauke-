import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

export const adminRouter = Router();

// List all users with roles and assigned projects
adminRouter.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        projects: {
          select: {
            project: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Flatten the project relation
    const result = users.map((u) => ({
      ...u,
      projects: u.projects.map((up) => up.project),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a new user
adminRouter.post("/users", async (req, res) => {
  try {
    const { username, password, displayName, role, projectIds } = req.body;

    if (!username || !password || !displayName) {
      res.status(400).json({ error: "Username, password, and display name are required" });
      return;
    }

    if (role && !["admin", "user"].includes(role)) {
      res.status(400).json({ error: "Role must be 'admin' or 'user'" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        displayName,
        role: role || "user",
        projects: projectIds?.length
          ? {
              create: projectIds.map((projectId: string) => ({ projectId })),
            }
          : undefined,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        projects: {
          select: {
            project: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      ...user,
      projects: user.projects.map((up) => up.project),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update a user (role, displayName, project assignments, optional password)
adminRouter.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, role, projectIds, password } = req.body;

    if (role && !["admin", "user"].includes(role)) {
      res.status(400).json({ error: "Role must be 'admin' or 'user'" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Update user fields
    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update project assignments if provided
    if (projectIds !== undefined) {
      // Remove existing assignments
      await prisma.userProject.deleteMany({ where: { userId: id } });
      // Create new assignments
      if (projectIds.length > 0) {
        await prisma.userProject.createMany({
          data: projectIds.map((projectId: string) => ({ userId: id, projectId })),
        });
      }
    }

    // Return updated user
    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        projects: {
          select: {
            project: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    res.json({
      ...updated,
      projects: updated!.projects.map((up) => up.project),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete a user
adminRouter.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user!.userId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});
