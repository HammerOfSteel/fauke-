import { useState } from "react";
import { Project } from "../types";
import * as api from "../api";
import { X, Plus, Pencil, Trash2, Check } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

interface ProjectManagerProps {
  projects: Project[];
  onClose: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function ProjectManager({
  projects: initialProjects,
  onClose,
  showToast,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const refresh = async () => {
    const p = await api.getProjects();
    setProjects(p);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createProject({ name: newName.trim(), color: newColor });
      setNewName("");
      showToast("Project created", "success");
      await refresh();
    } catch {
      showToast("Failed to create project", "error");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateProject(id, { name: editName, color: editColor });
      setEditingId(null);
      showToast("Project updated", "success");
      await refresh();
    } catch {
      showToast("Failed to update project", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project and all its time entries?")) return;
    try {
      await api.deleteProject(id);
      showToast("Project deleted", "success");
      await refresh();
    } catch {
      showToast("Failed to delete project", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold">Manage Projects</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Create form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New project name..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newColor === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>

          {/* Project list */}
          <div className="space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6 italic">
                No projects yet. Create your first one above!
              </p>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                {editingId === p.id ? (
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            editColor === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-900" : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(p.id)}
                      className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 text-green-500 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                        setEditColor(p.color);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
