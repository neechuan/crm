# Implementation Plan: Personal CRM

## Overview
Personal CRM is a fast, professional, single-user sales CRM running completely locally on the user's machine without accounts or cloud dependencies. It provides 5 core sections: Dashboard, Organizations, Contacts, Deals, and a visual drag-and-drop Pipeline board, powered by SQLite and a React + Vite + TypeScript frontend.

## Architecture Decisions
1. **Frontend**: Vite + React + TypeScript + Vanilla CSS design tokens + `lucide-react` for icons + `react-router-dom` for navigation + `recharts` for charts + `@hello-pangea/dnd` for pipeline kanban drag-and-drop.
2. **Backend & Persistence**: Local SQLite file (`crm.sqlite`), managed via Node's native `DatabaseSync` (`node:sqlite`) with zero external native compilation requirements.
3. **Single Command Run**: Custom Vite middleware plugin (`vite-plugin-crm-api.ts`) mounting the REST API router directly in Vite dev and preview servers with `host: 0.0.0.0` for Docker/devcontainer port forwarding. `npm run dev` or `npm start` serves both the API and client in a single command.
4. **Design System & Banned Element Compliance**:
   - Palette: `#ecad0a` (amber), `#209dd7` (blue), `#753991` (purple), and neutral grays (`#0f172a`, `#334155`, `#e2e8f0`, `#f8fafc`).
   - Strict adherence to AGENTS.md rules: NO background gradients, NO purple backgrounds, NO buttons with gradients, NO single-side accent border lines on panels/cards.
5. **Testing**: Vitest test suites covering:
   - Database operations and CRUD for all 4 record types (Organizations, Contacts, Deals, Activities)
   - Search and filtering (Contacts status filter, multi-field search)
   - Deal pipeline stage transitions and column totals/expected revenue updates
   - Activity logging and task completion toggles
   - Dashboard metric calculations
   - Real browser end-to-end verification via Chrome DevTools MCP and browser subagent.

## Task List

### Phase 1: Running Skeleton and Data
- [ ] Task 1.1: Project initialization (package.json, Vite, React, TypeScript, dependencies, Vitest configuration)
- [ ] Task 1.2: SQLite database schema and migration layer (`db/schema.ts`, `db/index.ts`)
- [ ] Task 1.3: Realistic sample data seed generator (`db/seed.ts`)
- [ ] Task 1.4: Core CRUD API routes and Vite server middleware (`server/api.ts`, `vite-plugin-crm-api.ts`)
- [ ] Task 1.5: Unit tests for creating, reading, updating, and deleting all four record types (`tests/db.test.ts`)
- [ ] Task 1.6: Base layout with 5 navigation sections (Dashboard, Organizations, Contacts, Deals, Pipeline)

### Phase 2: Organizations and Contacts
- [ ] Task 2.1: Organizations table view with search, add, edit, and delete modals/actions
- [ ] Task 2.2: Organization detail view displaying related contacts and deals
- [ ] Task 2.3: Contacts table view with search (name, email), status filter (lead/qualified/customer), add, edit, and delete
- [ ] Task 2.4: Contact detail view displaying organization and activity timeline
- [ ] Task 2.5: Unit tests for Organizations & Contacts add/edit/delete/search and status filtering (`tests/orgs-contacts.test.ts`)

### Phase 3: Deals and Pipeline
- [ ] Task 3.1: Deals table view with search, add, edit, and delete
- [ ] Task 3.2: Deal detail view showing stage, value, close date, organization, primary contact, and activities
- [ ] Task 3.3: Visual Pipeline board with 6 columns (New, Qualified, Proposal, Negotiation, Won, Lost), deal cards, and column value + expected revenue headers
- [ ] Task 3.4: Drag-and-drop interaction with `@hello-pangea/dnd` updating deal stage and persisting to SQLite
- [ ] Task 3.5: Unit tests for deal stage updates, Won/Lost handling, and revenue calculations (`tests/deals-pipeline.test.ts`)

### Phase 4: Activities and Tasks
- [ ] Task 4.1: Activity logger modal/form on Contact and Deal detail pages (note, call, email, optional due date)
- [ ] Task 4.2: Activity timeline component displayed chronologically (newest first)
- [ ] Task 4.3: Task completion toggle (done/not-done) with immediate persistence
- [ ] Task 4.4: Unit tests for adding activities and toggling task completion (`tests/activities.test.ts`)

### Phase 5: Dashboard
- [ ] Task 5.1: Dashboard summary metrics (total revenue won, expected pipeline revenue, active deals, follow-up counts)
- [ ] Task 5.2: Monthly charts for deals won and revenue won (`recharts`)
- [ ] Task 5.3: Pipeline stage breakdown visualization with expected revenue calculations
- [ ] Task 5.4: Recent activity feed across all contacts and deals
- [ ] Task 5.5: Upcoming and overdue tasks list with direct completion toggle

### Phase 6: Look and Feel & End-to-End Validation
- [ ] Task 6.1: Visual styling audit: verify brand colors (`#ecad0a`, `#209dd7`, `#753991`, grays), clean typography, responsiveness
- [ ] Task 6.2: Banned element verification: confirm absence of background gradients, purple backgrounds, gradient buttons, and single-side accent borders
- [ ] Task 6.3: End-to-end browser execution and walkthrough using browser automation: CRUD operations, drag-and-drop, activity logging, dashboard validation
- [ ] Task 6.4: Console error audit and final documentation in README.md

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Drag-and-drop layout jitter or horizontal overflow | Medium | Use tested `@hello-pangea/dnd` container configurations with flex layout and `overflow-x: auto` only when screen width requires it |
| Dev container network host binding | High | Explicitly bind Vite server to `0.0.0.0:5173` with CORS enabled so port mapping to host computer functions immediately |
| In-browser reload persistence | High | Store all mutations directly in SQLite database file, auto-seed only if DB has 0 records |
