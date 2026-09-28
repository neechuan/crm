import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { CrmDatabase } from './db.ts';
import { seedDatabase } from './seed.ts';
import type { ContactStatus, DealStage, ActivityType } from '../types.ts';

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  db: CrmDatabase
): Promise<boolean> {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = (req.method || 'GET').toUpperCase();

  if (!pathname.startsWith('/api')) {
    return false;
  }

  // Health check
  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
    return true;
  }

  // Seed / Reset
  if (pathname === '/api/seed/reset' && method === 'POST') {
    const data = seedDatabase(db);
    sendJson(res, 200, { message: 'Database reset and seeded', ...data });
    return true;
  }

  // Dashboard
  if (pathname === '/api/dashboard' && method === 'GET') {
    const metrics = db.getDashboardMetrics();
    sendJson(res, 200, metrics);
    return true;
  }

  // --- Organizations ---
  // Matches: /api/organizations or /api/organizations/:id
  const orgMatch = pathname.match(/^\/api\/organizations(?:\/(\d+))?$/);
  if (orgMatch) {
    const id = orgMatch[1] ? Number(orgMatch[1]) : null;

    if (id === null) {
      if (method === 'GET') {
        const q = parsedUrl.searchParams.get('q') || undefined;
        const orgs = db.getAllOrganizations(q);
        sendJson(res, 200, orgs);
        return true;
      }
      if (method === 'POST') {
        const body = await parseJsonBody<{ name: string; website?: string; industry?: string; notes?: string }>(req);
        if (!body.name || !body.name.trim()) {
          sendJson(res, 400, { error: 'Organization name is required' });
          return true;
        }
        const created = db.createOrganization(body);
        sendJson(res, 201, created);
        return true;
      }
    } else {
      if (method === 'GET') {
        const org = db.getOrganizationById(id);
        if (!org) {
          sendJson(res, 404, { error: 'Organization not found' });
          return true;
        }
        sendJson(res, 200, org);
        return true;
      }
      if (method === 'PUT') {
        const body = await parseJsonBody<{ name?: string; website?: string; industry?: string; notes?: string }>(req);
        const updated = db.updateOrganization(id, body);
        if (!updated) {
          sendJson(res, 404, { error: 'Organization not found' });
          return true;
        }
        sendJson(res, 200, updated);
        return true;
      }
      if (method === 'DELETE') {
        const deleted = db.deleteOrganization(id);
        if (!deleted) {
          sendJson(res, 404, { error: 'Organization not found' });
          return true;
        }
        sendJson(res, 200, { success: true });
        return true;
      }
    }
  }

  // --- Contacts ---
  // Matches: /api/contacts or /api/contacts/:id
  const contactMatch = pathname.match(/^\/api\/contacts(?:\/(\d+))?$/);
  if (contactMatch) {
    const id = contactMatch[1] ? Number(contactMatch[1]) : null;

    if (id === null) {
      if (method === 'GET') {
        const q = parsedUrl.searchParams.get('q') || undefined;
        const status = parsedUrl.searchParams.get('status') || undefined;
        const contacts = db.getAllContacts(q, status);
        sendJson(res, 200, contacts);
        return true;
      }
      if (method === 'POST') {
        const body = await parseJsonBody<{
          name: string;
          email: string;
          phone?: string;
          job_title?: string;
          organization_id?: number | null;
          status?: ContactStatus;
        }>(req);
        if (!body.name || !body.email) {
          sendJson(res, 400, { error: 'Name and email are required' });
          return true;
        }
        const created = db.createContact(body);
        sendJson(res, 201, created);
        return true;
      }
    } else {
      if (method === 'GET') {
        const contact = db.getContactById(id);
        if (!contact) {
          sendJson(res, 404, { error: 'Contact not found' });
          return true;
        }
        sendJson(res, 200, contact);
        return true;
      }
      if (method === 'PUT') {
        const body = await parseJsonBody<{
          name?: string;
          email?: string;
          phone?: string;
          job_title?: string;
          organization_id?: number | null;
          status?: ContactStatus;
        }>(req);
        const updated = db.updateContact(id, body);
        if (!updated) {
          sendJson(res, 404, { error: 'Contact not found' });
          return true;
        }
        sendJson(res, 200, updated);
        return true;
      }
      if (method === 'DELETE') {
        const deleted = db.deleteContact(id);
        if (!deleted) {
          sendJson(res, 404, { error: 'Contact not found' });
          return true;
        }
        sendJson(res, 200, { success: true });
        return true;
      }
    }
  }

  // --- Deals ---
  // Matches: /api/deals, /api/deals/:id, /api/deals/:id/stage
  const dealStageMatch = pathname.match(/^\/api\/deals\/(\d+)\/stage$/);
  if (dealStageMatch && method === 'PATCH') {
    const id = Number(dealStageMatch[1]);
    const body = await parseJsonBody<{ stage: DealStage }>(req);
    if (!body.stage) {
      sendJson(res, 400, { error: 'Stage is required' });
      return true;
    }
    const updated = db.updateDealStage(id, body.stage);
    if (!updated) {
      sendJson(res, 404, { error: 'Deal not found' });
      return true;
    }
    sendJson(res, 200, updated);
    return true;
  }

  const dealMatch = pathname.match(/^\/api\/deals(?:\/(\d+))?$/);
  if (dealMatch) {
    const id = dealMatch[1] ? Number(dealMatch[1]) : null;

    if (id === null) {
      if (method === 'GET') {
        const q = parsedUrl.searchParams.get('q') || undefined;
        const stage = parsedUrl.searchParams.get('stage') || undefined;
        const deals = db.getAllDeals(q, stage);
        sendJson(res, 200, deals);
        return true;
      }
      if (method === 'POST') {
        const body = await parseJsonBody<{
          name: string;
          organization_id?: number | null;
          contact_id?: number | null;
          stage?: DealStage;
          value: number;
          probability?: number;
          close_date: string;
        }>(req);
        if (!body.name || body.value === undefined || !body.close_date) {
          sendJson(res, 400, { error: 'Deal name, value, and close_date are required' });
          return true;
        }
        const created = db.createDeal(body);
        sendJson(res, 201, created);
        return true;
      }
    } else {
      if (method === 'GET') {
        const deal = db.getDealById(id);
        if (!deal) {
          sendJson(res, 404, { error: 'Deal not found' });
          return true;
        }
        sendJson(res, 200, deal);
        return true;
      }
      if (method === 'PUT') {
        const body = await parseJsonBody<{
          name?: string;
          organization_id?: number | null;
          contact_id?: number | null;
          stage?: DealStage;
          value?: number;
          probability?: number;
          close_date?: string;
        }>(req);
        const updated = db.updateDeal(id, body);
        if (!updated) {
          sendJson(res, 404, { error: 'Deal not found' });
          return true;
        }
        sendJson(res, 200, updated);
        return true;
      }
      if (method === 'DELETE') {
        const deleted = db.deleteDeal(id);
        if (!deleted) {
          sendJson(res, 404, { error: 'Deal not found' });
          return true;
        }
        sendJson(res, 200, { success: true });
        return true;
      }
    }
  }

  // --- Activities ---
  // Matches: /api/activities, /api/activities/:id, /api/activities/:id/toggle
  const activityToggleMatch = pathname.match(/^\/api\/activities\/(\d+)\/toggle$/);
  if (activityToggleMatch && method === 'PATCH') {
    const id = Number(activityToggleMatch[1]);
    const updated = db.toggleActivityDone(id);
    if (!updated) {
      sendJson(res, 404, { error: 'Activity not found' });
      return true;
    }
    sendJson(res, 200, updated);
    return true;
  }

  const activityMatch = pathname.match(/^\/api\/activities(?:\/(\d+))?$/);
  if (activityMatch) {
    const id = activityMatch[1] ? Number(activityMatch[1]) : null;

    if (id === null) {
      if (method === 'GET') {
        const contactId = parsedUrl.searchParams.get('contact_id');
        const dealId = parsedUrl.searchParams.get('deal_id');
        const limit = parsedUrl.searchParams.get('limit');
        const activities = db.getAllActivities({
          contact_id: contactId ? Number(contactId) : undefined,
          deal_id: dealId ? Number(dealId) : undefined,
          limit: limit ? Number(limit) : undefined,
        });
        sendJson(res, 200, activities);
        return true;
      }
      if (method === 'POST') {
        const body = await parseJsonBody<{
          type: ActivityType;
          contact_id?: number | null;
          deal_id?: number | null;
          description: string;
          happened_at?: string;
          due_date?: string | null;
          is_done?: number;
        }>(req);
        if (!body.type || !body.description) {
          sendJson(res, 400, { error: 'Type and description are required' });
          return true;
        }
        const created = db.createActivity(body);
        sendJson(res, 201, created);
        return true;
      }
    } else {
      if (method === 'GET') {
        const act = db.getActivityById(id);
        if (!act) {
          sendJson(res, 404, { error: 'Activity not found' });
          return true;
        }
        sendJson(res, 200, act);
        return true;
      }
      if (method === 'PUT') {
        const body = await parseJsonBody<{
          type?: ActivityType;
          description?: string;
          due_date?: string | null;
          is_done?: number;
        }>(req);
        const updated = db.updateActivity(id, body);
        if (!updated) {
          sendJson(res, 404, { error: 'Activity not found' });
          return true;
        }
        sendJson(res, 200, updated);
        return true;
      }
      if (method === 'DELETE') {
        const deleted = db.deleteActivity(id);
        if (!deleted) {
          sendJson(res, 404, { error: 'Activity not found' });
          return true;
        }
        sendJson(res, 200, { success: true });
        return true;
      }
    }
  }

  sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
  return true;
}
