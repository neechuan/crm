import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type {
  Organization,
  Contact,
  Deal,
  Activity,
  ContactStatus,
  DealStage,
  DashboardMetrics
} from '../types.ts';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'crm.sqlite');

export class CrmDatabase {
  public db: DatabaseSync;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.init();
  }

  private init() {
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        website TEXT,
        industry TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        job_title TEXT,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
        status TEXT NOT NULL CHECK(status IN ('lead', 'qualified', 'customer')) DEFAULT 'lead',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        stage TEXT NOT NULL CHECK(stage IN ('New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')) DEFAULT 'New',
        value REAL NOT NULL DEFAULT 0,
        probability INTEGER NOT NULL DEFAULT 50 CHECK(probability >= 0 AND probability <= 100),
        close_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('note', 'call', 'email')),
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        happened_at TEXT NOT NULL DEFAULT (datetime('now')),
        due_date TEXT,
        is_done INTEGER NOT NULL DEFAULT 0 CHECK(is_done IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
      CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(organization_id);
      CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
      CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
      CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
      CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
      CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_date);
    `);
  }

  // --- Organizations ---

  getAllOrganizations(search?: string): Organization[] {
    let sql = `
      SELECT o.*,
        (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) AS contacts_count,
        (SELECT COUNT(*) FROM deals d WHERE d.organization_id = o.id) AS deals_count
      FROM organizations o
    `;
    const params: (string | number | null)[] = [];
    if (search && search.trim() !== '') {
      sql += ` WHERE o.name LIKE ? OR o.industry LIKE ? OR o.notes LIKE ?`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    sql += ` ORDER BY o.name ASC`;
    return (this.db.prepare(sql).all as any)(...params) as Organization[];
  }

  getOrganizationById(id: number): (Organization & { contacts: Contact[]; deals: Deal[] }) | null {
    const org = this.db.prepare(`
      SELECT o.*,
        (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) AS contacts_count,
        (SELECT COUNT(*) FROM deals d WHERE d.organization_id = o.id) AS deals_count
      FROM organizations o
      WHERE o.id = ?
    `).get(id) as unknown as Organization | undefined;

    if (!org) return null;

    const contacts = this.db.prepare(`
      SELECT c.*, o.name AS organization_name
      FROM contacts c
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE c.organization_id = ?
      ORDER BY c.name ASC
    `).all(id) as unknown as Contact[];

    const deals = this.db.prepare(`
      SELECT d.*, o.name AS organization_name, c.name AS contact_name
      FROM deals d
      LEFT JOIN organizations o ON d.organization_id = o.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.organization_id = ?
      ORDER BY d.close_date DESC
    `).all(id) as unknown as Deal[];

    return { ...org, contacts, deals };
  }

  createOrganization(data: { name: string; website?: string | null; industry?: string | null; notes?: string | null }): Organization {
    const stmt = this.db.prepare(`
      INSERT INTO organizations (name, website, industry, notes)
      VALUES (?, ?, ?, ?)
    `);
    const res = stmt.run(data.name, data.website || null, data.industry || null, data.notes || null);
    return this.getOrganizationById(Number(res.lastInsertRowid)) as Organization;
  }

  updateOrganization(id: number, data: { name?: string; website?: string | null; industry?: string | null; notes?: string | null }): Organization | null {
    const current = this.getOrganizationById(id);
    if (!current) return null;

    const name = data.name !== undefined ? data.name : current.name;
    const website = data.website !== undefined ? data.website : current.website;
    const industry = data.industry !== undefined ? data.industry : current.industry;
    const notes = data.notes !== undefined ? data.notes : current.notes;

    this.db.prepare(`
      UPDATE organizations
      SET name = ?, website = ?, industry = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, website, industry, notes, id);

    return this.getOrganizationById(id) as Organization;
  }

  deleteOrganization(id: number): boolean {
    const res = this.db.prepare(`DELETE FROM organizations WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  // --- Contacts ---

  getAllContacts(search?: string, status?: string): Contact[] {
    let sql = `
      SELECT c.*, o.name AS organization_name
      FROM contacts c
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE 1=1
    `;
    const params: (string | number | null)[] = [];

    if (status && status !== 'all') {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.job_title LIKE ? OR o.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY c.name ASC`;
    return (this.db.prepare(sql).all as any)(...params) as Contact[];
  }

  getContactById(id: number): (Contact & { activities: Activity[]; deals: Deal[] }) | null {
    const contact = this.db.prepare(`
      SELECT c.*, o.name AS organization_name
      FROM contacts c
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = ?
    `).get(id) as unknown as Contact | undefined;

    if (!contact) return null;

    const activities = this.db.prepare(`
      SELECT a.*, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE a.contact_id = ?
      ORDER BY a.happened_at DESC, a.id DESC
    `).all(id) as unknown as Activity[];

    const deals = this.db.prepare(`
      SELECT d.*, o.name AS organization_name, c.name AS contact_name
      FROM deals d
      LEFT JOIN organizations o ON d.organization_id = o.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.contact_id = ?
      ORDER BY d.close_date DESC
    `).all(id) as unknown as Deal[];

    return { ...contact, activities, deals };
  }

  createContact(data: {
    name: string;
    email: string;
    phone?: string | null;
    job_title?: string | null;
    organization_id?: number | null;
    status?: ContactStatus;
  }): Contact {
    const stmt = this.db.prepare(`
      INSERT INTO contacts (name, email, phone, job_title, organization_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.name,
      data.email,
      data.phone || null,
      data.job_title || null,
      data.organization_id !== undefined ? data.organization_id : null,
      data.status || 'lead'
    );
    return this.getContactById(Number(res.lastInsertRowid)) as Contact;
  }

  updateContact(id: number, data: {
    name?: string;
    email?: string;
    phone?: string | null;
    job_title?: string | null;
    organization_id?: number | null;
    status?: ContactStatus;
  }): Contact | null {
    const current = this.getContactById(id);
    if (!current) return null;

    const name = data.name !== undefined ? data.name : current.name;
    const email = data.email !== undefined ? data.email : current.email;
    const phone = data.phone !== undefined ? data.phone : current.phone;
    const job_title = data.job_title !== undefined ? data.job_title : current.job_title;
    const organization_id = data.organization_id !== undefined ? data.organization_id : current.organization_id;
    const status = data.status !== undefined ? data.status : current.status;

    this.db.prepare(`
      UPDATE contacts
      SET name = ?, email = ?, phone = ?, job_title = ?, organization_id = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, email, phone, job_title, organization_id, status, id);

    return this.getContactById(id) as Contact;
  }

  deleteContact(id: number): boolean {
    const res = this.db.prepare(`DELETE FROM contacts WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  // --- Deals ---

  getAllDeals(search?: string, stage?: string): Deal[] {
    let sql = `
      SELECT d.*, o.name AS organization_name, c.name AS contact_name
      FROM deals d
      LEFT JOIN organizations o ON d.organization_id = o.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE 1=1
    `;
    const params: (string | number | null)[] = [];

    if (stage && stage !== 'all') {
      sql += ` AND d.stage = ?`;
      params.push(stage);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (d.name LIKE ? OR o.name LIKE ? OR c.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY d.close_date ASC, d.id ASC`;
    return (this.db.prepare(sql).all as any)(...params) as Deal[];
  }

  getDealById(id: number): (Deal & { activities: Activity[] }) | null {
    const deal = this.db.prepare(`
      SELECT d.*, o.name AS organization_name, c.name AS contact_name
      FROM deals d
      LEFT JOIN organizations o ON d.organization_id = o.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.id = ?
    `).get(id) as unknown as Deal | undefined;

    if (!deal) return null;

    const activities = this.db.prepare(`
      SELECT a.*, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE a.deal_id = ?
      ORDER BY a.happened_at DESC, a.id DESC
    `).all(id) as unknown as Activity[];

    return { ...deal, activities };
  }

  createDeal(data: {
    name: string;
    organization_id?: number | null;
    contact_id?: number | null;
    stage?: DealStage;
    value: number;
    probability?: number;
    close_date: string;
  }): Deal {
    const probability = data.probability !== undefined ? data.probability : 50;
    const stmt = this.db.prepare(`
      INSERT INTO deals (name, organization_id, contact_id, stage, value, probability, close_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.name,
      data.organization_id !== undefined ? data.organization_id : null,
      data.contact_id !== undefined ? data.contact_id : null,
      data.stage || 'New',
      data.value,
      probability,
      data.close_date
    );
    return this.getDealById(Number(res.lastInsertRowid)) as Deal;
  }

  updateDeal(id: number, data: {
    name?: string;
    organization_id?: number | null;
    contact_id?: number | null;
    stage?: DealStage;
    value?: number;
    probability?: number;
    close_date?: string;
  }): Deal | null {
    const current = this.getDealById(id);
    if (!current) return null;

    const name = data.name !== undefined ? data.name : current.name;
    const organization_id = data.organization_id !== undefined ? data.organization_id : current.organization_id;
    const contact_id = data.contact_id !== undefined ? data.contact_id : current.contact_id;
    const stage = data.stage !== undefined ? data.stage : current.stage;
    const value = data.value !== undefined ? data.value : current.value;
    const probability = data.probability !== undefined ? data.probability : current.probability;
    const close_date = data.close_date !== undefined ? data.close_date : current.close_date;

    this.db.prepare(`
      UPDATE deals
      SET name = ?, organization_id = ?, contact_id = ?, stage = ?, value = ?, probability = ?, close_date = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, organization_id, contact_id, stage, value, probability, close_date, id);

    return this.getDealById(id) as Deal;
  }

  updateDealStage(id: number, stage: DealStage): Deal | null {
    const current = this.getDealById(id);
    if (!current) return null;

    // Automatic probability adjustment for standard stages if desired, or keep specified
    let probability = current.probability;
    if (stage === 'Won') probability = 100;
    else if (stage === 'Lost') probability = 0;

    this.db.prepare(`
      UPDATE deals
      SET stage = ?, probability = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(stage, probability, id);

    return this.getDealById(id) as Deal;
  }

  deleteDeal(id: number): boolean {
    const res = this.db.prepare(`DELETE FROM deals WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  // --- Activities & Tasks ---

  getAllActivities(filters?: { contact_id?: number; deal_id?: number; limit?: number }): Activity[] {
    let sql = `
      SELECT a.*, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE 1=1
    `;
    const params: (string | number | null)[] = [];

    if (filters?.contact_id) {
      sql += ` AND a.contact_id = ?`;
      params.push(filters.contact_id);
    }
    if (filters?.deal_id) {
      sql += ` AND a.deal_id = ?`;
      params.push(filters.deal_id);
    }

    sql += ` ORDER BY a.happened_at DESC, a.id DESC`;

    if (filters?.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    return (this.db.prepare(sql).all as any)(...params) as Activity[];
  }

  getActivityById(id: number): Activity | null {
    const act = this.db.prepare(`
      SELECT a.*, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE a.id = ?
    `).get(id) as unknown as Activity | undefined;
    return act || null;
  }

  createActivity(data: {
    type: 'note' | 'call' | 'email';
    contact_id?: number | null;
    deal_id?: number | null;
    description: string;
    happened_at?: string;
    due_date?: string | null;
    is_done?: number;
  }): Activity {
    const happenedAt = data.happened_at || new Date().toISOString().replace('T', ' ').substring(0, 19);
    const stmt = this.db.prepare(`
      INSERT INTO activities (type, contact_id, deal_id, description, happened_at, due_date, is_done)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      data.type,
      data.contact_id !== undefined ? data.contact_id : null,
      data.deal_id !== undefined ? data.deal_id : null,
      data.description,
      happenedAt,
      data.due_date || null,
      data.is_done !== undefined ? data.is_done : 0
    );
    return this.getActivityById(Number(res.lastInsertRowid)) as Activity;
  }

  updateActivity(id: number, data: {
    type?: 'note' | 'call' | 'email';
    description?: string;
    due_date?: string | null;
    is_done?: number;
  }): Activity | null {
    const current = this.getActivityById(id);
    if (!current) return null;

    const type = data.type !== undefined ? data.type : current.type;
    const description = data.description !== undefined ? data.description : current.description;
    const due_date = data.due_date !== undefined ? data.due_date : current.due_date;
    const is_done = data.is_done !== undefined ? data.is_done : current.is_done;

    this.db.prepare(`
      UPDATE activities
      SET type = ?, description = ?, due_date = ?, is_done = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(type, description, due_date, is_done, id);

    return this.getActivityById(id);
  }

  toggleActivityDone(id: number): Activity | null {
    const current = this.getActivityById(id);
    if (!current) return null;

    const newDone = current.is_done === 1 ? 0 : 1;
    this.db.prepare(`
      UPDATE activities
      SET is_done = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newDone, id);

    return this.getActivityById(id);
  }

  deleteActivity(id: number): boolean {
    const res = this.db.prepare(`DELETE FROM activities WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  // --- Dashboard Aggregations ---

  getDashboardMetrics(): DashboardMetrics {
    // 1. Won deals & revenue totals
    const wonSummary = this.db.prepare(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(value), 0) AS total_revenue
      FROM deals
      WHERE stage = 'Won'
    `).get() as { total_count: number; total_revenue: number };

    // 2. Active pipeline total value & expected revenue (excluding Lost)
    const pipelineSummary = this.db.prepare(`
      SELECT
        COALESCE(SUM(value), 0) AS pipeline_value,
        COALESCE(SUM(value * probability / 100.0), 0) AS expected_revenue
      FROM deals
      WHERE stage NOT IN ('Won', 'Lost')
    `).get() as { pipeline_value: number; expected_revenue: number };

    // 3. Deals won per month (revenue and count)
    const wonByMonth = this.db.prepare(`
      SELECT
        strftime('%Y-%m', close_date) AS month,
        COUNT(*) AS count,
        COALESCE(SUM(value), 0) AS revenue
      FROM deals
      WHERE stage = 'Won'
      GROUP BY strftime('%Y-%m', close_date)
      ORDER BY month ASC
    `).all() as { month: string; count: number; revenue: number }[];

    // 4. Summaries by each stage
    const stages: DealStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const stageRows = this.db.prepare(`
      SELECT
        stage,
        COUNT(*) AS count,
        COALESCE(SUM(value), 0) AS totalValue,
        COALESCE(SUM(value * probability / 100.0), 0) AS expectedRevenue
      FROM deals
      GROUP BY stage
    `).all() as { stage: string; count: number; totalValue: number; expectedRevenue: number }[];

    const stageMap = new Map(stageRows.map(r => [r.stage, r]));
    const stageSummaries = stages.map(st => {
      const row = stageMap.get(st);
      return {
        stage: st,
        count: row ? Number(row.count) : 0,
        totalValue: row ? Number(row.totalValue) : 0,
        expectedRevenue: row ? Number(row.expectedRevenue) : 0,
      };
    });

    // 5. Recent activities (15 items)
    const recentActivities = this.getAllActivities({ limit: 15 });

    // 6. Upcoming follow-up tasks (due today or later, not done)
    const today = new Date().toISOString().substring(0, 10);
    const upcomingTasks = this.db.prepare(`
      SELECT a.*, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE a.due_date IS NOT NULL
        AND a.is_done = 0
        AND a.due_date >= ?
      ORDER BY a.due_date ASC, a.id ASC
    `).all(today) as unknown as Activity[];

    // 7. Overdue tasks (due before today, not done)
    const overdueTasks = this.db.prepare(`
      SELECT a.*, c.name AS contact_name, d.name AS deal_name
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN deals d ON a.deal_id = d.id
      WHERE a.due_date IS NOT NULL
        AND a.is_done = 0
        AND a.due_date < ?
      ORDER BY a.due_date ASC, a.id ASC
    `).all(today) as unknown as Activity[];

    return {
      totalRevenueWon: Number(wonSummary.total_revenue || 0),
      totalDealsWon: Number(wonSummary.total_count || 0),
      pipelineValue: Number(pipelineSummary.pipeline_value || 0),
      expectedRevenue: Number(pipelineSummary.expected_revenue || 0),
      dealsWonByMonth: wonByMonth,
      stageSummaries,
      recentActivities,
      upcomingTasks,
      overdueTasks,
    };
  }

  // --- Utility / Seed Check ---

  isEmpty(): boolean {
    const orgCount = this.db.prepare(`SELECT COUNT(*) AS count FROM organizations`).get() as { count: number };
    return orgCount.count === 0;
  }

  clearAll() {
    this.db.exec(`
      DELETE FROM activities;
      DELETE FROM deals;
      DELETE FROM contacts;
      DELETE FROM organizations;
    `);
  }
}
