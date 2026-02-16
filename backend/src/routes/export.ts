import { Router } from "express";
import { prisma } from "../db.js";
import PDFDocument from "pdfkit";

export const exportRouter = Router();

// CSV export
exportRouter.get("/csv", async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user!.userId;
    const where: any = { userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { project: true },
      orderBy: { date: "asc" },
    });

    const header = "Date,Project,Hours,Note";
    const rows = entries.map((e) => {
      const date = new Date(e.date).toISOString().split("T")[0];
      const project = `"${e.project.name.replace(/"/g, '""')}"`;
      const note = e.note ? `"${e.note.replace(/"/g, '""')}"` : "";
      return `${date},${project},${e.hours},${note}`;
    });
    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=fauke-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

// PDF export
exportRouter.get("/pdf", async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user!.userId;
    const where: any = { userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from as string);
      if (to) where.date.lte = new Date(to as string);
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { project: true },
      orderBy: { date: "asc" },
    });

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=fauke-report-${new Date().toISOString().split("T")[0]}.pdf`
    );
    doc.pipe(res);

    // Title
    doc.fontSize(22).font("Helvetica-Bold").text("Fauke Time Report", {
      align: "center",
    });
    doc.moveDown(0.5);

    // Date range
    const fromStr = from ? String(from) : "beginning";
    const toStr = to ? String(to) : "now";
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#666")
      .text(`Period: ${fromStr} — ${toStr}`, { align: "center" });
    doc.moveDown(1.5);

    // Table header
    const tableTop = doc.y;
    const col = { date: 50, project: 160, hours: 370, note: 430 };

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#333");
    doc.text("Date", col.date, tableTop);
    doc.text("Project", col.project, tableTop);
    doc.text("Hours", col.hours, tableTop);
    doc.text("Note", col.note, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .strokeColor("#ddd")
      .stroke();

    let y = tableTop + 25;
    let totalHours = 0;

    doc.font("Helvetica").fontSize(9).fillColor("#444");

    for (const entry of entries) {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      const dateStr = new Date(entry.date).toISOString().split("T")[0];
      const hours = Number(entry.hours);
      totalHours += hours;

      doc.text(dateStr, col.date, y, { width: 100 });
      doc.text(entry.project.name, col.project, y, { width: 200 });
      doc.text(hours.toFixed(2), col.hours, y, { width: 50 });
      doc.text(entry.note || "", col.note, y, { width: 115 });
      y += 18;
    }

    // Total
    y += 10;
    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor("#ddd")
      .stroke();
    y += 10;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#333")
      .text(`Total: ${totalHours.toFixed(2)} hours`, col.hours - 60, y);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export PDF" });
  }
});
