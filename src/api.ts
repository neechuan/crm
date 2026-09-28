import type {
  Organization,
  Contact,
  Deal,
  Activity,
  ContactStatus,
  DealStage,
  ActivityType,
  DashboardMetrics,
} from './types.ts';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(handleResponse<{ status: string }>),

  // Reset database
  resetDatabase: () =>
    fetch(`${API_BASE}/seed/reset`, { method: 'POST' }).then(handleResponse<{ message: string }>),

  // Dashboard
  getDashboard: () =>
    fetch(`${API_BASE}/dashboard`).then(handleResponse<DashboardMetrics>),

  // Organizations
  getOrganizations: (search?: string) => {
    const url = new URL(`${API_BASE}/organizations`, window.location.origin);
    if (search) url.searchParams.set('q', search);
    return fetch(url.toString()).then(handleResponse<Organization[]>);
  },

  getOrganization: (id: number) =>
    fetch(`${API_BASE}/organizations/${id}`).then(
      handleResponse<Organization & { contacts: Contact[]; deals: Deal[] }>
    ),

  createOrganization: (data: { name: string; website?: string | null; industry?: string | null; notes?: string | null }) =>
    fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Organization>),

  updateOrganization: (
    id: number,
    data: { name?: string; website?: string | null; industry?: string | null; notes?: string | null }
  ) =>
    fetch(`${API_BASE}/organizations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Organization>),

  deleteOrganization: (id: number) =>
    fetch(`${API_BASE}/organizations/${id}`, { method: 'DELETE' }).then(
      handleResponse<{ success: boolean }>
    ),

  // Contacts
  getContacts: (search?: string, status?: string) => {
    const url = new URL(`${API_BASE}/contacts`, window.location.origin);
    if (search) url.searchParams.set('q', search);
    if (status && status !== 'all') url.searchParams.set('status', status);
    return fetch(url.toString()).then(handleResponse<Contact[]>);
  },

  getContact: (id: number) =>
    fetch(`${API_BASE}/contacts/${id}`).then(
      handleResponse<Contact & { activities: Activity[]; deals: Deal[] }>
    ),

  createContact: (data: {
    name: string;
    email: string;
    phone?: string | null;
    job_title?: string | null;
    organization_id?: number | null;
    status?: ContactStatus;
  }) =>
    fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Contact>),

  updateContact: (
    id: number,
    data: {
      name?: string;
      email?: string;
      phone?: string | null;
      job_title?: string | null;
      organization_id?: number | null;
      status?: ContactStatus;
    }
  ) =>
    fetch(`${API_BASE}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Contact>),

  deleteContact: (id: number) =>
    fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' }).then(
      handleResponse<{ success: boolean }>
    ),

  // Deals
  getDeals: (search?: string, stage?: string) => {
    const url = new URL(`${API_BASE}/deals`, window.location.origin);
    if (search) url.searchParams.set('q', search);
    if (stage && stage !== 'all') url.searchParams.set('stage', stage);
    return fetch(url.toString()).then(handleResponse<Deal[]>);
  },

  getDeal: (id: number) =>
    fetch(`${API_BASE}/deals/${id}`).then(
      handleResponse<Deal & { activities: Activity[] }>
    ),

  createDeal: (data: {
    name: string;
    organization_id?: number | null;
    contact_id?: number | null;
    stage?: DealStage;
    value: number;
    probability?: number;
    close_date: string;
  }) =>
    fetch(`${API_BASE}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Deal>),

  updateDeal: (
    id: number,
    data: {
      name?: string;
      organization_id?: number | null;
      contact_id?: number | null;
      stage?: DealStage;
      value?: number;
      probability?: number;
      close_date?: string;
    }
  ) =>
    fetch(`${API_BASE}/deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Deal>),

  updateDealStage: (id: number, stage: DealStage) =>
    fetch(`${API_BASE}/deals/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    }).then(handleResponse<Deal>),

  deleteDeal: (id: number) =>
    fetch(`${API_BASE}/deals/${id}`, { method: 'DELETE' }).then(
      handleResponse<{ success: boolean }>
    ),

  // Activities
  getActivities: (filters?: { contact_id?: number; deal_id?: number; limit?: number }) => {
    const url = new URL(`${API_BASE}/activities`, window.location.origin);
    if (filters?.contact_id) url.searchParams.set('contact_id', String(filters.contact_id));
    if (filters?.deal_id) url.searchParams.set('deal_id', String(filters.deal_id));
    if (filters?.limit) url.searchParams.set('limit', String(filters.limit));
    return fetch(url.toString()).then(handleResponse<Activity[]>);
  },

  createActivity: (data: {
    type: ActivityType;
    contact_id?: number | null;
    deal_id?: number | null;
    description: string;
    happened_at?: string;
    due_date?: string | null;
    is_done?: number;
  }) =>
    fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Activity>),

  toggleActivityDone: (id: number) =>
    fetch(`${API_BASE}/activities/${id}/toggle`, { method: 'PATCH' }).then(
      handleResponse<Activity>
    ),

  deleteActivity: (id: number) =>
    fetch(`${API_BASE}/activities/${id}`, { method: 'DELETE' }).then(
      handleResponse<{ success: boolean }>
    ),
};
