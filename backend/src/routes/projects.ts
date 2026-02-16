import { Router } from "express";
import { prisma } from "../db.js";

export const projectRouter = Router();

// List all projects
projectRouter.get("/", async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { name: "asc" },
    });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create project
projectRouter.post("/", async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const project = await prisma.project.create({
      data: { name, color: color || "#6366f1" },
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
projectRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const project = await prisma.project.update({
      where: { id },
      data: { ...(name && { name }), ...(color && { color }) },
    });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
projectRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});
