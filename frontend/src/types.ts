export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  note: string | null;
  projectId: string;
  project: Project;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
  projects: Pick<Project, "id" | "name" | "color">[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type ViewMode = "calendar" | "table";
