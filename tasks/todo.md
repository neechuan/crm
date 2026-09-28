# Task List: Personal CRM

## Phase 1: Running Skeleton and Data
- [ ] Task 1.1: Project initialization (`package.json`, Vite, React, TypeScript, dependencies, Vitest setup)
- [ ] Task 1.2: SQLite database schema and migration layer (`src/server/db.ts`)
- [ ] Task 1.3: Realistic sample data seed generator (`src/server/seed.ts`)
- [ ] Task 1.4: Core CRUD API routes and Vite server middleware (`src/server/api.ts`, `vite-plugin-crm-api.ts`)
- [ ] Task 1.5: Unit tests for creating, reading, updating, and deleting all four record types (`tests/db.test.ts`)
- [ ] Task 1.6: Base layout with 5 navigation sections (Dashboard, Organizations, Contacts, Deals, Pipeline)

## Checkpoint: Phase 1
- [ ] All database unit tests pass (`npm run test`)
- [ ] App launches with one command (`npm run dev`) and opens in browser
- [ ] Database automatically populates with realistic sample data
- [ ] All 5 navigation sections render

## Phase 2: Organizations and Contacts
- [ ] Task 2.1: Organizations table view with search, add, edit, and delete
- [ ] Task 2.2: Organization detail view displaying related contacts and deals
- [ ] Task 2.3: Contacts table view with search (name, email), status filter (lead/qualified/customer), add, edit, and delete
- [ ] Task 2.4: Contact detail view displaying organization and activity timeline
- [ ] Task 2.5: Unit tests for Organizations & Contacts add/edit/delete/search and status filtering (`tests/orgs-contacts.test.ts`)

## Checkpoint: Phase 2
- [ ] Organizations and Contacts tables display sample data
- [ ] Adding, editing, and deleting persists across refresh
- [ ] Search works in both tables; Contacts status filter works
- [ ] Detail pages show relationships accurately
- [ ] Unit tests pass

## Phase 3: Deals and Pipeline
- [ ] Task 3.1: Deals table view with search, add, edit, and delete
- [ ] Task 3.2: Deal detail view showing stage, value, close date, organization, primary contact, and activities
- [ ] Task 3.3: Visual Pipeline board with 6 columns (New, Qualified, Proposal, Negotiation, Won, Lost)
- [ ] Task 3.4: Drag-and-drop interaction with stage persistence and column totals + expected revenue updates
- [ ] Task 3.5: Unit tests for deal stage updates, Won/Lost handling, and revenue calculations (`tests/deals-pipeline.test.ts`)

## Checkpoint: Phase 3
- [ ] Deals table functions with add/edit/delete/search
- [ ] Pipeline displays 6 columns with deal cards
- [ ] Dragging deal card updates stage and persists after refresh
- [ ] Column total and expected revenue update immediately
- [ ] Unit tests pass

## Phase 4: Activities and Tasks
- [ ] Task 4.1: Activity logging modal/form on Contact and Deal detail pages (note, call, email, optional due date)
- [ ] Task 4.2: Activity timeline on Contact and Deal detail views (newest first)
- [ ] Task 4.3: Task completion toggle (done/not-done) with persistence
- [ ] Task 4.4: Unit tests for adding activities and toggling task completion (`tests/activities.test.ts`)

## Checkpoint: Phase 4
- [ ] Activity can be logged on Contact and Deal detail pages
- [ ] Activities appear in timeline (newest first)
- [ ] Task completion toggle works and persists across refresh
- [ ] Unit tests pass

## Phase 5: Dashboard
- [ ] Task 5.1: Dashboard KPI cards (Deals Won, Revenue Won, Pipeline Value, Expected Revenue, Pending Follow-ups)
- [ ] Task 5.2: Monthly charts for deals won and revenue won
- [ ] Task 5.3: Pipeline stage breakdown visualization with expected revenue calculations
- [ ] Task 5.4: Recent activity feed across all contacts and deals
- [ ] Task 5.5: Upcoming and overdue tasks list with direct completion toggle
- [ ] Task 5.6: Unit tests for dashboard metrics (`tests/dashboard.test.ts`)

## Checkpoint: Phase 5
- [ ] Dashboard is the landing page
- [ ] Monthly won deals & revenue charts render accurate data
- [ ] Pipeline visual displays expected revenue
- [ ] Recent activity feed and task lists update after changes
- [ ] Unit tests pass

## Phase 6: Look and Feel & End-to-End Validation
- [ ] Task 6.1: Visual styling audit: brand colors (`#ecad0a`, `#209dd7`, `#753991`, grays), clean typography, modern layout
- [ ] Task 6.2: Banned element verification: no background gradients, no purple backgrounds, no gradient buttons, no single-side accent border lines
- [ ] Task 6.3: End-to-end browser walkthrough: test all 5 sections, mutations, drag & drop, task toggles
- [ ] Task 6.4: Zero console errors verified during walkthrough; documentation updated
