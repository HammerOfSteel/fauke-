import { useState } from "react";
import { Project, TimeEntry } from "../types";
import { X, Trash2 } from "lucide-react";

interface EntryModalProps {
  date: string;
  entry: TimeEntry | null;
  projects: Project[];
  onSave: (data: { date: string; hours: number; note?: string; projectId: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function EntryModal({
  date,
  entry,
  projects,
  onSave,
  onDelete,
  onClose,
}: EntryModalProps) {
  const [projectId, setProjectId] = useState(entry?.projectId || projects[0]?.id || "");
  const [hours, setHours] = useState(entry ? String(Number(entry.hours)) : "8");
  const [note, setNote] = useState(entry?.note || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !hours) return;
    onSave({
      date,
      hours: parseFloat(hours),
      note: note || undefined,
      projectId,
    });
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold">
              {entry ? "Edit Entry" : "Log Time"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Project */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Project
            </label>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No projects yet. Create one first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectId(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      projectId === p.id
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hours */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Hours
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 4, 6, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(String(h))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    hours === String(h)
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {h}h
                </button>
              ))}
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                step="0.5"
                min="0"
                max="24"
                className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Note <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!projectId || !hours}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                style={
                  selectedProject
                    ? { backgroundColor: selectedProject.color }
                    : undefined
                }
              >
                {entry ? "Update" : "Log Time"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
