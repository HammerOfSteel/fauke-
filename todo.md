# Fauke — Development TODO

## MVP 1.0

### Infrastructure
- [x] Docker Compose (frontend + backend + postgres)
- [x] Vite + React + TypeScript frontend scaffold
- [x] Express + TypeScript backend scaffold
- [x] Prisma schema + migrations
- [x] Hot-reload in dev containers

### Backend API
- [x] `GET /api/projects` — list projects
- [x] `POST /api/projects` — create project
- [x] `PUT /api/projects/:id` — update project
- [x] `DELETE /api/projects/:id` — delete project
- [x] `GET /api/entries?from=&to=` — list entries in range
- [x] `POST /api/entries` — create entry
- [x] `PUT /api/entries/:id` — update entry
- [x] `DELETE /api/entries/:id` — delete entry
- [x] `GET /api/export/csv?from=&to=` — CSV download
- [x] `GET /api/export/pdf?from=&to=` — PDF download

### Frontend — Calendar View
- [x] Monthly calendar grid
- [x] Day cells show hours per project (color-coded chips)
- [x] Click day → slide-over / modal to add/edit entries
- [x] Navigate months (prev / next / today)
- [x] Total hours per week shown in sidebar or row

### Frontend — Table View
- [x] Spreadsheet-style grid: rows = days, columns = projects
- [x] Inline editable cells
- [x] Auto-sum row (daily total) and column (project total)
- [x] Date range picker to control visible rows

### Export
- [x] CSV export button (downloads file)
- [x] PDF export button (downloads styled report)
- [x] Date range selector for export scope

### Design / UX
- [x] Tailwind-based dark + light theme
- [x] Responsive layout (desktop-first, usable on tablet)
- [x] Smooth transitions between Calendar ↔ Table views
- [x] Toast notifications for save / delete / errors

---

## v2.0 — Plugin System (future)
- [ ] Define plugin interface (`IFaukePlugin`)
- [ ] Plugin registry & config UI
- [ ] Example: generic REST POST plugin
- [ ] Example: CSV-upload plugin
- [ ] Example: Jira Tempo plugin
- [ ] Plugin execution log / history

## v3.0 — Multi-user (future)
- [ ] Auth system (OAuth2 / magic link)
- [ ] User settings page
- [ ] Team / org support
- [ ] Approval workflows
